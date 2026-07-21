import type { CoverPattern } from "@/types/database";

interface CoverArtProps {
  c1: string;
  c2: string;
  pattern: CoverPattern;
  className?: string;
  children?: React.ReactNode;
}

export function CoverArt({ c1, c2, pattern, className = "", children }: CoverArtProps) {
  return (
    <div
      className={`cover cover-${pattern} ${className}`.trim()}
      style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
