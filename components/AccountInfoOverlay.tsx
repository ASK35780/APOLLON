"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function AccountInfoOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [open]);

  async function handleChangePassword() {
    setError(null);
    setSuccess(false);
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`artist-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          {BACK_ICON}
        </button>
        <h2>Mes informations</h2>
        <div style={{ width: 34 }} />
      </div>

      {email ? (
        <>
          <div className="artist-field">
            <label>Adresse e-mail</label>
            <p style={{ fontSize: 14, color: "var(--paper)" }}>{email}</p>
          </div>

          <div className="artist-tracks-title" style={{ marginTop: 24 }}>
            Changer le mot de passe
          </div>
          <div className="artist-field">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6 caractères minimum"
            />
          </div>
          <div className="artist-field">
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retape le mot de passe"
            />
          </div>

          {error && <p className="artist-error">{error}</p>}
          {success && (
            <p className="edit-upload-status success" style={{ marginTop: 8 }}>
              Mot de passe mis à jour.
            </p>
          )}

          <button
            className="artist-submit-btn"
            disabled={!newPassword || !confirmPassword || saving}
            onClick={handleChangePassword}
          >
            {saving ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </button>
        </>
      ) : (
        <p className="edit-section-hint" style={{ marginTop: 10 }}>
          Connecte-toi pour gérer ton compte.
        </p>
      )}
    </div>
  );
}
