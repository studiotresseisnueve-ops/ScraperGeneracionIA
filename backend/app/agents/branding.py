import re
import json
import fitz  # PyMuPDF
from openai import AsyncOpenAI
from ..config import OPENAI_API_KEY
from ..models import BrandProfile, SessionCosts
from .. import storage, progress

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

_SYSTEM = """Eres un analista experto en identidad de marca.
Dado el texto de un manual de identidad o briefing, extrae la siguiente información y devuelve SOLO un JSON válido con estas claves exactas:
{
  "tone_of_voice": "descripción del tono de comunicación (2-3 oraciones)",
  "colors": ["#HEX1", "#HEX2"],
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "trending_keywords": ["búsqueda1", "búsqueda2", "búsqueda3", "búsqueda4", "búsqueda5"],
  "target_audience": "descripción del público objetivo",
  "style_descriptors": ["minimalista", "elegante"]
}
Reglas: colors en formato #RRGGBB, máximo 6. Si no hay colores explícitos, infiere una paleta apropiada."""


def _extract_hex(text: str) -> list[str]:
    return list(dict.fromkeys(re.findall(r"#[0-9A-Fa-f]{6}", text)))


async def process_pdf(pdf_path: str, session_id: str, filename: str) -> BrandProfile:
    await progress.push(session_id, "pdf", "Leyendo documento PDF...")

    doc = fitz.open(pdf_path)
    full_text = "".join(page.get_text() for page in doc)
    doc.close()

    hex_from_doc = _extract_hex(full_text)

    await progress.push(session_id, "analysis", "Analizando identidad de marca con IA...")

    user_content = f"Analiza este manual de identidad:\n\n{full_text[:6000]}"
    if hex_from_doc:
        user_content += f"\n\nColores detectados en el PDF: {', '.join(hex_from_doc)}"

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
        max_tokens=800,
    )

    raw = json.loads(response.choices[0].message.content)
    colors = raw.get("colors") or hex_from_doc[:6] or ["#1A1A1A"]

    profile = BrandProfile(
        session_id=session_id,
        filename=filename,
        tone_of_voice=raw.get("tone_of_voice", ""),
        colors=colors,
        keywords=raw.get("keywords", []),
        trending_keywords=raw.get("trending_keywords", []),
        target_audience=raw.get("target_audience", ""),
        style_descriptors=raw.get("style_descriptors", []),
    )
    storage.save_profile(profile)

    usage = response.usage
    costs = storage.load_costs(session_id)
    costs.branding_tokens += usage.prompt_tokens + usage.completion_tokens
    costs.estimated_usd += round(
        (usage.prompt_tokens * 5 + usage.completion_tokens * 15) / 1_000_000, 4
    )
    storage.save_costs(costs)

    await progress.push(session_id, "done", "Perfil de marca extraído correctamente.", "complete")
    return profile
