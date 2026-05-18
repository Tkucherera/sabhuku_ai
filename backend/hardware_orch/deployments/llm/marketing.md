# Marketing Notes

Sabhuku LLM Inference provides a container-ready API for deploying Qwen and other Hugging Face language models behind a clean HTTP interface.

## Positioning

This service gives Sabhuku AI a practical path to self-hosted language intelligence. Teams can deploy a selected LLM, expose it through a simple API, and keep model choice flexible as hardware, cost, and quality needs evolve.

## Key Benefits

- Containerized deployment for local, cloud, and GPU-backed environments.
- Qwen support out of the box with room for additional LLM adapters.
- OpenAI-style chat endpoint for easier client integration.
- Persistent model cache for faster restarts.
- Environment-based model selection without code changes.

## Suggested Messaging

"Deploy Qwen or another supported LLM as a private, Dockerized inference API for Sabhuku AI workflows."

## Target Users

- Developers building AI features into Sabhuku.
- Platform teams deploying model endpoints.
- Product teams evaluating self-hosted LLM capabilities.

## Current Limitations

- Streaming responses are not available yet.
- The first request can be slow because the model loads lazily.
- Production deployments should add authentication, request logging, and resource limits at the platform layer.
