"use client";

import {
  useAudioSettingsStore,
  EQ_PRESETS,
  PLAYBACK_RATES,
  FADE_DURATIONS,
  type EqPreset,
} from "@/store/audio-settings-store";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function SoundSlider({
  label,
  value,
  min,
  max,
  step = 1,
  bipolar = false,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  bipolar?: boolean;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  function handlePick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  }

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="snd-slider-row">
      <div className="snd-slider-label">
        <span>{label}</span>
        <span className="v">{format(value)}</span>
      </div>
      <div className="snd-slider-bar" onClick={handlePick}>
        {bipolar && <div className="snd-slider-mid" />}
        <div
          className={`snd-slider-fill${bipolar ? " bipolar" : ""}`}
          style={bipolar ? { left: `${Math.min(50, pct)}%`, width: `${Math.abs(pct - 50)}%` } : { width: `${pct}%` }}
        />
        <div className="snd-slider-thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  active,
  onToggle,
}: {
  label: string;
  hint: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="snd-toggle-row">
      <div>
        <div className="t">{label}</div>
        <div className="snd-hint">{hint}</div>
      </div>
      <button
        type="button"
        className={`snd-switch${active ? " on" : ""}`}
        onClick={onToggle}
        role="switch"
        aria-checked={active}
        aria-label={label}
      >
        <span className="knob" />
      </button>
    </div>
  );
}

export function SoundSettingsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const eqBass = useAudioSettingsStore((s) => s.eqBass);
  const eqMid = useAudioSettingsStore((s) => s.eqMid);
  const eqTreble = useAudioSettingsStore((s) => s.eqTreble);
  const balance = useAudioSettingsStore((s) => s.balance);
  const mono = useAudioSettingsStore((s) => s.mono);
  const loudnessNormalization = useAudioSettingsStore((s) => s.loudnessNormalization);
  const boost = useAudioSettingsStore((s) => s.boost);
  const playbackRate = useAudioSettingsStore((s) => s.playbackRate);
  const fadeDuration = useAudioSettingsStore((s) => s.fadeDuration);

  const setEqBand = useAudioSettingsStore((s) => s.setEqBand);
  const applyPreset = useAudioSettingsStore((s) => s.applyPreset);
  const setBalance = useAudioSettingsStore((s) => s.setBalance);
  const toggleMono = useAudioSettingsStore((s) => s.toggleMono);
  const toggleLoudnessNormalization = useAudioSettingsStore((s) => s.toggleLoudnessNormalization);
  const setBoost = useAudioSettingsStore((s) => s.setBoost);
  const setPlaybackRate = useAudioSettingsStore((s) => s.setPlaybackRate);
  const setFadeDuration = useAudioSettingsStore((s) => s.setFadeDuration);
  const resetAll = useAudioSettingsStore((s) => s.resetAll);

  const activePreset = (Object.keys(EQ_PRESETS) as EqPreset[]).find((key) => {
    const p = EQ_PRESETS[key];
    return p.bass === eqBass && p.mid === eqMid && p.treble === eqTreble;
  });

  return (
    <div className={`artist-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          {BACK_ICON}
        </button>
        <h2>Lecture et son</h2>
        <div style={{ width: 34 }} />
      </div>

      <p className="edit-section-hint" style={{ marginTop: 6 }}>
        Ces réglages s&apos;appliquent en direct pendant l&apos;écoute et sont mémorisés sur cet appareil.
      </p>

      <div className="artist-tracks-title" style={{ marginTop: 22 }}>
        Égaliseur
      </div>
      <div className="admin-tabs" style={{ marginTop: 8 }}>
        {(Object.keys(EQ_PRESETS) as EqPreset[]).map((key) => (
          <button
            key={key}
            className={`admin-tab${activePreset === key ? " active" : ""}`}
            onClick={() => applyPreset(key)}
          >
            {EQ_PRESETS[key].label}
          </button>
        ))}
      </div>
      <SoundSlider
        label="Graves"
        value={eqBass}
        min={-12}
        max={12}
        bipolar
        format={(v) => `${v > 0 ? "+" : ""}${v} dB`}
        onChange={(v) => setEqBand("bass", v)}
      />
      <SoundSlider
        label="Médiums"
        value={eqMid}
        min={-12}
        max={12}
        bipolar
        format={(v) => `${v > 0 ? "+" : ""}${v} dB`}
        onChange={(v) => setEqBand("mid", v)}
      />
      <SoundSlider
        label="Aigus"
        value={eqTreble}
        min={-12}
        max={12}
        bipolar
        format={(v) => `${v > 0 ? "+" : ""}${v} dB`}
        onChange={(v) => setEqBand("treble", v)}
      />

      <div className="artist-tracks-title" style={{ marginTop: 26 }}>
        Balance
      </div>
      <SoundSlider
        label="Gauche / Droite"
        value={balance}
        min={-1}
        max={1}
        step={0.05}
        bipolar
        format={(v) => (Math.abs(v) < 0.03 ? "Centre" : v < 0 ? `Gauche ${Math.round(-v * 100)}%` : `Droite ${Math.round(v * 100)}%`)}
        onChange={setBalance}
      />

      <div className="artist-tracks-title" style={{ marginTop: 26 }}>
        Volume
      </div>
      <SoundSlider
        label="Amplification"
        value={boost}
        min={100}
        max={150}
        step={5}
        format={(v) => `${v}%`}
        onChange={setBoost}
      />
      <p className="snd-hint" style={{ marginTop: 10, marginBottom: 6 }}>
        Utile pour les titres enregistrés trop bas. Au-delà de 100%, active la normalisation pour éviter la
        saturation.
      </p>
      <ToggleRow
        label="Normalisation du volume"
        hint="Lisse les écarts de volume entre les titres et protège contre la saturation."
        active={loudnessNormalization}
        onToggle={toggleLoudnessNormalization}
      />

      <div className="artist-tracks-title" style={{ marginTop: 26 }}>
        Mode audio
      </div>
      <ToggleRow
        label="Son mono"
        hint="Fusionne les canaux gauche et droit — utile avec une seule oreillette."
        active={mono}
        onToggle={toggleMono}
      />

      <div className="artist-tracks-title" style={{ marginTop: 26 }}>
        Vitesse de lecture
      </div>
      <div className="admin-tabs" style={{ marginTop: 8 }}>
        {PLAYBACK_RATES.map((rate) => (
          <button
            key={rate}
            className={`admin-tab${playbackRate === rate ? " active" : ""}`}
            onClick={() => setPlaybackRate(rate)}
          >
            {rate}×
          </button>
        ))}
      </div>

      <div className="artist-tracks-title" style={{ marginTop: 26 }}>
        Fondu à l&apos;ouverture et à la fermeture
      </div>
      <div className="admin-tabs" style={{ marginTop: 8 }}>
        {FADE_DURATIONS.map((d) => (
          <button
            key={d}
            className={`admin-tab${fadeDuration === d ? " active" : ""}`}
            onClick={() => setFadeDuration(d)}
          >
            {d === 0 ? "Désactivé" : `${d}s`}
          </button>
        ))}
      </div>

      <button className="admin-edit-toggle" style={{ marginTop: 28 }} onClick={resetAll}>
        Réinitialiser tous les réglages de son
      </button>
    </div>
  );
}
