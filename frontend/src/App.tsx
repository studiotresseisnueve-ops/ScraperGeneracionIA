import { useEffect, useState } from "react";
import { checkAuth, logout } from "./api/client";
import { LoginPage } from "./components/LoginPage";
import { BrandingModule } from "./components/modules/BrandingModule";
import { InspirationModule } from "./components/modules/InspirationModule";
import { GenerationModule } from "./components/modules/GenerationModule";
import { AdminModule } from "./components/modules/AdminModule";
import { getSessionDetail } from "./api/client";
import type { BrandProfile } from "./types";

const TABS = [
  { id: "ingesta",     label: "Ingesta",     icon: "📄" },
  { id: "inspiracion", label: "Inspiración", icon: "🎬" },
  { id: "generacion",  label: "Generación",  icon: "🎨" },
  { id: "admin",       label: "Admin",       icon: "📊" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab]       = useState<Tab>("ingesta");
  const [profile, setProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    checkAuth().then(setAuthenticated);
    const onExpired = () => setAuthenticated(false);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setProfile(null);
    setTab("ingesta");
  };

  const handleProfileReady = (p: BrandProfile) => {
    setProfile(p);
    setTab("inspiracion");
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      const data = await getSessionDetail(sessionId);
      setProfile(data.profile);
      setTab("inspiracion");
    } catch {}
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <span className="text-brand-muted text-sm">Cargando...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <header className="border-b border-brand-border px-6 py-3 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-brand-accent font-bold text-lg tracking-tight">AI</span>
          <span className="text-white font-semibold">Inspiration Engine</span>
        </div>

        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors",
                tab === t.id
                  ? "bg-brand-surface text-white font-medium"
                  : "text-brand-muted hover:text-white",
              ].join(" ")}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {profile && (
          <div className="flex items-center gap-2.5 text-xs min-w-0">
            <div className="flex gap-1 shrink-0">
              {profile.colors.slice(0, 5).map((c) => (
                <div
                  key={c}
                  className="h-3 w-3 rounded-full border border-white/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span className="text-brand-muted truncate max-w-[220px]">{profile.filename}</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="ml-auto text-brand-muted hover:text-white text-xs transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {tab === "ingesta" && (
          <BrandingModule onProfileReady={handleProfileReady} />
        )}
        {tab === "inspiracion" && (
          <InspirationModule profile={profile} />
        )}
        {tab === "generacion" && (
          <GenerationModule profile={profile} />
        )}
        {tab === "admin" && (
          <AdminModule
            currentSessionId={profile?.session_id}
            onLoadSession={handleLoadSession}
          />
        )}
      </main>
    </div>
  );
}
