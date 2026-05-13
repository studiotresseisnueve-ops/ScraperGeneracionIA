import { useState } from "react";
import { startGeneration, getImages, imageUrl } from "../../api/client";
import { useSSE } from "../../hooks/useSSE";
import { StatusBanner } from "../ui/StatusBanner";
import type { BrandProfile, GeneratedImage } from "../../types";

type Format = "square" | "story" | "banner";

const FORMATS: { id: Format; label: string; desc: string }[] = [
  { id: "square", label: "Cuadrado", desc: "1:1 · Feed" },
  { id: "story",  label: "Story",    desc: "9:16 · Vertical" },
  { id: "banner", label: "Banner",   desc: "16:9 · Horizontal" },
];

export function GenerationModule({
  profile,
}: {
  profile: BrandProfile | null;
}) {
  const [format, setFormat] = useState<Format>("square");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const { messages, running, done, connect, reset } = useSSE();

  if (!profile) {
    return (
      <div className="text-center py-20 text-brand-muted text-sm">
        Primero completa el perfil de marca en la pestaña "Ingesta".
      </div>
    );
  }

  const handleGenerate = async (fmt: Format = format, count = 4) => {
    reset();
    await startGeneration(profile.session_id, fmt, count);
    connect(`/generation/${profile.session_id}/progress`, async () => {
      const data = await getImages(profile.session_id);
      setImages(data);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Laboratorio de Imagen</h2>
          <p className="text-brand-muted text-sm">
            Assets generados con DALL-E 3 alineados a tu identidad.
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                title={f.desc}
                className={[
                  "px-4 py-2 text-sm transition-colors",
                  format === f.id
                    ? "bg-brand-accent text-white font-medium"
                    : "text-brand-muted hover:text-white",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={running}
            className="px-5 py-2 bg-brand-accent hover:bg-brand-accent/80 disabled:opacity-50
                       text-white text-sm font-medium rounded-xl transition-colors"
          >
            {running ? "Generando..." : "Generar Assets"}
          </button>
        </div>
      </div>

      {(messages.length > 0 || running) && (
        <StatusBanner messages={messages} running={running} />
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <ImageCard
              key={img.image_id}
              img={img}
              onRegenerate={() => handleGenerate(img.format as Format, 1)}
            />
          ))}
        </div>
      )}

      {done && !running && images.length === 0 && (
        <p className="text-center text-brand-muted py-12">
          No se generaron imágenes. Verifica tus créditos de OpenAI.
        </p>
      )}
    </div>
  );
}

function ImageCard({
  img,
  onRegenerate,
}: {
  img: GeneratedImage;
  onRegenerate: () => void;
}) {
  const url = imageUrl(img.session_id, img.image_id);
  const aspect =
    img.format === "story"
      ? "aspect-[9/16]"
      : img.format === "banner"
      ? "aspect-[16/9]"
      : "aspect-square";

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden
                    hover:border-brand-accent/40 transition-colors group">
      <div className={`${aspect} relative bg-brand-border overflow-hidden`}>
        <img src={url} alt="Generated asset" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                        transition-opacity flex items-end p-3">
          <p className="text-white text-xs line-clamp-4 leading-relaxed">
            {img.revised_prompt}
          </p>
        </div>
      </div>

      <div className="p-3 flex gap-2">
        <button
          onClick={onRegenerate}
          className="flex-1 text-xs text-brand-muted hover:text-white border border-brand-border
                     hover:border-brand-accent/40 rounded-lg py-1.5 transition-colors"
        >
          Regenerar
        </button>
        <a
          href={url}
          download={`asset-${img.image_id}.png`}
          className="flex-1 text-xs text-center text-white bg-brand-accent/20 hover:bg-brand-accent
                     rounded-lg py-1.5 transition-colors"
        >
          Descargar
        </a>
      </div>
    </div>
  );
}
