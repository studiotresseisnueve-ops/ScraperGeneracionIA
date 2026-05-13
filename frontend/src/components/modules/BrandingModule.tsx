import { useState } from "react";
import api, { submitBrandForm } from "../../api/client";
import { ColorSwatch } from "../ui/ColorSwatch";
import type { BrandProfile } from "../../types";

function TagInput({
  label,
  tags,
  onChange,
  max,
  placeholder,
  hint,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  max: number;
  placeholder?: string;
  hint?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && tags.length < max && !tags.includes(v)) {
      onChange([...tags, v]);
      setInput("");
    }
  };

  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div>
      <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
        {tags.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-1 bg-brand-accent/10 text-brand-accent text-xs px-2.5 py-1 rounded-full"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:text-white leading-none ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {tags.length < max && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder ?? `Escribe y presiona Enter · máx ${max}`}
            className="flex-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent"
          />
          <button
            type="button"
            onClick={add}
            className="px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-brand-muted hover:text-white transition-colors text-sm"
          >
            +
          </button>
        </div>
      )}
      {hint && <p className="text-xs text-brand-muted mt-2">{hint}</p>}
    </div>
  );
}

function ColorInput({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (colors: string[]) => void;
}) {
  const add = () => {
    if (colors.length < 6) onChange([...colors, "#6C63FF"]);
  };

  const update = (i: number, val: string) => {
    const next = [...colors];
    next[i] = val;
    onChange(next);
  };

  const remove = (i: number) => onChange(colors.filter((_, idx) => idx !== i));

  return (
    <div>
      <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">Paleta de Colores</p>
      <div className="flex flex-wrap gap-4 items-end">
        {colors.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 group">
            <input
              type="color"
              value={c}
              onChange={(e) => update(i, e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-brand-border bg-transparent"
            />
            <span className="text-[10px] text-brand-muted font-mono">{c.toUpperCase()}</span>
            {colors.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-brand-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {colors.length < 6 && (
          <button
            type="button"
            onClick={add}
            className="w-10 h-10 rounded-lg border-2 border-dashed border-brand-border hover:border-brand-accent text-brand-muted hover:text-brand-accent flex items-center justify-center transition-colors text-xl mb-[22px]"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <p className="text-xs text-brand-muted uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">{label}</p>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-accent";

export function BrandingModule({
  onProfileReady,
}: {
  onProfileReady: (p: BrandProfile) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<BrandProfile | null>(null);

  const [brandName, setBrandName] = useState("");
  const [productType, setProductType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [colors, setColors] = useState<string[]>(["#6C63FF"]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [styleDescriptors, setStyleDescriptors] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);

  const isValid =
    brandName.trim() !== "" &&
    productType.trim() !== "" &&
    targetAudience.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const { session_id } = await submitBrandForm({
        brand_name: brandName.trim(),
        product_type: productType.trim(),
        target_audience: targetAudience.trim(),
        colors,
        keywords,
        trending_keywords: trendingKeywords,
        style_descriptors: styleDescriptors,
      });
      const { data } = await api.get<BrandProfile>(`/branding/profile/${session_id}`);
      setProfile(data);
      onProfileReady(data);
    } catch {
      setError("No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Perfil de Marca</h2>
        <p className="text-brand-muted text-sm">
          Completa los datos de identidad para que el agente genere la inspiración visual.
        </p>
      </div>

      {!profile ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-brand-muted uppercase tracking-wider mb-2">
              Nombre del Proyecto / Marca
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              placeholder="Ej: Studio Norte, Colección Verano 2025..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs text-brand-muted uppercase tracking-wider mb-2">
              Tipo de Producto o Servicio
            </label>
            <input
              type="text"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              required
              placeholder="Ej: ropa deportiva femenina, joyería artesanal, app de finanzas..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs text-brand-muted uppercase tracking-wider mb-2">
              Público Objetivo
            </label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              required
              rows={2}
              placeholder="Ej: Mujeres 25-40, profesionales de moda, residentes urbanos..."
              className={inputCls + " resize-none"}
            />
          </div>

          <Field label="">
            <ColorInput colors={colors} onChange={setColors} />
          </Field>

          <Field label="">
            <TagInput
              label="Keywords de Marca"
              tags={keywords}
              onChange={setKeywords}
              max={5}
              placeholder="Ej: sostenible, lujo, artesanal..."
            />
          </Field>

          <Field label="">
            <TagInput
              label="Descriptores de Estilo"
              tags={styleDescriptors}
              onChange={setStyleDescriptors}
              max={5}
              placeholder="Ej: minimalista, editorial, high contrast..."
            />
          </Field>

          <Field label="">
            <TagInput
              label="Keywords para Búsqueda en Redes"
              tags={trendingKeywords}
              onChange={setTrendingKeywords}
              max={5}
              placeholder="Hashtags o términos para buscar en Instagram..."
              hint="Estos términos se usarán para buscar inspiración en Instagram Reels."
            />
          </Field>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full bg-brand-accent text-white py-3 rounded-xl font-medium transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {submitting ? "Guardando perfil..." : "Guardar y continuar →"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-white font-medium">Perfil guardado — listo para generar inspiración ✓</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card label="Tipo de Producto / Servicio">
              <p className="text-sm text-white leading-relaxed">{profile.tone_of_voice}</p>
            </Card>

            <Card label="Público Objetivo">
              <p className="text-sm text-white leading-relaxed">{profile.target_audience}</p>
            </Card>

            <Card label="Paleta de Colores">
              <ColorSwatch colors={profile.colors} />
            </Card>

            <Card label="Keywords de Marca">
              <div className="flex flex-wrap gap-2">
                {profile.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="bg-brand-accent/10 text-brand-accent text-xs px-2.5 py-1 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <Card label="Descriptores de Estilo">
            <div className="flex flex-wrap gap-2">
              {profile.style_descriptors.map((d) => (
                <span
                  key={d}
                  className="bg-white/5 text-white text-xs px-2.5 py-1 rounded-full border border-brand-border"
                >
                  {d}
                </span>
              ))}
            </div>
          </Card>

          <button
            onClick={() => setProfile(null)}
            className="text-xs text-brand-muted hover:text-white transition-colors"
          >
            Editar perfil
          </button>
        </div>
      )}
    </div>
  );
}
