import { apiClient } from "./client";
import { DashboardSummary } from "../../types";


export function fetchDashboard(token: string): Promise<DashboardSummary> {
  return apiClient("/api/dashboard/", undefined, token);
}
