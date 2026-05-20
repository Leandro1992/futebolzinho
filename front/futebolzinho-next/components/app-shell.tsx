"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-context";

const navItems = [
  { href: "/", label: "Partidas" },
  { href: "/jogadores", label: "Jogadores", requiresAuth: true },
  { href: "/partida-form", label: "Nova Partida", requiresAuth: true },
  { href: "/estatisticas", label: "Estatisticas" },
  { href: "/desculpas", label: "Desculpas" },
  { href: "/partidas-avulsas", label: "Avulsas", requiresAuth: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoggedIn, userEmail, login, logout, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const userLabel = userEmail
    ? userEmail.split("@")[0].replace(/[._-]+/g, " ").trim().slice(0, 16) || "Usuario"
    : "Usuario";

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setLoginError(null);
    try {
      await login(email, password);
      setShowLogin(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao fazer login";
      setLoginError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand-block">
          <img className="brand-logo" src="/logo.PNG" alt="Logo Futebolzinho" />
          <div>
            <p className="topbar-title">Futebol de 5ª</p>
            {/* <p className="topbar-subtitle">Gestao de partidas e desempenho</p> */}
          </div>
        </div>

        <nav className="top-nav">
          {navItems
            .filter((item) => !item.requiresAuth || isLoggedIn)
            .map((item) => (
              <Link
                key={item.href}
                className={pathname === item.href ? "nav-item active" : "nav-item"}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
        </nav>

        {!loading && (
          <div className="topbar-auth">
            {!isLoggedIn ? (
              <button className="btn primary" onClick={() => setShowLogin(true)}>
                Login
              </button>
            ) : (
              <details className="user-menu">
                <summary className="user-menu-trigger">
                  <span className="user-avatar" aria-hidden="true">
                    {userLabel.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-menu-label">{userLabel}</span>
                </summary>
                <div className="user-menu-panel">
                  <p className="user-menu-email">{userEmail}</p>
                  <button className="btn ghost user-menu-logout" onClick={logout}>
                    Sair
                  </button>
                </div>
              </details>
            )}
          </div>
        )}
      </header>

      <main className="content">{children}</main>

      {showLogin ? (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="login-brand">
              <img className="login-logo" src="/logo.PNG" alt="Logo Futebolzinho" />
              <div>
                <h2>Entrar</h2>
                <p className="meta">Acesse para gerenciar jogadores e partidas.</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="form-grid">
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                />
              </label>
              <label>
                Senha
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                />
              </label>
              {loginError ? <p className="error-msg">{loginError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowLogin(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary" disabled={sending}>
                  {sending ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
