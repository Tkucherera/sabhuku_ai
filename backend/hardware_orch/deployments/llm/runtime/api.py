from __future__ import annotations

import importlib
import inspect
import os
import sys
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


MODEL_PATH = Path(os.getenv("LLM_MODEL_PATH", "/app/model"))
MODEL_MODULE = os.getenv("LLM_MODEL_MODULE", "model")
MODEL_CLASS = os.getenv("LLM_MODEL_CLASS", "Model")

if str(MODEL_PATH) not in sys.path:
    sys.path.insert(0, str(MODEL_PATH))


@dataclass(frozen=True)
class GenerationConfig:
    max_new_tokens: int = 256
    temperature: float = 0.7
    top_p: float = 0.9
    do_sample: bool = True


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1)


class GenerateRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    max_new_tokens: int = Field(default=256, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    do_sample: bool = True


class GenerateResponse(BaseModel):
    model: str
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
    title="Sabhuku Model Runtime",
    version="0.1.0",
    description="Shared model-image runtime API.",
)

_model = None


def _load_model():
    global _model
    if _model is None:
        module = importlib.import_module(MODEL_MODULE)
        model_class = getattr(module, MODEL_CLASS)
        _model = model_class()
    return _model


def _messages_to_prompt(messages: list[dict[str, str]]) -> str:
    return "\n".join(f"{message['role']}: {message['content']}" for message in messages)


def _call_generate(model, messages: list[dict[str, str]], config: GenerationConfig) -> str:
    generate = model.generate
    parameters = inspect.signature(generate).parameters

    if "messages" in parameters or "generation_config" in parameters:
        try:
            return generate(messages=messages, generation_config=config)
        except TypeError:
            return generate(messages, config)

    prompt = _messages_to_prompt(messages)
    if "max_length" in parameters:
        return generate(prompt, max_length=config.max_new_tokens)
    if "max_new_tokens" in parameters:
        return generate(prompt, max_new_tokens=config.max_new_tokens)
    return generate(prompt)


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
        "model_module": MODEL_MODULE,
        "model_class": MODEL_CLASS,
        "model_loaded": _model is not None,
    }


@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest) -> GenerateResponse:
    try:
        model = _load_model()
        response = _call_generate(
            model,
            [message.model_dump() for message in request.messages],
            _generation_config(request),
        )
        return GenerateResponse(model=MODEL_MODULE, response=response)
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
