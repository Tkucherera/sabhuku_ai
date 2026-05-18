from __future__ import annotations

import os
import time
import uuid
from threading import Lock
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from inference import LLMInference, MODEL_REGISTRY
from qwen import DEFAULT_QWEN_MODEL_ID, GenerationConfig


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1)


class GenerateRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    model: str | None = None
    model_id: str | None = None
    max_new_tokens: int = Field(default=256, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    do_sample: bool = True


class GenerateResponse(BaseModel):
    model: str
    model_id: str
    response: str


class ChatCompletionRequest(GenerateRequest):
    stream: bool = False


class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: list[ChatCompletionChoice]


app = FastAPI(
    title="Sabhuku LLM Inference API",
    version="0.1.0",
    description="Containerized API for Qwen or compatible Hugging Face causal LLMs.",
)

_inference: LLMInference | None = None
_inference_key: tuple[str, str] | None = None
_model_lock = Lock()


def _default_model_name() -> str:
    return os.getenv("LLM_MODEL_NAME", "qwen")


def _default_model_id() -> str:
    return os.getenv("LLM_MODEL_ID", DEFAULT_QWEN_MODEL_ID)


def _get_inference(model_name: str | None, model_id: str | None) -> LLMInference:
    global _inference, _inference_key

    resolved_model_name = model_name or _default_model_name()
    resolved_model_id = model_id or _default_model_id()
    key = (resolved_model_name, resolved_model_id)

    with _model_lock:
        if _inference is None or _inference_key != key:
            _inference = LLMInference(
                model_name=resolved_model_name,
                model_id=resolved_model_id,
            )
            _inference_key = key
        return _inference


def _generation_config(request: GenerateRequest) -> GenerationConfig:
    return GenerationConfig(
        max_new_tokens=request.max_new_tokens,
        temperature=request.temperature,
        top_p=request.top_p,
        do_sample=request.do_sample,
    )


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "model_loaded": _inference is not None,
        "model": _inference_key[0] if _inference_key else _default_model_name(),
        "model_id": _inference_key[1] if _inference_key else _default_model_id(),
    }


@app.get("/models")
def models() -> dict[str, list[str] | str]:
    return {
        "default_model": _default_model_name(),
        "default_model_id": _default_model_id(),
        "supported_models": sorted(MODEL_REGISTRY),
    }


@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest) -> GenerateResponse:
    try:
        inference = _get_inference(request.model, request.model_id)
        response = inference.generate(
            [message.model_dump() for message in request.messages],
            _generation_config(request),
        )
        return GenerateResponse(
            model=inference.model_name,
            model_id=inference.model_id,
            response=response,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {exc}") from exc


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
def chat_completions(request: ChatCompletionRequest) -> ChatCompletionResponse:
    if request.stream:
        raise HTTPException(status_code=400, detail="Streaming responses are not supported yet.")

    generated = generate(request)
    return ChatCompletionResponse(
        id=f"chatcmpl-{uuid.uuid4().hex}",
        created=int(time.time()),
        model=generated.model,
        choices=[
            ChatCompletionChoice(
                index=0,
                message=ChatMessage(role="assistant", content=generated.response),
                finish_reason="stop",
            )
        ],
    )
