import { apiClient } from "./client";
import { Model } from "../../types";

export function fetchModels(): Promise<Model[]> {
  return apiClient("/api/models/");
}

interface SignedUploadResponse {
  upload_url: string;
  file_path: string;
  content_type: string;
  expires_in_minutes: number;
}

interface CreateModelPayload {
  name: string;
  description: string;
  category: string;
  tags: string[];
  file_path: string;
  license?: string;
}

export function requestModelUploadUrl(
  token: string,
  filename: string,
  contentType: string
): Promise<SignedUploadResponse> {
  return apiClient(
    "/api/models/upload-url/",
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

export function createModel(
  token: string,
  payload: CreateModelPayload
): Promise<Model> {
  return apiClient(
    "/api/models/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function uploadModelFileToStorage(
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
    throw new Error("Failed to upload file to storage");
  }
}
