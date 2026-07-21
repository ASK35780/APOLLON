"use client";

import { useId } from "react";

interface HeartIconProps {
  filled: boolean;
  // The liked track's own cover colors — each heart reflects its own
  // track's palette instead of the shared --accent (which follows whatever
  // is currently playing, not necessarily this row's track).
  c1?: string;
  c2?: string;
}

export function HeartIcon({ filled, c1, c2 }: HeartIconProps) {
  const gradientId = useId();
  const useGradient = filled && c1 && c2;

  return (
    <svg
      viewBox="0 0 24 24"
      fill={useGradient ? `url(#${gradientId})` : filled ? "var(--accent)" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      {useGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
      )}
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.6 4.4 5.1c2.3-1.2 4.8-.4 6.2 1.4l1.4 1.8 1.4-1.8c1.4-1.8 3.9-2.6 6.2-1.4 2.8 1.5 3.4 4.9 1.7 7.7C18.7 16.7 12 21 12 21z" />
    </svg>
  );
}
