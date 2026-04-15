import { apiClient } from "./client";

export interface Discussion {
  id: number;
  content: string;
  created_at: string;
  parent: number | null;
  dataset: number | null;
  model: number | null;
  author_username?: string;
  author_public_username?: string;
  author_display_name?: string;
  replies: Discussion[];
}

export interface Dataset {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string;
  size: string;
  downloads: number;
  format: string[];
  tags: string[];
  updated: string;
  file_path: string;
  license: string;
  author: number;
  author_username?: string;
  author_public_username?: string;
  dataset_thumbnail: string;
  is_public: boolean;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  authors: string;
  source: string;
  usability_score: number;
  discussions: Discussion[];
}

export function fetchDatasets(): Promise<Dataset[]> {
  return apiClient("/api/datasets/");
}

interface SignedUploadResponse {
  upload_url: string;
  file_path: string;
  file_url?: string;
  content_type: string;
  expires_in_minutes: number;
}

interface CreateDatasetPayload {
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  size: string;
  format: string[];
  tags?: string[];
  file_path: string;
  license?: string;
}

export function requestDatasetUploadUrl(
  token: string,
  filename: string,
  contentType: string
): Promise<SignedUploadResponse> {
  return apiClient(
    "/api/datasets/upload-url/",
    {
      method: "POST",
      body: JSON.stringify({
        filename,
        content_type: contentType || "application/octet-stream",
      }),
    },
    token
  );
}

export function createDataset(
  token: string,
  payload: CreateDatasetPayload
): Promise<Dataset> {
  return apiClient(
    "/api/datasets/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export function fetchDatasetByOwnerAndSlug(
  publicUsername: string,
  datasetSlug: string,
  token?: string | null
): Promise<Dataset> {
  return apiClient(
    `/api/datasets/by-owner/${encodeURIComponent(publicUsername)}/${encodeURIComponent(datasetSlug)}/`,
    undefined,
    token
  );
}

export function updateDataset(
  token: string,
  datasetId: number,
  payload: Partial<Dataset>
): Promise<Dataset> {
  return apiClient(
    `/api/datasets/${datasetId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function requestDatasetDownloadUrl(datasetId: number): Promise<{ url: string }> {
  return apiClient(`/api/datasets/${datasetId}/download-url/`);
}

export function buildDatasetPath(dataset: Pick<Dataset, "author_public_username" | "slug">) {
  const owner = dataset.author_public_username || "user";
  return `/datasets/${encodeURIComponent(owner)}/${encodeURIComponent(dataset.slug)}`;
}

export function fetchDatasetDiscussions(datasetId: number, token?: string | null): Promise<Discussion[]> {
  return apiClient(`/api/discussions/datasets/${datasetId}/`, undefined, token);
}

export function createDatasetDiscussion(
  token: string,
  datasetId: number,
  content: string,
  parentId?: number | null
): Promise<Discussion> {
  return apiClient(
    `/api/discussions/datasets/${datasetId}/`,
    {
      method: "POST",
      body: JSON.stringify({ content, parent: parentId ?? null }),
    },
    token
  );
}

export async function uploadDatasetFileToStorage(
  uploadUrl: string,
  file: File,
  contentType: string
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload dataset file to storage");
  }
}
