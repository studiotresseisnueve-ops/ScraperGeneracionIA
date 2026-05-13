from pydantic import BaseModel
from typing import Optional


class BrandProfile(BaseModel):
    session_id: str
    filename: str
    tone_of_voice: str
    colors: list[str]
    keywords: list[str]
    trending_keywords: list[str]
    target_audience: str
    style_descriptors: list[str]


class VideoAnalysis(BaseModel):
    video_id: str
    url: str
    thumbnail_url: str
    platform: str
    caption: str
    style_tags: list[str]
    ai_analysis: str
    compatibility_score: float


class GeneratedImage(BaseModel):
    image_id: str
    session_id: str
    local_path: str
    prompt: str
    revised_prompt: str
    format: str
    size: str


class SessionCosts(BaseModel):
    session_id: str
    branding_tokens: int = 0
    scraping_runs: int = 0
    images_generated: int = 0
    estimated_usd: float = 0.0
