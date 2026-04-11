import { apiClient } from "./client";
import { Model } from "../../types";
import { Dataset } from "./datasetApi";

export interface DashboardSummary {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    public_username: string;
    avatar_url: string;
  };
  stats: {
    your_models: number;
    your_datasets: number;
    total_downloads: number;
    community_members: number;
    community_models: number;
    community_datasets: number;
  };
  trending_models: Model[];
  popular_datasets: Dataset[];
  recent_user_models: Model[];
  recent_user_datasets: Dataset[];
}

export function fetchDashboard(token: string): Promise<DashboardSummary> {
  return apiClient("/api/dashboard/", undefined, token);
}
