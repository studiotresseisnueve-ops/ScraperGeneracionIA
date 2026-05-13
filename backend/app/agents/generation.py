import uuid
import httpx
from pathlib import Path
from openai import AsyncOpenAI
from ..config import OPENAI_API_KEY, UPLOADS_DIR
from ..models import GeneratedImage
from .. import storage, progress

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

_SIZE_MAP = {
    "square": "1024x1024",
    "story":  "1024x1792",
    "banner": "1792x1024",
}

_PROMPT_BUILDER = """Eres un director de arte. Crea un prompt técnico para DALL-E 3 en inglés basado en:
- Keywords de marca: {keywords}
- Estilo visual: {style}
- Paleta de colores (usa estos colores como referencia): {colors}
- Inspiración de videos seleccionados: {video_styles}
- Formato del asset: {format_type}

El prompt debe especificar composición, iluminación, paleta y estética de forma precisa.
Devuelve SOLO el prompt en inglés, sin comillas ni explicaciones adicionales."""


async def generate(
    session_id: str, format_type: str = "square", count: int = 4
) -> list[GeneratedImage]:
    await progress.push(session_id, "prompting", "Construyendo prompts creativos...")

    profile = storage.load_profile(session_id)
    videos = storage.load_videos(session_id)

    if not profile:
        await progress.push(session_id, "error", "Perfil de marca no encontrado.", "error")
        return []

    video_styles = ", ".join(tag for v in videos[:3] for tag in v.style_tags) or "modern, dynamic"

    prompt_resp = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": _PROMPT_BUILDER.format(
                keywords=", ".join(profile.keywords),
                style=", ".join(profile.style_descriptors),
                colors=", ".join(profile.colors[:4]),
                video_styles=video_styles,
                format_type=format_type,
            ),
        }],
        max_tokens=300,
    )
    base_prompt = prompt_resp.choices[0].message.content.strip()

    size = _SIZE_MAP.get(format_type, "1024x1024")
    img_dir = Path(UPLOADS_DIR) / session_id / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    images: list[GeneratedImage] = []

    for i in range(count):
        await progress.push(
            session_id, "generating",
            f"Generando imagen {i + 1} de {count} con DALL-E 3..."
        )
        try:
            resp = await client.images.generate(
                model="dall-e-3",
                prompt=base_prompt,
                size=size,
                quality="standard",
                n=1,
            )
            img_url = resp.data[0].url
            revised = resp.data[0].revised_prompt or base_prompt

            image_id = uuid.uuid4().hex[:8]
            local_file = img_dir / f"{image_id}.png"

            async with httpx.AsyncClient(timeout=60.0) as http:
                r = await http.get(img_url)
                local_file.write_bytes(r.content)

            images.append(GeneratedImage(
                image_id=image_id,
                session_id=session_id,
                local_path=str(local_file),
                prompt=base_prompt,
                revised_prompt=revised,
                format=format_type,
                size=size,
            ))
        except Exception:
            continue

    existing = storage.load_images(session_id)
    storage.save_images(session_id, existing + images)

    price_per = 0.08 if format_type in ("story", "banner") else 0.04
    costs = storage.load_costs(session_id)
    costs.images_generated += len(images)
    costs.estimated_usd += round(price_per * len(images), 4)
    storage.save_costs(costs)

    await progress.push(session_id, "done", f"{len(images)} imágenes generadas.", "complete")
    return images
