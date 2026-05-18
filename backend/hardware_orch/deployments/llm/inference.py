"""
Model registry and inference facade for the LLM deployment.

The API layer should depend on ``LLMInference`` instead of importing a model
adapter directly. To add another provider, create an adapter class with a
``generate`` method and register a loader in ``MODEL_REGISTRY``.
"""

from __future__ import annotations

import os
from collections.abc import Callable

from qwen import DEFAULT_QWEN_MODEL_ID, GenerationConfig, QwenCausalLM


ModelLoader = Callable[[str], QwenCausalLM]


def _load_qwen(model_id: str) -> QwenCausalLM:
    return QwenCausalLM(
        model_id=model_id,
        device=os.getenv("LLM_DEVICE", "auto"),
        dtype=os.getenv("LLM_DTYPE", "auto"),
        trust_remote_code=os.getenv("LLM_TRUST_REMOTE_CODE", "true").lower() == "true",
    )


MODEL_REGISTRY: dict[str, ModelLoader] = {
    "qwen": _load_qwen,
    "qwen2_5_1_5b_instruct": _load_qwen,
    "qwen3_5_2b_base": _load_qwen,
}


class LLMInference:
    def __init__(self, model_name: str | None = None, model_id: str | None = None):
        self.model_name = model_name or os.getenv("LLM_MODEL_NAME", "qwen")
        self.model_id = model_id or os.getenv("LLM_MODEL_ID", DEFAULT_QWEN_MODEL_ID)

        if self.model_name not in MODEL_REGISTRY:
            supported_models = ", ".join(sorted(MODEL_REGISTRY))
            raise ValueError(
                f"Model {self.model_name} is not supported. "
                f"Supported model names: {supported_models}"
            )

        self.model = MODEL_REGISTRY[self.model_name](self.model_id)

    def generate(
        self,
        messages: list[dict[str, str]],
        generation_config: GenerationConfig | None = None,
    ) -> str:
        return self.model.generate(messages, generation_config)
