import { apiClient } from "./client";

export interface Dataset {
  id: number;
  name: string;
  description: string;
  category: string;
  size: string;
  downloads: number;
  format: string[];
  updated: string;
  file_path: string;
  license: string;
  author: number;
  author_username?: string;
}

export function fetchDatasets(): Promise<Dataset[]> {
  return apiClient("/api/datasets/");
}

interface SignedUploadResponse {
  upload_url: string;
  file_path: string;
  content_type: string;
  expires_in_minutes: number;
}

interface CreateDatasetPayload {
  name: string;
  description: string;
  category: string;
  size: string;
  format: string[];
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
