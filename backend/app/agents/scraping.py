import uuid
import json
import httpx
from openai import AsyncOpenAI
from ..config import APIFY_API_TOKEN, OPENAI_API_KEY
from ..models import VideoAnalysis, BrandProfile
from .. import storage, progress

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

_APIFY_BASE = "https://api.apify.com/v2"
_INSTAGRAM_ACTOR = "apify~instagram-scraper"

_ANALYSIS_SYSTEM = """Eres un curador creativo de contenido de marca.
Dado el perfil de la marca y la descripción de un video, responde SOLO con JSON:
{
  "style_tags": ["#Tag1", "#Tag2", "#Tag3"],
  "ai_analysis": "1-2 oraciones sobre por qué encaja estéticamente con la marca",
  "compatible": true
}
Sé específico. Si el video claramente no encaja con el perfil, devuelve "compatible": false."""


def _is_valid_post_url(url: str) -> bool:
    return bool(url) and ("/p/" in url or "/reel/" in url or "/tv/" in url)


async def scrape_reels(keywords: list[str], session_id: str) -> list[VideoAnalysis]:
    await progress.push(session_id, "scraping", "Buscando tendencias en redes sociales...")

    raw_items: list[dict] = []
    seen_urls: set[str] = set()
    queries = keywords[:3]

    async with httpx.AsyncClient(timeout=120.0) as http:
        for query in queries:
            try:
                hashtag = query.lstrip("#").lower()
                resp = await http.post(
                    f"{_APIFY_BASE}/acts/{_INSTAGRAM_ACTOR}/run-sync-get-dataset-items",
                    headers={"Authorization": f"Bearer {APIFY_API_TOKEN}"},
                    json={
                        "directUrls": [f"https://www.instagram.com/explore/tags/{hashtag}/"],
                        "resultsLimit": 10,
                        "resultsType": "posts",
                    },
                )
                resp.raise_for_status()
                for item in resp.json():
                    short_code = item.get("shortCode") or ""
                    url = item.get("url") or ""

                    # Rebuild URL from shortCode if what we got is a hashtag page
                    if short_code and not _is_valid_post_url(url):
                        url = f"https://www.instagram.com/reel/{short_code}/"

                    if not _is_valid_post_url(url):
                        continue

                    if url not in seen_urls:
                        seen_urls.add(url)
                        item["url"] = url
                        raw_items.append(item)
            except Exception as exc:
                await progress.push(session_id, "scraping", f"Scraping limitado ({query}): {exc}", "loading")

    await progress.push(
        session_id, "filtering",
        f"Filtrando {len(raw_items)} videos por compatibilidad con la marca..."
    )

    profile = storage.load_profile(session_id)
    videos = await _analyze_and_filter(raw_items, profile, session_id)
    storage.save_videos(session_id, videos)

    costs = storage.load_costs(session_id)
    costs.scraping_runs += 1
    costs.estimated_usd += 0.05
    storage.save_costs(costs)

    await progress.push(session_id, "done", f"{len(videos)} videos seleccionados.", "complete")
    return videos


async def _analyze_and_filter(
    raw_items: list[dict], profile: BrandProfile, session_id: str
) -> list[VideoAnalysis]:
    if not profile:
        return []

    brand_ctx = (
        f"Producto: {profile.tone_of_voice[:150]}. "
        f"Estilo: {', '.join(profile.style_descriptors)}. "
        f"Keywords: {', '.join(profile.keywords)}."
    )
    videos: list[VideoAnalysis] = []

    for item in raw_items[:15]:
        caption = (item.get("caption") or item.get("text") or "")[:300]
        short_code = item.get("shortCode") or ""
        url = item.get("url") or ""
        thumbnail = item.get("displayUrl") or item.get("thumbnailUrl") or ""

        if short_code and not _is_valid_post_url(url):
            url = f"https://www.instagram.com/reel/{short_code}/"
        if not _is_valid_post_url(url):
            continue

        try:
            resp = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": _ANALYSIS_SYSTEM},
                    {"role": "user", "content": f"{brand_ctx}\n\nCaption: {caption}"},
                ],
                response_format={"type": "json_object"},
                max_tokens=200,
            )
            analysis = json.loads(resp.choices[0].message.content)
            if not analysis.get("compatible", True):
                continue

            video_id = uuid.uuid4().hex[:8]

            if thumbnail:
                try:
                    async with httpx.AsyncClient(timeout=15.0) as http:
                        r = await http.get(
                            thumbnail,
                            headers={"User-Agent": "Mozilla/5.0"},
                            follow_redirects=True,
                        )
                        if r.status_code == 200:
                            thumb_dir = storage.session_dir(session_id) / "thumbnails"
                            thumb_dir.mkdir(exist_ok=True)
                            (thumb_dir / f"{video_id}.jpg").write_bytes(r.content)
                except Exception:
                    pass

            videos.append(VideoAnalysis(
                video_id=video_id,
                url=url,
                thumbnail_url=thumbnail,
                platform="instagram",
                caption=caption[:200],
                style_tags=analysis.get("style_tags", []),
                ai_analysis=analysis.get("ai_analysis", ""),
                compatibility_score=0.8,
            ))
        except Exception:
            continue

    return videos[:9]
