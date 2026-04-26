# Sabhuku AI API

This file documents the Django API endpoints currently exposed by the project.

Base URL in local development:

```text
http://localhost:8000
```

API base path:

```text
/api/
```

## Conventions

- Authenticated endpoints use JWT bearer auth: `Authorization: Bearer <access-token>`.
- Most list endpoints return JSON arrays.
- Most detail/create/update endpoints return JSON objects.
- File upload endpoints return a signed Google Cloud Storage URL plus the storage path to save in your model.
- Search and filter params are optional unless noted.

## Auth

These routes come from `dj_rest_auth` and `dj_rest_auth.registration`.

### `POST /api/auth/login/`

Short description: Sign in with username, email, or public username.

How to use:

```json
{
  "username": "legacy-user",
  "password": "secret123"
}
```

Returns:
- JWT auth payload from `dj_rest_auth` with tokens such as `access` and `refresh`

### `POST /api/auth/logout/`

Short description: Sign out the current user.

Returns:
- Success response from `dj_rest_auth`

### `POST /api/auth/password/reset/`

Short description: Send a password reset email.

How to use:

```json
{
  "email": "user@example.com"
}
```

Returns:
- Success confirmation message

### `POST /api/auth/password/reset/confirm/`

Short description: Complete password reset with the emailed token.

Returns:
- Success confirmation or validation errors

### `POST /api/auth/password/change/`

Short description: Change password for the authenticated user.

Returns:
- Success confirmation or validation errors

### `GET /api/auth/user/`

Short description: Get the current authenticated user from `dj_rest_auth`.

Returns:
- Current user object

### `PUT/PATCH /api/auth/user/`

Short description: Update the current authenticated user through `dj_rest_auth`.

Returns:
- Updated user object

### `POST /api/auth/registration/`

Short description: Register a new user with optional `first_name`, `last_name`, and `public_username`.

How to use:

```json
{
  "username": "tinashe",
  "email": "tinashe@example.com",
  "password1": "secret123",
  "password2": "secret123",
  "first_name": "Tinashe",
  "last_name": "Kucherera",
  "public_username": "tinashe-k"
}
```

Returns:
- Registration success payload from `dj_rest_auth`

## Community

### `GET /api/community/overview/`

Short description: Public landing payload for platform stats and featured content.

How to use:

```text
GET /api/community/overview/
```

Returns:
- `stats`: counts for members, models, datasets, tutorials
- `featured_models`: top models ordered by trending and engagement
- `featured_datasets`: top public datasets by downloads
- `featured_tutorials`: latest published tutorials

### `GET /api/community/search/`

Short description: Cross-content search across models, datasets, and tutorials.

Query params:
- `q`: search text
- `type`: `all`, `models`, `datasets`, or `tutorials`
- `limit`: max items per content type, between `1` and `20`

Example:

```text
GET /api/community/search/?q=shona&type=all&limit=5
```

Returns:
- `query`
- `type`
- `limit`
- `results.models`
- `results.datasets`
- `results.tutorials`

## Dashboard and Profile

### `GET /api/dashboard/`

Auth: required

Short description: Fetch the authenticated user dashboard summary.

Returns:
- `user`: name, email, public username, avatar
- `stats`: user and community counts
- `trending_models`
- `popular_datasets`
- `recent_user_models`
- `recent_user_datasets`

### `GET /api/profile/`

Auth: required

Short description: Get the current user's editable public profile.

Returns:
- `username`
- `public_username`
- `email`
- `date_joined`
- `first_name`
- `last_name`
- `bio`
- `location`
- `title`
- `avatar_url`
- `cover_image_url`
- `twitter`
- `linkedin`
- `github`

### `PATCH /api/profile/`

Auth: required

Short description: Update the current user's profile and basic user fields.

How to use:

```json
{
  "public_username": "tinashe-k",
  "first_name": "Tinashe",
  "last_name": "Kucherera",
  "title": "ML Engineer",
  "bio": "Building practical AI systems.",
  "avatar_path": "profiles/12/avatar.png",
  "cover_image_path": "profiles/12/cover.png"
}
```

Returns:
- Updated profile object

### `POST /api/profile/upload-url/`

Auth: required

Short description: Request a signed upload URL for profile media.

How to use:

```json
{
  "filename": "avatar.png",
  "content_type": "image/png"
}
```

Returns:
- `upload_url`
- `file_path`
- `file_url`
- `content_type`
- `expires_in_minutes`

## Models

### `GET /api/models/`

Short description: List models.

Query params:
- `q`: text search over name, description, category, tags
- `category`: exact category filter
- `author`: username or public username
- `tag`: tag text match
- `trending`: `true` to only return trending models

Returns:
- Array of model objects with:
  - `id`
  - `name`
  - `author`
  - `author_username`
  - `description`
  - `category`
  - `downloads`
  - `likes`
  - `trending`
  - `tags`
  - `updated`
  - `file_path`
  - `license`

### `POST /api/models/`

Auth: required

Short description: Create a new model entry.

How to use:

```json
{
  "name": "Shona Assistant",
  "description": "Local support model",
  "category": "NLP",
  "tags": ["shona", "assistant"],
  "file_path": "models/12/shona-assistant.bin",
  "license": "Custom"
}
```

Returns:
- Created model object

### `GET /api/models/{id}/`

Short description: Fetch one model by numeric ID.

Returns:
- Model object

### `PATCH /api/models/{id}/`

Auth: required

Short description: Update a model.

Returns:
- Updated model object

### `DELETE /api/models/{id}/`

Auth: required

Short description: Delete a model.

Returns:
- `204 No Content`

### `POST /api/models/upload-url/`

Auth: required

Short description: Request a signed upload URL for a model artifact.

Returns:
- `upload_url`
- `file_path`
- `file_url`
- `content_type`
- `expires_in_minutes`

### `GET /api/models/{id}/download-url/`

Short description: Get a signed download URL for a model artifact and increment downloads.

Returns:

```json
{
  "url": "https://signed-download.example"
}
```

## Datasets

### `GET /api/datasets/`

Short description: List datasets.

Visibility:
- Anonymous users only receive public datasets
- Authenticated users receive public datasets plus their own private datasets
- `mine=true` returns only the current user's datasets

Query params:
- `q`: text search over name, subtitle, description, category, tags, authors, source
- `category`: exact category filter
- `author`: username or public username
- `tag`: tag text match
- `mine`: `true` for current user's datasets

Returns:
- Array of dataset objects including discussions and public owner metadata

### `POST /api/datasets/`

Auth: required

Short description: Create a dataset entry.

How to use:

```json
{
  "name": "Harare Service Requests",
  "subtitle": "Civic issue records",
  "description": "Municipal service request history",
  "category": "Tabular",
  "size": "24 MB",
  "format": ["csv"],
  "tags": ["harare", "civic"],
  "file_path": "datasets/12/harare.csv",
  "license": "CC BY 4.0",
  "is_public": true
}
```

Returns:
- Created dataset object

### `GET /api/datasets/{id}/`

Short description: Fetch one dataset by numeric ID.

Returns:
- Dataset object

### `PATCH /api/datasets/{id}/`

Auth: required

Short description: Update a dataset.

Returns:
- Updated dataset object

### `DELETE /api/datasets/{id}/`

Auth: required

Short description: Delete a dataset.

Returns:
- `204 No Content`

### `POST /api/datasets/upload-url/`

Auth: required

Short description: Request a signed upload URL for a dataset file.

Returns:
- `upload_url`
- `file_path`
- `file_url`
- `content_type`
- `expires_in_minutes`

### `GET /api/datasets/{id}/download-url/`

Short description: Get a signed download URL for a dataset file and increment downloads.

Returns:

```json
{
  "url": "https://signed-download.example"
}
```

### `GET /api/datasets/by-owner/{public_username}/{dataset_slug}/`

Short description: Fetch a dataset by public owner and slug.

Returns:
- Dataset object

## Tutorials

Tutorial API routes are mounted from the `tutorials` app under the same `/api/` prefix.

### `GET /api/tutorials/`

Short description: List tutorials.

Visibility:
- Anonymous users only receive published tutorials
- Authenticated users receive published tutorials plus their own drafts and archived items
- `mine=true` returns only the current user's tutorials

Query params:
- `q`: text search over title, excerpt, markdown body, SEO keywords, tags
- `tag`: tag slug or tag name
- `author`: author public username
- `mine`: `true` for the current user's tutorials
- `status`: `draft`, `published`, or `archived` when viewing your own content

Returns:
- Array of tutorial objects

### `POST /api/tutorials/`

Auth: required

Short description: Create a tutorial.

How to use:

```json
{
  "title": "Deploying Models in Harare",
  "excerpt": "A practical deployment guide",
  "body_markdown": "## Intro\nThis is the tutorial body.",
  "status": "published",
  "tags": ["deployment", "zimbabwe"],
  "seo_title": "Deploying Models in Harare",
  "meta_description": "Deployment guide for local AI teams"
}
```

Returns:
- Created tutorial object

### `GET /api/tutorials/{slug}/`

Short description: Fetch one tutorial by slug.

Returns:
- Tutorial object

### `PATCH /api/tutorials/{slug}/`

Auth: required

Short description: Update a tutorial.

Returns:
- Updated tutorial object

### `DELETE /api/tutorials/{slug}/`

Auth: required

Short description: Delete a tutorial.

Returns:
- `204 No Content`

### `GET /api/tutorials/mine/`

Auth: required

Short description: Shortcut endpoint for the current user's tutorials.

Returns:
- Array of tutorial objects

### `POST /api/tutorials/upload-url/`

Auth: required

Short description: Request a signed upload URL for tutorial media.

Returns:
- `upload_url`
- `file_path`
- `file_url`
- `content_type`
- `expires_in_minutes`

### `POST /api/tutorials/upload-image/`

Auth: required

Short description: Upload a tutorial image file directly through Django and store it in the configured media bucket.

How to use:
- Send `multipart/form-data` with a `file` field

Returns:

```json
{
  "file_path": "tutorials/media/12/uuid_filename.png",
  "file_url": "https://storage.googleapis.com/..."
}
```

## Discussions

Discussion endpoints support threaded comments. Use `parent` to reply to an existing comment in the same resource thread.

Discussion object fields:
- `id`
- `content`
- `created_at`
- `parent`
- `dataset`
- `model`
- `tutorial`
- `author_username`
- `author_public_username`
- `author_display_name`
- `replies`

### `GET /api/discussions/datasets/{dataset_id}/`

Short description: List top-level discussion threads for a dataset.

Returns:
- Array of threaded discussion objects

### `POST /api/discussions/datasets/{dataset_id}/`

Auth: required

Short description: Add a dataset comment or reply.

How to use:

```json
{
  "content": "This dataset looks useful for civic routing.",
  "parent": null
}
```

Returns:
- Created discussion object

### `GET /api/discussions/models/{model_id}/`

Short description: List top-level discussion threads for a model.

Returns:
- Array of threaded discussion objects

### `POST /api/discussions/models/{model_id}/`

Auth: required

Short description: Add a model comment or reply.

Returns:
- Created discussion object

### `GET /api/discussions/tutorials/{tutorial_id}/`

Short description: List top-level discussion threads for a tutorial.

Returns:
- Array of threaded discussion objects

### `POST /api/discussions/tutorials/{tutorial_id}/`

Auth: required

Short description: Add a tutorial comment or reply.

Returns:
- Created discussion object

## Hardware Recommendation

### `POST /api/hardware/recommend/`

Short description: Profile a model artifact and return a recommended deployment target.

How to use:

```json
{
  "model_source": "https://example.com/model.gguf",
  "model_name": "Shona Assistant",
  "prefer": "balanced",
  "providers": ["gcp", "aws"],
  "use_spot": false,
  "allow_inferentia": false
}
```

Notes:
- `model_source` can be a local filesystem path or an `http(s)` URL
- `prefer` can be `cost`, `latency`, or `balanced`

Returns:
- `model_profile`
- `hardware_profile`
- `profile_summary`
- `top_recommendation`

### `GET /api/hardware/profiles/{profile_id}/`

Short description: Fetch a previously generated hardware recommendation by model profile ID.

Returns:
- `model_profile`
- `hardware_profile`
- `profile_summary`
- `top_recommendation`

## Non-API Tutorial Pages

These are server-rendered pages, not JSON APIs, but they are still routed by Django:

- `GET /community/tutorials/`
- `GET /community/tutorials/feed.xml`
- `GET /community/tutorials/sitemap.xml`
- `GET /community/tutorials/tags/{slug}/`
- `GET /community/tutorials/authors/{public_username}/`
- `GET /community/tutorials/{slug}/`
