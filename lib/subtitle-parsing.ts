import type { SubtitleLine } from "@/types/database";

// Shared by the "propose subtitles for any track" form (NowPlaying) and the
// artist's own "add subtitles while uploading" form (BecomeArtistOverlay).
export type SubtitleFormat = "simple" | "timed";

export function parseSimpleSubtitles(text: string, durationSeconds: number): SubtitleLine[] {
  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return [];
  const step = durationSeconds / rawLines.length;
  return rawLines.map((line, i) => ({ timestamp_seconds: Math.round(i * step), text: line }));
}

export function parseTimedSubtitles(text: string): SubtitleLine[] {
  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lines: SubtitleLine[] = [];
  for (const line of rawLines) {
    const match = line.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
    if (!match || !match[3]) continue;
    lines.push({ timestamp_seconds: Number(match[1]) * 60 + Number(match[2]), text: match[3] });
  }
  return lines;
}

export function parseSubtitles(format: SubtitleFormat, text: string, durationSeconds: number): SubtitleLine[] {
  return format === "simple" ? parseSimpleSubtitles(text, durationSeconds) : parseTimedSubtitles(text);
}
