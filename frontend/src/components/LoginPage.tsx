import { useState } from "react";
import { login } from "../api/client";

interface Props {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: Props) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-brand-accent font-bold text-2xl tracking-tight">AI</span>
          <span className="text-white font-semibold text-2xl"> Inspiration Engine</span>
          <p className="text-brand-muted text-sm mt-2">Acceso restringido al equipo interno</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-brand-surface border border-brand-border rounded-2xl p-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-brand-muted" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-brand-muted" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-brand-accent text-brand-dark font-semibold rounded-lg py-2.5 text-sm transition-opacity disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
