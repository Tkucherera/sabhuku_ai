"""
Qwen-backed text generation adapters.

The API server talks to model adapters through a small common interface:
``generate(messages, generation_config) -> str``. New LLMs can be added by
creating another adapter with the same interface and registering it in
``inference.py``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


DEFAULT_QWEN_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"


@dataclass(frozen=True)
class GenerationConfig:
    max_new_tokens: int = 256
    temperature: float = 0.7
    top_p: float = 0.9
    do_sample: bool = True


class QwenCausalLM:
    def __init__(
        self,
        model_id: str = DEFAULT_QWEN_MODEL_ID,
        device: str = "auto",
        dtype: str = "auto",
        trust_remote_code: bool = True,
    ):
        self.model_id = model_id
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_id,
            trust_remote_code=trust_remote_code,
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map=device,
            torch_dtype=self._resolve_dtype(dtype),
            trust_remote_code=trust_remote_code,
        )

        if self.tokenizer.pad_token_id is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

    def preprocess(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        if hasattr(self.tokenizer, "apply_chat_template"):
            return self.tokenizer.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
            ).to(self.model.device)

        prompt = "\n".join(f"{message['role']}: {message['content']}" for message in messages)
        return self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

    def generate(
        self,
        messages: list[dict[str, str]],
        generation_config: GenerationConfig | None = None,
    ) -> str:
        config = generation_config or GenerationConfig()
        inputs = self.preprocess(messages)
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=config.max_new_tokens,
            temperature=config.temperature,
            top_p=config.top_p,
            do_sample=config.do_sample,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )
        new_tokens = outputs[0][inputs["input_ids"].shape[-1] :]
        return self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    @staticmethod
    def _resolve_dtype(dtype: str):
        if dtype == "auto":
            return "auto"
        if dtype == "float16":
            return torch.float16
        if dtype == "bfloat16":
            return torch.bfloat16
        if dtype == "float32":
            return torch.float32
        raise ValueError(f"Unsupported torch dtype: {dtype}")


class QwenModel3_5_2B_Base(QwenCausalLM):
    """
    Backwards-compatible alias for earlier code.

    Pass ``model_id`` if you want to target a specific Qwen checkpoint.
    """

    def __init__(self, model_id: str = DEFAULT_QWEN_MODEL_ID):
        super().__init__(model_id=model_id)
