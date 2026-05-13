export interface BrandProfile {
  session_id: string;
  filename: string;
  tone_of_voice: string;
  colors: string[];
  keywords: string[];
  trending_keywords: string[];
  target_audience: string;
  style_descriptors: string[];
}

export interface VideoAnalysis {
  video_id: string;
  url: string;
  thumbnail_url: string;
  platform: string;
  caption: string;
  style_tags: string[];
  ai_analysis: string;
  compatibility_score: number;
}

export interface GeneratedImage {
  image_id: string;
  session_id: string;
  local_path: string;
  prompt: string;
  revised_prompt: string;
  format: string;
  size: string;
}

export interface SessionCosts {
  session_id: string;
  branding_tokens: number;
  scraping_runs: number;
  images_generated: number;
  estimated_usd: number;
}

export interface HistoryEntry {
  session_id: string;
  timestamp: string;
  filename: string;
  keywords: string[];
  videos_count: number;
  images_count: number;
  costs: SessionCosts;
}

export interface ProgressEvent {
  stage: string;
  message: string;
  status: "loading" | "complete" | "error";
}
