import { apiClient } from "./client";

export function fetchDatasets() {
  return apiClient("/api/datasets/");
}



