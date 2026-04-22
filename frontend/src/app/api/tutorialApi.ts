import { apiClient } from "./client";
import { SignedUploadResponse, Tutorial, TutorialPayload } from "../../types";

export async function fetchPublishedTutorials() {
  return apiClient<Tutorial[]>("/api/tutorials/");
}

export async function fetchMyTutorials(token: string) {
  return apiClient<Tutorial[]>("/api/tutorials/mine/", undefined, token);
}

export async function fetchTutorialBySlug(slug: string, token?: string | null) {
  return apiClient<Tutorial>(`/api/tutorials/${slug}/`, undefined, token);
}

export async function createTutorial(token: string, payload: TutorialPayload) {
  return apiClient<Tutorial>(
    "/api/tutorials/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateTutorial(token: string, slug: string, payload: Partial<TutorialPayload>) {
  return apiClient<Tutorial>(
    `/api/tutorials/${slug}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function requestTutorialImageUploadUrl(token: string, filename: string, contentType: string) {
  return apiClient<SignedUploadResponse>(
    "/api/tutorials/upload-url/",
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

export async function uploadTutorialImageToStorage(uploadUrl: string, file: File, contentType: string) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType || "application/octet-stream" },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to storage");
  }
}
