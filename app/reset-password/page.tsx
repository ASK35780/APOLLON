"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ApollonWordmark } from "@/components/ApollonLogo";
import type { EmailOtpType } from "@supabase/supabase-js";

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--ink3)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: 14,
  color: "var(--paper)",
  fontSize: 16,
};
const PRIMARY_BUTTON_STYLE: React.CSSProperties = {
  background: "var(--accent)",
  border: "none",
  borderRadius: 12,
  padding: 14,
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verifying the token_hash from a (possibly custom) recovery email link:
  // establishes the session directly with Supabase from whichever browser
  // opens the link, instead of relying on a PKCE code_verifier that only
  // exists in the browser that originally requested the reset — that
  // cross-browser mismatch is what causes "PKCE code verifier not found".
  // See app/auth/callback/route.ts for the older code-exchange path this
  // falls back to when the link has no token_hash (still fine as long as
  // the link is opened in the same browser that requested the reset).
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    if (!tokenHash || !type) {
      setVerifying(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: verifyOtpError }) => {
      if (verifyOtpError) setVerifyError(verifyOtpError.message);
      setVerifying(false);
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
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

        {verifying ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Vérification du lien…</p>
        ) : verifyError ? (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 2 }}>Ce lien n&apos;est plus valide.</p>
            <p style={{ color: "#FF6B7A", fontSize: 13, lineHeight: 1.5 }}>
              {verifyError} — redemande un lien de réinitialisation et ouvre-le dans ce même navigateur, le plus tôt
              possible après l&apos;avoir reçu.
            </p>
            <button type="button" onClick={() => router.push("/login")} style={PRIMARY_BUTTON_STYLE}>
              Retour à la connexion
            </button>
          </>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 2 }}>Choisis un nouveau mot de passe.</p>

            {success ? (
              <>
                <p style={{ color: "#34C8A6", fontSize: 13 }}>Mot de passe mis à jour !</p>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/");
                    router.refresh();
                  }}
                  style={PRIMARY_BUTTON_STYLE}
                >
                  Continuer
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nouveau mot de passe"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={INPUT_STYLE}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Confirmer le mot de passe"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={INPUT_STYLE}
                />
                <button type="submit" disabled={loading} style={PRIMARY_BUTTON_STYLE}>
                  {loading ? "Chargement…" : "Mettre à jour le mot de passe"}
                </button>
                {error && <p style={{ color: "#FF6B7A", fontSize: 13 }}>{error}</p>}
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
