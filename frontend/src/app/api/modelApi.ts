// src/api/modelApi.ts
import { apiClient } from "./client";
import { Model } from "../../types";

export function fetchModels(): Promise<Model[]> {
  return apiClient("/api/models/");
}