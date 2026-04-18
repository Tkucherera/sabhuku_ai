import { apiClient } from "./client";
import { Model, CreateModelPayload, SignedUploadResponse, ModelProfileRequest, HardwareProfileResponse } from "../../types";
export function fetchModels(): Promise<Model[]> {
  return apiClient("/api/models/");
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

// This is the function that does the work in backend of making profiles 
export async function createHardwareProfile(
  token: string,
  payload: ModelProfileRequest
): Promise<HardwareProfileResponse>{
  return apiClient("/api/hardware/recommend/", {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
}

export async function getModelHardwareProfile(modelId: number): Promise<HardwareProfileResponse> {
  return apiClient(`/api/hardware/profiles/${modelId}/`);
}
