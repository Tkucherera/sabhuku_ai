# Developer Instructions

This folder packages a standalone LLM inference service for Qwen and compatible Hugging Face causal language models.

## Local Structure

- `api.py`: FastAPI application with `/health`, `/models`, `/generate`, and `/v1/chat/completions`.
- `inference.py`: model registry and `LLMInference` facade.
- `qwen.py`: Qwen/Hugging Face model adapter.
- `Dockerfile`: deployable container image.
- `docker-compose.yml`: local container runtime with a persistent Hugging Face cache volume.

## Run With Docker

```bash
cd backend/hardware_orch/deployments/llm
docker compose up --build
```

The API will be available at `http://localhost:8001` by default.

## Configuration

Use environment variables to select the model and runtime behavior:

- `LLM_MODEL_NAME`: registry key. Defaults to `qwen`.
- `LLM_MODEL_ID`: Hugging Face model id. Defaults to `Qwen/Qwen2.5-1.5B-Instruct`.
- `LLM_DEVICE`: passed to `device_map`. Defaults to `auto`.
- `LLM_DTYPE`: `auto`, `float16`, `bfloat16`, or `float32`.
- `LLM_TRUST_REMOTE_CODE`: `true` or `false`. Defaults to `true`.
- `LLM_PORT`: host port for Docker Compose. Defaults to `8001`.

Example:

```bash
LLM_MODEL_ID=Qwen/Qwen2.5-0.5B-Instruct LLM_PORT=8010 docker compose up --build
```

## Add Another LLM

1. Create a new adapter class with a `generate(messages, generation_config)` method.
2. Add a loader function in `inference.py`.
3. Register it in `MODEL_REGISTRY`.
4. Set `LLM_MODEL_NAME` to the new registry key.

Keep adapters import-safe. Do not run test prompts or load models at module import time unless the API explicitly asks for it.

## API Contract

Simple generation:

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is the capital of Zimbabwe?"}]}'
```

OpenAI-style chat completion:

```bash
curl -X POST http://localhost:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Write a short greeting in Shona."}]}'
```

Streaming is not implemented yet. Requests with `"stream": true` return `400`.
