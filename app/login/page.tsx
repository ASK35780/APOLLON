"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ApollonWordmark } from "@/components/ApollonLogo";
import type { Provider } from "@supabase/supabase-js";

type Mode = "signin" | "signup";

const OAUTH_BUTTON_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: "var(--ink3)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: 13,
  color: "var(--paper)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.15.8 3.88 1.5l2.65-2.55C16.9 3.2 14.65 2.2 12 2.2 6.9 2.2 2.7 6.4 2.7 11.5s4.2 9.3 9.3 9.3c5.35 0 8.9-3.75 8.9-9.05 0-.6-.07-1.05-.15-1.55z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.21-3.37-1.21-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .28.18.61.69.5A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (searchParams.get("error")) router.replace("/login");
    // Only ever needs to clear the ?error= param from the URL once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsEmailConfirmation(false);

    const supabase = createClient();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "E-mail ou mot de passe incorrect."
            : signInError.message
        );
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      // The Supabase project still requires confirming the address before
      // a session is issued — see the note below the form.
      setNeedsEmailConfirmation(true);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  }

  async function handleOAuth(provider: Provider) {
    setError(null);
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser is redirected to the provider immediately, so
    // this only ever runs again if the redirect itself failed to start.
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050506",
        color: "var(--paper)",
        padding: "max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ marginBottom: 8 }}>
          <ApollonWordmark markSize={28} textSize={28} />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 2 }}>
          {forgotMode ? "Récupère l'accès à ton compte." : mode === "signin" ? "Connecte-toi à ton compte." : "Crée ton compte."}
        </p>

        {forgotMode ? (
          resetSent ? (
            <>
              <p style={{ color: "#34C8A6", fontSize: 13, lineHeight: 1.5 }}>
                Si un compte existe pour {email}, un e-mail avec un lien de réinitialisation vient d&apos;être envoyé.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setResetSent(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                Retour à la connexion
              </button>
            </>
          ) : (
            <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                required
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: "var(--ink3)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 14,
                  color: "var(--paper)",
                  fontSize: 16,
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                Retour à la connexion
              </button>
              {error && <p style={{ color: "#FF6B7A", fontSize: 13 }}>{error}</p>}
            </form>
          )
        ) : (
          <>
            <button
              type="button"
              style={OAUTH_BUTTON_STYLE}
              disabled={oauthLoading !== null}
              onClick={() => handleOAuth("google")}
            >
              <GoogleIcon />
              {oauthLoading === "google" ? "Redirection…" : "Continuer avec Google"}
            </button>
            <button
              type="button"
              style={OAUTH_BUTTON_STYLE}
              disabled={oauthLoading !== null}
              onClick={() => handleOAuth("github")}
            >
              <GitHubIcon />
              {oauthLoading === "github" ? "Redirection…" : "Continuer avec GitHub"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                required
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: "var(--ink3)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 14,
                  color: "var(--paper)",
                  fontSize: 16,
                }}
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mot de passe"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: "var(--ink3)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 14,
                  color: "var(--paper)",
                  fontSize: 16,
                }}
              />

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    alignSelf: "flex-end",
                  }}
                >
                  Mot de passe oublié ?
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {loading ? "Chargement…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setNeedsEmailConfirmation(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                {mode === "signin" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
              </button>

              {error && <p style={{ color: "#FF6B7A", fontSize: 13 }}>{error}</p>}
              {needsEmailConfirmation && (
                <p style={{ color: "#E8B84B", fontSize: 13 }}>
                  Compte créé. La confirmation par e-mail est encore activée sur ce projet Supabase —
                  désactive-la dans Authentication → Sign In / Providers → Email → &quot;Confirm
                  email&quot; pour te connecter directement sans e-mail.
                </p>
              )}
            </form>
          </>
        )}

        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            padding: 6,
            marginTop: 4,
          }}
        >
          Continuer en tant qu&apos;invité
        </button>
      </div>
    </main>
  );
}
