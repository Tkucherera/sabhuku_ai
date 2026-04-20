export interface Model {
  id: number;
  name: string;
  description: string;
  category: string;
  downloads: number;
  likes: number;
  trending: boolean;
  tags: string[];
  updated: string;
  author: number;
  author_username?: string;
  file_path: string;
  license: string;
}

export interface ModelProfile {
  id: number;
  model_name: string;
  source: string;
  source_kind: string;
  preferred_optimization: string;
  requested_providers: string[];
  use_spot: boolean;
  allow_inferentia: boolean;
  profile_summary: string;
  profile_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HardwareProfile {
  id: number;
  model_profile: number;
  provider: string;
  instance_name: string;
  gpu_model: string;
  gpu_count: number;
  total_vram_gb:  number;
  ram_gb: number;
  score: number;
  cost_per_hour: number;
  vram_headroom: number;
  recommendation_data: Record<string, unknown>;
  deployment_config: Record<string, unknown>;
  created_at: string;
}

export interface ModelProfileRequest {
  model_source: string;  // url or path (path is local) 
  model_name: string;
  prefer: "cost" | "latency" | "balanced";
  providers?: Array<"gcp" | "aws" | "local">;
  use_spot?: boolean;
  allow_inferentia?: boolean; // inferentia is aws chip
}


export interface HardwareProfileResponse {
  model_profile: ModelProfile;
  hardware_profile: HardwareProfile;
  profile_summary: string;
  top_recommendation: Record<string, unknown>;
}

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


export interface ProfileData {
  public_username: string;
  first_name: string;
  last_name: string;
  bio: string;
  location: string;
  title: string;
  avatar_path?: string;
  avatar_url: string;
  cover_image_path?: string;
  cover_image_url: string;
  twitter: string;
  linkedin: string;
  github: string;
}

export interface SignedUploadResponse {
  upload_url: string;
  file_path: string;
  file_url: string;
  content_type: string;
  expires_in_minutes: number;
}


export interface CreateModelPayload {
  name: string;
  description: string;
  category: string;
  tags: string[];
  file_path: string;
  license?: string;
}
