# User Guide

This service lets you send chat messages to a deployed LLM and receive generated text.

## Start The Service

```bash
cd backend/hardware_orch/deployments/llm
docker compose up --build
```

Open `http://localhost:8001/health` to confirm the API is running.

## Send A Prompt

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain crop rotation in simple terms."}
    ],
    "max_new_tokens": 200
  }'
```

The response will include the model name, model id, and generated text.

## Use The Chat Endpoint

```bash
curl -X POST http://localhost:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful agriculture assistant."},
      {"role": "user", "content": "How do I identify nitrogen deficiency in maize?"}
    ]
  }'
```

## Change The Model

Set `LLM_MODEL_ID` before starting Docker Compose:

```bash
LLM_MODEL_ID=Qwen/Qwen2.5-0.5B-Instruct docker compose up --build
```

The model must be available from Hugging Face or already present in the container cache.
