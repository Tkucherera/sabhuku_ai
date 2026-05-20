# Marketing Notes

Sabhuku LLM Control Plane provides a Django-backed way to discover, route, and manage many model images without duplicating deployment code inside every model folder.

## Positioning

This capability gives Sabhuku AI a practical path to self-hosted language intelligence. Teams can register model images, create user-owned deployment records, generate deployment plans, and keep routing, keys, quota, billing, and provider logic in the main Django backend.

## Key Benefits

- Discovers model images from simple manifests and syncs them into the database.
- Allocates ports and endpoint routes for many models at once.
- Assigns deployments to authenticated users.
- Keeps business logic out of model images.
- Produces provider-neutral deployment plans.
- Supports local Docker Compose generation for development.

## Suggested Messaging

"Register model images once, then let the Sabhuku Django control plane route, deploy, meter, and manage them anywhere."

## Target Users

- Developers adding new model images.
- Platform teams deploying images across cloud runtimes.
- Product teams managing quota, usage, and commercial access to AI capabilities.

## Current Limitations

- Provider-specific deploy/destroy calls are represented as database-backed plans, not executed yet.
- API key, IAM, quota, billing, and reconciliation logic have database fields but still need enforcement/executor implementations.
- Each model image must still expose the endpoint contract declared in its manifest.
