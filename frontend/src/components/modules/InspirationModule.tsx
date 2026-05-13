import { useCallback, useState } from "react";
import { startScraping, getVideos } from "../../api/client";
import { useSSE } from "../../hooks/useSSE";
import { StatusBanner } from "../ui/StatusBanner";
import type { BrandProfile, VideoAnalysis } from "../../types";

export function InspirationModule({
  profile,
}: {
  profile: BrandProfile | null;
}) {
  const [videos, setVideos] = useState<VideoAnalysis[]>([]);
  const { messages, running, done, connect, reset } = useSSE();

  const doSearch = useCallback(async () => {
    if (!profile) return;
    reset();
    await startScraping(profile.session_id);
    connect(`/scraping/${profile.session_id}/progress`, async () => {
      const data = await getVideos(profile.session_id);
      setVideos(data);
    });
  }, [profile, connect, reset]);

  if (!profile) {
    return <Empty message='Primero completa el perfil de marca en la pestaña "Ingesta".' />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Tendencias para tu Marca</h2>
          <p className="text-brand-muted text-sm">
            {profile.trending_keywords.slice(0, 4).join(" · ")}
          </p>
        </div>
        <button
          onClick={doSearch}
          disabled={running}
          className="px-5 py-2 bg-brand-accent hover:bg-brand-accent/80 disabled:opacity-50
                     text-white text-sm font-medium rounded-xl transition-colors"
        >
          {running ? "Buscando..." : videos.length ? "Actualizar" : "Buscar Tendencias"}
        </button>
      </div>

      {(messages.length > 0 || running) && (
        <StatusBanner messages={messages} running={running} />
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <VideoCard key={v.video_id} video={v} sessionId={profile.session_id} />
          ))}
        </div>
      )}

      {done && !running && videos.length === 0 && (
        <p className="text-center text-brand-muted py-12">
          No se encontraron posts compatibles. Intenta nuevamente.
        </p>
      )}
    </div>
  );
}

function VideoCard({ video, sessionId }: { video: VideoAnalysis; sessionId: string }) {
  const localThumb = `/api/scraping/${sessionId}/thumbnail/${video.video_id}`;

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden
                    hover:border-brand-accent/40 transition-colors group">
      <div className="relative aspect-square bg-brand-border overflow-hidden">
        <img
          src={localThumb}
          alt={video.caption}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = video.thumbnail_url;
            } else {
              img.style.display = "none";
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full capitalize">
          {video.platform}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {video.style_tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-xs text-brand-muted leading-relaxed">{video.ai_analysis}</p>

        <div className="flex items-center gap-2 pt-1 border-t border-brand-border">
          <span className="text-xs text-brand-muted truncate flex-1 font-mono" title={video.url}>
            {video.url}
          </span>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-medium text-brand-accent hover:text-white
                       bg-brand-accent/10 hover:bg-brand-accent px-2.5 py-1 rounded-lg transition-colors"
          >
            Abrir ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-20 text-brand-muted text-sm">{message}</div>
  );
}
