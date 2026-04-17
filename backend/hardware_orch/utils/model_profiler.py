"""
Author: Tinashe Kucherera
Date: 2026-04-16

Note: This module is for model profiling and performance analysis. It provides tools 
to figure out the computational requirements of a model, such as FLOPs, parameter count, 
and memory usage. This information is crucial for optimizing models and understanding 
their performance characteristics.


Basic usage:
    from model_profiler import create_profiler
    profile = create_profiler("path/to/model").get_profile()
    print(profile.summary())

Supported formats/frameworks:
- HuggingFace Transformers (via AutoModel + config)
- ONNX models (via onnx library)
- PyTorch checkpoints (via torch.load with map_location='meta')
- TensorFlow SavedModels and Keras .h5 files (via tf.saved_model.load or tf.keras.models.load_model)

""" 
from __future__ import annotations
import json 
import numpy as np

# Hugging face 

try: 
    from transformers import AutoModel, AutoConfig, BitsAndBytesConfig
except ImportError:
    print("Transformers library not found. HuggingFaceModelProfiler will not work.")
    transformers = None

# Pytorch
try:
    import torch
except ImportError:
    print("PyTorch library not found. PyTorchModelProfiler will not work.")
    torch = None

# ONNX
try:
    import onnx 
except ImportError:
    print("ONNX library not found. ONNXModelProfiler will not work.")
    onnx = None

try:
    import tensorflow as tf
except ImportError:
    print("TensorFlow library not found. TensorFlowModelProfiler will not work.")
    tf = None



import dataclasses
import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


# Architecture taxonomy


MODEL_ARCHITECTURES: dict[str, dict[str, list[str]]] = {
    "transformer": {
        "decoder_only":   ["gpt", "llama", "mistral", "falcon", "bloom", "qwen", "phi", "gemma"],
        "encoder_only":   ["bert", "roberta", "distilbert", "electra", "albert", "deberta"],
        "encoder_decoder":["t5", "bart", "pegasus", "mbart", "flan", "ul2"],
    },
    "vision_transformer": {
        "encoder_only":   ["vit", "deit", "beit", "swin"],
        "encoder_decoder":["sam", "ijepa"],
    },
    "cnn": {
        "encoder_only":   ["resnet", "vgg", "inception", "efficientnet", "convnext", "densenet", "mobilenet"],
    },
    "rnn": {
        "seq2seq":        ["lstm", "gru", "rnn"],
    },
    "gnn": {
        "encoder_only":   ["gcn", "gat", "sage", "gin"],
    },
    "diffusion": {
        "unet":           ["unet", "stable-diffusion", "sdxl", "ddpm"],
    },
    "multimodal": {
        "encoder_decoder":["clip", "llava", "flamingo", "blip", "idefics"],
    },
}

# Dtype byte widths
DTYPE_BYTES: dict[str, float] = {
    # PyTorch / numpy names
    "float32": 4.0, "float":    4.0,
    "float16": 2.0, "half":     2.0,
    "bfloat16":2.0,
    "int8":    1.0,
    "int4":    0.5,   # NF4 / GPTQ
    "int32":   4.0,
    "float64": 8.0, "double":   8.0,
    # ONNX TensorProto DataType ints
    "1": 4.0,  # FLOAT
    "2": 1.0,  # UINT8
    "3": 1.0,  # INT8
    "5": 4.0,  # INT32
    "6": 8.0,  # INT64
    "10":2.0,  # FLOAT16
    "11":8.0,  # DOUBLE
    "16":2.0,  # BFLOAT16
}

OVERHEAD_FACTOR = 1.25  # activations + framework + KV cache headroom



# Hardware profile data class (output of the profiler)

@dataclasses.dataclass
class HardwareProfile:
    """All signals the hardware scoring engine needs."""

    # Core sizing
    parameter_count: int = 0
    vram_needed_gb: float = 0.0         # minimum VRAM to load the model
    dtype: str = "float32"
    bytes_per_param: float = 4.0

    # Compute class
    architecture_family: str = "unknown"  # transformer / cnn / rnn / …
    architecture_subtype: str = "unknown" # decoder_only / encoder_only / …
    compute_class: str = "unknown"        # memory_bw_bound | compute_bound | cpu_viable

    # Throughput hints
    estimated_flops: Optional[int] = None
    max_sequence_length: Optional[int] = None
    hidden_size: Optional[int] = None
    num_layers: Optional[int] = None

    # Compatibility flags
    compat_flags: set = dataclasses.field(default_factory=set)
    # e.g. {"requires_gpu", "requires_ampere", "requires_nvidia", "cpu_ok", "tpu_compiled"}

    def to_dict(self) -> dict:
        d = dataclasses.asdict(self)
        d["compat_flags"] = list(self.compat_flags)
        return d

    def summary(self) -> str:
        return (
            f"Params: {self.parameter_count:,}  |  "
            f"VRAM ≥ {self.vram_needed_gb:.1f} GB  |  "
            f"dtype: {self.dtype}  |  "
            f"arch: {self.architecture_family}/{self.architecture_subtype}  |  "
            f"compute class: {self.compute_class}  |  "
            f"flags: {self.compat_flags}"
        )



# Helpers


def _resolve_dtype_bytes(dtype_str: str) -> float:
    """Return bytes-per-parameter for a dtype string."""
    return DTYPE_BYTES.get(str(dtype_str).lower(), 4.0)


def _vram_from_params(n_params: int, bytes_per_param: float) -> float:
    """Return minimum VRAM in GiB."""
    return (n_params * bytes_per_param * OVERHEAD_FACTOR) / (1024 ** 3)


def _classify_architecture(name: str) -> tuple[str, str]:
    """
    Match a model name / architecture string against the taxonomy.
    Returns (family, subtype).
    """
    name_lower = name.lower()
    for family, subtypes in MODEL_ARCHITECTURES.items():
        for subtype, keywords in subtypes.items():
            if any(kw in name_lower for kw in keywords):
                return family, subtype
    return "unknown", "unknown"


def _compute_class(family: str, subtype: str, n_params: int) -> str:
    """
    Derive compute bottleneck class.

    - decoder_only transformers → memory-bandwidth-bound (token generation is IO-bound)
    - encoder_only at small scale → cpu_viable
    - CNNs → compute_bound
    - everything else → gpu_general
    """
    if family == "transformer" and subtype == "decoder_only":
        return "memory_bw_bound"
    if family == "cnn":
        return "compute_bound"
    if family in ("transformer", "vision_transformer") and subtype == "encoder_only":
        if n_params < 500_000_000:          # < 500M params
            return "cpu_viable"
        return "memory_bw_bound"
    if family == "rnn":
        return "cpu_viable" if n_params < 100_000_000 else "memory_bw_bound"
    return "gpu_general"


def _compat_flags_from_profile(
    family: str,
    subtype: str,
    n_params: int,
    compute_class: str,
    has_flash_attn: bool = False,
) -> set[str]:
    flags: set[str] = set()

    if compute_class == "cpu_viable":
        flags.add("cpu_ok")
    else:
        flags.add("requires_gpu")

    if has_flash_attn:
        flags.add("requires_ampere")   # FlashAttention needs sm_80+
        flags.add("requires_nvidia")

    if family == "diffusion":
        flags.add("requires_gpu")
        flags.discard("cpu_ok")

    if n_params > 30_000_000_000:       # > 30B
        flags.add("multi_gpu_likely")

    return flags



# Base profiler


class ModelProfiler:
    """Abstract base — subclasses implement framework-specific extraction."""

    def __init__(self, model, model_type: str = "pytorch"):
        self.model = model
        self.model_type = model_type
        self._profile: Optional[HardwareProfile] = None


    # Public API

    def get_profile(self) -> HardwareProfile:
        """Run all extraction steps and return a HardwareProfile."""
        if self._profile is not None:
            return self._profile

        n_params   = self._count_parameters()
        dtype_str  = self._get_dtype()
        bpp        = _resolve_dtype_bytes(dtype_str)
        vram_gb    = _vram_from_params(n_params, bpp)
        arch_name  = self._get_architecture()
        family, subtype = _classify_architecture(arch_name)
        cc         = _compute_class(family, subtype, n_params)
        flops      = self._calculate_flops(n_params)
        seq_len, hidden, n_layers = self._get_transformer_dims()
        has_flash  = self._has_flash_attention()
        flags      = _compat_flags_from_profile(family, subtype, n_params, cc, has_flash)

        self._profile = HardwareProfile(
            parameter_count     = n_params,
            vram_needed_gb      = vram_gb,
            dtype               = dtype_str,
            bytes_per_param     = bpp,
            architecture_family = family,
            architecture_subtype= subtype,
            compute_class       = cc,
            estimated_flops     = flops,
            max_sequence_length = seq_len,
            hidden_size         = hidden,
            num_layers          = n_layers,
            compat_flags        = flags,
        )
        return self._profile

    
    # Abstract methods — framework subclasses implement these
    

    def _count_parameters(self) -> int:
        raise NotImplementedError

    def _calculate_flops(self, n_params: int) -> Optional[int]:
        raise NotImplementedError

    def _get_dtype(self) -> str:
        raise NotImplementedError

    def _get_architecture(self) -> str:
        raise NotImplementedError

    def _get_transformer_dims(self) -> tuple[Optional[int], Optional[int], Optional[int]]:
        """Return (max_seq_len, hidden_size, num_layers). Return None for non-transformers."""
        raise NotImplementedError

    def _has_flash_attention(self) -> bool:
        """Return True if the model uses Flash Attention ops (requires Ampere GPU)."""
        return False



# HuggingFace profiler


class HuggingFaceModelProfiler(ModelProfiler):
    """
    Profiles HuggingFace models.
    Loads the model using AutoModel + the config — weights are loaded
    because HF doesn't expose a zero-copy metadata path for all models.
    For very large models pass a local path with load_in_4bit=True to avoid OOM.
    """

    def __init__(self, model_name_or_path: str, load_in_4bit: bool = False):
        

        self.config = AutoConfig.from_pretrained(model_name_or_path)
        self.model_name = model_name_or_path

        if load_in_4bit:
            bnb_config = BitsAndBytesConfig(load_in_4bit=True)
            model = AutoModel.from_pretrained(
                model_name_or_path,
                quantization_config=bnb_config,
                device_map="auto",
            )
        else:
            model = AutoModel.from_pretrained(model_name_or_path)

        super().__init__(model, model_type="huggingface")

    

    def _count_parameters(self) -> int:
        return sum(p.numel() for p in self.model.parameters())

    def _calculate_flops(self, n_params: int) -> int:
        """
        Rough FLOPs estimate for a forward pass.

        For transformer decoders: 2 × n_params × seq_len  (standard approximation)
        Reference: https://arxiv.org/abs/2001.08361
        """
        seq_len = getattr(self.config, "max_position_embeddings", 2048) or 2048
        return 2 * n_params * seq_len

    def _get_dtype(self) -> str:
        """Detect the predominant dtype from the first few parameters."""
        for p in self.model.parameters():
            return str(p.dtype).replace("torch.", "")
        return "float32"

    def _get_architecture(self) -> str:
        """
        Best-effort architecture name from config.
        Falls back to the model class name.
        """
        arch_list = getattr(self.config, "architectures", None)
        if arch_list:
            return arch_list[0]
        return type(self.model).__name__

    def _get_transformer_dims(self):
        seq_len = getattr(self.config, "max_position_embeddings", None)
        hidden  = getattr(self.config, "hidden_size", None)
        n_layers= (
            getattr(self.config, "num_hidden_layers", None)
            or getattr(self.config, "n_layer", None)
        )
        return seq_len, hidden, n_layers

    def _has_flash_attention(self) -> bool:
        attn_impl = getattr(self.config, "_attn_implementation", "") or ""
        return "flash" in attn_impl.lower()



# ONNX profiler


class ONNXModelProfiler(ModelProfiler):
    """
    Profiles ONNX models by inspecting the graph without loading weights
    into device memory.
    """

    # ONNX TensorProto DataType enum → human-readable name
    _ONNX_DTYPE_MAP = {
        1: "float32", 2: "uint8",  3: "int8",
        5: "int32",   6: "int64",  10: "float16",
        11: "float64",16: "bfloat16",
    }

    def __init__(self, model_path: str):
        # load_external_data=False avoids pulling large weight files
        model = onnx.load_model_with_external_data(model_path, load_external_data=False)
        self.model_path = model_path
        super().__init__(model, model_type="onnx")


    def _count_parameters(self) -> int:
        return int(sum(np.prod(t.dims) for t in self.model.graph.initializer))

    def _calculate_flops(self, n_params: int) -> Optional[int]:
        """
        Count MACs by iterating over MatMul / Gemm / Conv nodes.
        This is a lower-bound estimate; activation functions are ignored.
        """
        flops = 0
        init_shapes: dict[str, list[int]] = {
            t.name: list(t.dims) for t in self.model.graph.initializer
        }
        for node in self.model.graph.node:
            if node.op_type in ("MatMul", "Gemm"):
                # Try to get weight dims from the initializer
                for inp in node.input:
                    if inp in init_shapes:
                        dims = init_shapes[inp]
                        if len(dims) >= 2:
                            flops += 2 * int(np.prod(dims))
                            break
            elif node.op_type == "Conv":
                for inp in node.input[1:2]:  # weight tensor
                    if inp in init_shapes:
                        dims = init_shapes[inp]
                        if len(dims) >= 2:
                            flops += 2 * int(np.prod(dims))
                            break
        return flops or (2 * n_params * 512)  # fallback estimate

    def _get_dtype(self) -> str:
        """Pick dtype from the first initializer that has a known type."""
        for tensor in self.model.graph.initializer:
            dtype_int = tensor.data_type
            if dtype_int in self._ONNX_DTYPE_MAP:
                return self._ONNX_DTYPE_MAP[dtype_int]
        return "float32"

    def _get_architecture(self) -> str:
        """
        Detect architecture from op patterns in the graph.
        Falls back to the model's doc_string or 'unknown'.
        """
        op_types = {n.op_type for n in self.model.graph.node}

        if "Attention" in op_types or "MultiHeadAttention" in op_types:
            # Check for decoder pattern: causal masking ops
            if "Where" in op_types and "Softmax" in op_types:
                return "gpt"          # decoder-only heuristic
            return "bert"             # encoder-only heuristic

        if "Conv" in op_types and "BatchNormalization" in op_types:
            return "resnet"

        if "LSTM" in op_types or "GRU" in op_types:
            return list(op_types & {"LSTM", "GRU"})[0].lower()

        # Fall back to model metadata
        for prop in self.model.metadata_props:
            if prop.key in ("model_type", "architecture"):
                return prop.value

        return self.model.doc_string or "unknown"

    def _get_transformer_dims(self):
        """Extract hidden size from the first weight matrix if available."""
        for tensor in self.model.graph.initializer:
            if len(tensor.dims) == 2:
                hidden = max(tensor.dims)
                return None, hidden, None
        return None, None, None

    def _has_flash_attention(self) -> bool:
        op_types = {n.op_type for n in self.model.graph.node}
        return "FlashAttention" in op_types



# PyTorch profiler


class PyTorchModelProfiler(ModelProfiler):
    """
    Profiles a raw PyTorch checkpoint (.pt / .pth / safetensors).
    Uses map_location='meta' so weight data is never copied to RAM.
    """

    def __init__(self, model_path: str):
        import torch
        # 'meta' device: tensors have shape/dtype but no storage
        state_dict = torch.load(model_path, map_location="meta", weights_only=True)
        self.state_dict = state_dict
        self.model_path = model_path
        super().__init__(state_dict, model_type="pytorch")

  

    def _count_parameters(self) -> int:
        return sum(v.numel() for v in self.state_dict.values())

    def _calculate_flops(self, n_params: int) -> int:
        """
        For a pure state-dict we don't have the graph, so fall back to
        the 2 × params × seq_len approximation used for transformers.
        """
        return 2 * n_params * 2048

    def _get_dtype(self) -> str:
        for tensor in self.state_dict.values():
            return str(tensor.dtype).replace("torch.", "")
        return "float32"

    def _get_architecture(self) -> str:
        """
        Infer arch from state_dict key patterns.
        - 'transformer.h.' / 'model.layers.' → GPT-style decoder
        - 'encoder.layer.' / 'embeddings.'   → BERT-style encoder
        - 'layer1.' / 'conv1.'               → ResNet-style CNN
        """
        keys = list(self.state_dict.keys())
        key_str = " ".join(keys[:60])  # sample first 60 keys

        patterns = [
            ("gpt",    ["transformer.h.", "model.layers.", "model.decoder."]),
            ("bert",   ["encoder.layer.", "embeddings.word_embeddings"]),
            ("t5",     ["encoder.block.", "decoder.block."]),
            ("resnet", ["layer1.", "layer2.", "conv1.", "bn1."]),
            ("vit",    ["blocks.", "patch_embed.", "cls_token"]),
            ("lstm",   ["lstm.", "rnn.", "_all_weights"]),
        ]
        for arch_name, hints in patterns:
            if any(h in key_str for h in hints):
                return arch_name

        return "unknown"

    def _get_transformer_dims(self):
        """
        Derive hidden_size and num_layers from weight shapes.
        Looks for the first embedding or attention projection matrix.
        """
        hidden = None
        n_layers = 0
        for key, tensor in self.state_dict.items():
            if "embed" in key and tensor.ndim == 2:
                hidden = tensor.shape[1]
            if any(tag in key for tag in [".layer.", ".layers.", ".h.", ".block."]):
                try:
                    # Extract layer index from the key, e.g. "transformer.h.23.attn"
                    idx = int([p for p in key.split(".") if p.isdigit()][0])
                    n_layers = max(n_layers, idx + 1)
                except (IndexError, ValueError):
                    pass
        return None, hidden, n_layers or None

    def _has_flash_attention(self) -> bool:
        return any("flash" in k.lower() for k in self.state_dict.keys())



# TensorFlow / SavedModel profiler


class TensorFlowModelProfiler(ModelProfiler):
    """
    Profiles a TensorFlow SavedModel directory or Keras .h5 file.
    """

    def __init__(self, model_path: str):
        try:
            model = tf.saved_model.load(model_path)
        except Exception:
            model = tf.keras.models.load_model(model_path)
        super().__init__(model, model_type="tensorflow")



    def _count_parameters(self) -> int:

        total = 0
        for var in self.model.variables:
            total += int(np.prod(var.shape))
        return total

    def _calculate_flops(self, n_params: int) -> int:
        return 2 * n_params * 2048  # approximate

    def _get_dtype(self) -> str:
        for var in self.model.variables:
            return var.dtype.name
        return "float32"

    def _get_architecture(self) -> str:
        name = type(self.model).__name__.lower()
        for arch, subtypes in MODEL_ARCHITECTURES.items():
            for subtype, keywords in subtypes.items():
                if any(kw in name for kw in keywords):
                    return arch
        return name

    def _get_transformer_dims(self):
        return None, None, None

    def _has_flash_attention(self) -> bool:
        return False



#  auto-detect format


def create_profiler(model_path: str, **kwargs) -> ModelProfiler:
    """
    Instantiate the right profiler based on file extension / directory contents.

    Usage:
        profile = create_profiler("path/to/model").get_profile()
    """
    import os
    path_lower = model_path.lower()

    if path_lower.endswith(".onnx"):
        return ONNXModelProfiler(model_path)

    if path_lower.endswith((".pt", ".pth", ".bin", ".safetensors")):
        return PyTorchModelProfiler(model_path)

    if path_lower.endswith((".h5", ".keras")):
        return TensorFlowModelProfiler(model_path)

    if os.path.isdir(model_path):
        # HuggingFace model directory: must have config.json
        if os.path.exists(os.path.join(model_path, "config.json")):
            return HuggingFaceModelProfiler(model_path, **kwargs)
        # TF SavedModel directory: has saved_model.pb
        if os.path.exists(os.path.join(model_path, "saved_model.pb")):
            return TensorFlowModelProfiler(model_path)

    raise ValueError(
        f"Cannot infer model format from path: {model_path}. "
        "Pass the profiler class explicitly."
    )



# CLI / quick test


if __name__ == "__main__":
    import sys
    import json

    path = sys.argv[1] if len(sys.argv) > 1 else \
        "/home/tinashe/Desktop/projects/sabhuku_ai/backend/hardware_orch/test_models/distilgpt2/"

    print(f"\nProfiling: {path}\n")
    profiler = create_profiler(path)
    profile  = profiler.get_profile()

    print(profile.summary())
    print("\nFull profile JSON:")
    print(json.dumps(profile.to_dict(), indent=2))