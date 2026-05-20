# Developer Instructions

The LLM control plane now lives inside the Django `hardware_orch` app. The files in `backend/hardware_orch/deployments/llm/` are model image assets only: manifests, Dockerfiles, model code, and the shared runtime used inside model containers.

## Architecture

Control-plane code:

- `backend/hardware_orch/utils/control_plane.py`: discovers manifests, syncs database records, assigns ports, creates route/runtime specs, creates user-owned deployment rows, and emits local Docker Compose specs.
- `backend/hardware_orch/models.py`: stores `ModelImage` and `ModelImageDeployment`.
- `backend/hardware_orch/views.py`: exposes the Django API endpoints under `/api/hardware/control-plane/`.
- `backend/hardware_orch/serializers.py`: validates control-plane requests and serializes image/deployment records.
- `backend/hardware_orch/urls.py`: routes the control-plane endpoints.

Model-image code:

- `runtime/api.py`: shared FastAPI runtime inside model containers. It is not the control plane.
- `qwen/model_image.json`: Qwen image manifest.
- `mzansilm/model_image.json`: MzansiLM image manifest.
- `qwen/Dockerfile` and `mzansilm/Dockerfile`: model image builds.

## Database Models

`ModelImage` is the registry record for an image. It is synced from `model_image.json` and includes:

- `slug`, `name`, `family`
- Docker image name
- Docker build context and Dockerfile
- internal container port and health path
- runtime environment variables
- endpoint contract

`ModelImageDeployment` is a user-owned deployment plan/record. It includes:

- `owner`: Django user who owns the deployment
- `model_image`: the registered image
- `provider`: `local-docker`, `kubernetes`, `aws-ecs`, or `gcp-cloud-run`
- `status`: `planned`, `deploying`, `running`, `destroying`, `destroyed`, or `failed`
- assigned `host_port`
- generated `runtime` and `routes`
- placeholder JSON fields for `quota`, `billing`, and `iam`

## Run Migrations

```bash
cd backend
python manage.py migrate
```

## Sync Image Manifests

Manifest sync happens automatically when planning if no images exist yet, but developers can explicitly sync:

```bash
curl -X POST http://localhost/api/hardware/control-plane/images/ \
  -H "Authorization: Bearer <token>"
```

## Add Another Model Image

Create a folder under `backend/hardware_orch/deployments/llm/` and add a `model_image.json`:

```json
{
  "slug": "my-model",
  "name": "My Model",
  "family": "llm",
  "image": "registry.example.com/sabhuku/my-model:latest",
  "context": ".",
  "dockerfile": "my-model/Dockerfile",
  "internal_port": 8000,
  "health_path": "/health",
  "env": {
    "LLM_MODEL_PATH": "/app/model",
    "LLM_MODEL_MODULE": "my_model",
    "LLM_MODEL_CLASS": "MyModel"
  },
  "endpoints": [
    {
      "name": "generate",
      "method": "POST",
      "public_path": "/generate",
      "upstream_path": "/generate"
    }
  ]
}
```

The control plane reads this manifest. The image itself only needs to expose the declared endpoints.

## Shared Model Runtime

Model containers can reuse `runtime/api.py` instead of copying API code into every model folder. The Dockerfile should copy `runtime/` and the model module, then set:

- `LLM_MODEL_PATH`: folder containing the model Python file inside the container.
- `LLM_MODEL_MODULE`: Python module name to import.
- `LLM_MODEL_CLASS`: class to instantiate.

The runtime exposes `/health`, `/generate`, and `/v1/chat/completions`, then adapts calls to the model class' `generate` method.

## Provider Integration

Today, provider-specific deployment is represented as data in `ModelImageDeployment.runtime` and `ModelImageDeployment.routes`. The next layer should add provider executors that consume those fields and update:

- `status`
- `provider_resource_id`
- `metadata`
- `quota`
- `billing`
- `iam`

Keep provider APIs out of model images. The control plane owns identity, policy, quota, billing, and reconciliation.
