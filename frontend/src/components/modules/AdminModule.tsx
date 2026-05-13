import { useState, useEffect } from "react";
import { getHistory, getCosts } from "../../api/client";
import type { HistoryEntry, SessionCosts } from "../../types";

export function AdminModule({
  currentSessionId,
  onLoadSession,
}: {
  currentSessionId?: string;
  onLoadSession: (id: string) => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentCosts, setCurrentCosts] = useState<SessionCosts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentSessionId) return;
    getCosts(currentSessionId).then(setCurrentCosts).catch(() => {});
  }, [currentSessionId]);

  const totalSpent = history.reduce((sum, e) => sum + e.costs.estimated_usd, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Panel de Control</h2>
        <p className="text-brand-muted text-sm">Monitor de costos e historial de sesiones.</p>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sesiones totales" value={history.length.toString()} />
        <StatCard
          label="Videos procesados"
          value={history.reduce((s, e) => s + e.videos_count, 0).toString()}
        />
        <StatCard
          label="Imágenes generadas"
          value={history.reduce((s, e) => s + e.images_count, 0).toString()}
        />
        <StatCard
          label="Gasto total estimado"
          value={`$${totalSpent.toFixed(3)}`}
          highlight
        />
      </div>

      {/* Current session */}
      {currentCosts && (
        <div className="bg-brand-surface border border-brand-accent/30 rounded-2xl p-5">
          <p className="text-xs text-brand-accent uppercase tracking-wider mb-4">
            Sesión Activa
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Tokens IA" value={currentCosts.branding_tokens.toLocaleString()} />
            <StatCard label="Runs scraping" value={currentCosts.scraping_runs.toString()} />
            <StatCard label="Imágenes" value={currentCosts.images_generated.toString()} />
            <StatCard
              label="Costo sesión"
              value={`$${currentCosts.estimated_usd.toFixed(3)}`}
              highlight
            />
          </div>
        </div>
      )}

      {/* History list */}
      <div>
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">
          Historial Privado
        </p>
        {loading ? (
          <p className="text-brand-muted text-sm">Cargando...</p>
        ) : history.length === 0 ? (
          <p className="text-brand-muted text-sm">No hay sesiones anteriores.</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <HistoryRow
                key={entry.session_id}
                entry={entry}
                isCurrent={entry.session_id === currentSessionId}
                onLoad={() => onLoadSession(entry.session_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? "text-brand-accent" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function HistoryRow({
  entry,
  isCurrent,
  onLoad,
}: {
  entry: HistoryEntry;
  isCurrent: boolean;
  onLoad: () => void;
}) {
  const date = new Date(entry.timestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={[
        "flex items-center justify-between border rounded-xl p-4 transition-colors",
        isCurrent
          ? "border-brand-accent/50 bg-brand-accent/5"
          : "border-brand-border bg-brand-surface hover:border-brand-accent/30",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{entry.filename}</p>
        <p className="text-xs text-brand-muted mt-0.5">
          {date} · {entry.videos_count} videos · {entry.images_count} imágenes ·{" "}
          <span className="text-brand-accent">${entry.costs.estimated_usd.toFixed(3)}</span>
        </p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {entry.keywords.map((kw) => (
            <span
              key={kw}
              className="text-xs bg-white/5 text-brand-muted px-2 py-0.5 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {isCurrent ? (
        <span className="ml-4 text-xs text-brand-accent font-medium">Activa</span>
      ) : (
        <button
          onClick={onLoad}
          className="ml-4 text-xs text-brand-accent hover:text-white border border-brand-accent/30
                     hover:border-brand-accent px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Cargar
        </button>
      )}
    </div>
  );
}
