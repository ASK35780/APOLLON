"use client";

import { useState } from "react";
import { parseSubtitles, type SubtitleFormat } from "@/lib/subtitle-parsing";

const CLOSE_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SubtitleSubmissionFormProps {
  trackId: string;
  durationSeconds: number;
  onClose: () => void;
}

export function SubtitleSubmissionForm({ trackId, durationSeconds, onClose }: SubtitleSubmissionFormProps) {
  const [format, setFormat] = useState<SubtitleFormat>("simple");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (submitting || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const lines = parseSubtitles(format, text, durationSeconds);
      if (lines.length === 0) {
        throw new Error(
          format === "simple" ? "Ajoute au moins une ligne." : "Format attendu : « mm:ss texte », une ligne par sous-titre."
        );
      }
      const res = await fetch(`/api/tracks/${trackId}/subtitles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de l'envoi");
      setSuccess(true);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="subtitle-form">
      <div className="subtitle-form-top">
        <div className="t">Proposer des sous-titres</div>
        <button aria-label="Fermer" onClick={onClose}>
          {CLOSE_ICON}
        </button>
      </div>

      {success ? (
        <p className="edit-upload-status success">Envoyé, en attente de validation par l&apos;équipe Apollon.</p>
      ) : (
        <>
          <div className="subtitle-format-row">
            <button
              type="button"
              className={`subtitle-format-btn${format === "simple" ? " selected" : ""}`}
              onClick={() => setFormat("simple")}
            >
              Texte simple
            </button>
            <button
              type="button"
              className={`subtitle-format-btn${format === "timed" ? " selected" : ""}`}
              onClick={() => setFormat("timed")}
            >
              Ligne par ligne (mm:ss)
            </button>
          </div>
          <textarea
            className="subtitle-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              format === "simple"
                ? "Une ligne par sous-titre, réparties automatiquement sur la durée du titre…"
                : "0:00 Premier sous-titre\n0:12 Deuxième sous-titre…"
            }
          />
          {error && <p className="artist-error">{error}</p>}
          <button className="artist-submit-btn" disabled={!text.trim() || submitting} onClick={submit}>
            {submitting ? "Envoi…" : "Envoyer pour validation"}
          </button>
        </>
      )}
    </div>
  );
}
