import { Spinner } from "./Spinner";
import type { ProgressEvent } from "../../types";

const ICONS: Record<string, string> = {
  pdf: "📄", analysis: "🔍", scraping: "🕸️",
  filtering: "🎯", prompting: "✍️", generating: "🎨",
  done: "✅", error: "❌",
};

export function StatusBanner({
  messages,
  running,
}: {
  messages: ProgressEvent[];
  running: boolean;
}) {
  if (!messages.length && !running) return null;

  const last = messages[messages.length - 1];

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-2">
      {messages.map((msg, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span>{ICONS[msg.stage] ?? "•"}</span>
          <span className={msg.status === "error" ? "text-red-400" : "text-brand-muted"}>
            {msg.message}
          </span>
        </div>
      ))}
      {running && (
        <div className="flex items-center gap-2 text-sm text-brand-accent">
          <Spinner size="sm" />
          <span>{last?.message ?? "Procesando..."}</span>
        </div>
      )}
    </div>
  );
}
