# User Guide

The LLM control plane is part of the Django backend. It registers model images, creates deployment plans, assigns ports/routes, and stores deployments against authenticated users.

## Base URL

All endpoints are under:

```text
/api/hardware/control-plane/
```

If you are running the existing Docker Compose setup through nginx, use:

```text
http://localhost/api/hardware/control-plane/
```

## Authentication

Creating deployments, syncing manifests, destroying deployments, and generating Compose specs require an authenticated Django user.

Use the same authentication mechanism as the rest of the backend, for example:

```bash
Authorization: Bearer <access-token>
```

## List Model Images

```bash
curl http://localhost/api/hardware/control-plane/images/
```

This returns the registered image records. The endpoint also syncs local manifests before returning the list.

## Create A Deployment Plan

Planning does not create database deployment rows. It shows what would be deployed.

```bash
curl -X POST http://localhost/api/hardware/control-plane/deployments/plan/ \
  -H "Content-Type: application/json" \
  -d '{
    "models": ["qwen", "mzansilm"],
    "provider": "local-docker",
    "public_host": "http://localhost",
    "host_base_port": 8100
  }'
```

The response contains:

- `runtimes`: image, Dockerfile, service name, env, internal port, assigned host port.
- `routes`: public endpoint URLs and upstream service URLs.

Example behavior:

- `qwen` gets `8100`.
- `mzansilm` gets `8101`.
- both containers still listen internally on `8000`.

## Create User-Owned Deployments

This persists deployment records owned by the authenticated user.

```bash
curl -X POST http://localhost/api/hardware/control-plane/deployments/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "models": ["qwen", "mzansilm"],
    "provider": "local-docker",
    "public_host": "http://localhost",
    "host_base_port": 8100
  }'
```

The deployments start with status `planned`. A later provider executor can turn those records into real Kubernetes/ECS/Cloud Run resources and update status to `deploying` or `running`.

## List Your Deployments

```bash
curl http://localhost/api/hardware/control-plane/deployments/ \
  -H "Authorization: Bearer <access-token>"
```

Users only see their own deployment records.

## Get One Deployment

```bash
curl http://localhost/api/hardware/control-plane/deployments/1/ \
  -H "Authorization: Bearer <access-token>"
```

## Mark A Deployment Destroyed

```bash
curl -X POST http://localhost/api/hardware/control-plane/deployments/1/destroy/ \
  -H "Authorization: Bearer <access-token>"
```

This updates the database status to `destroyed`. It does not yet call a cloud provider API to delete a real runtime.

## Generate A Local Docker Compose Spec

After creating deployments, you can request a Compose spec for local testing:

```bash
curl -X POST http://localhost/api/hardware/control-plane/compose/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_ids": [1, 2],
    "project_name": "sabhuku-llm"
  }'
```

The returned JSON is a Docker Compose structure. It is meant for local development; production deployers should translate the same deployment records into the target provider.

## How It Works

1. Each model image folder contains `model_image.json`.
2. Django syncs those manifests into `ModelImage` rows.
3. A user requests a plan or deployment for one or more model slugs.
4. The control plane assigns available host ports, builds route URLs, and creates runtime specs.
5. If the request creates deployments, Django stores `ModelImageDeployment` rows owned by the user.
6. Future quota, billing, IAM, API keys, and provider reconciliation can use those database records.
