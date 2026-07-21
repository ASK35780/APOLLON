import { CoverArt } from "@/components/CoverArt";
import type { CoverPattern } from "@/types/database";

interface ProfilePhotoProps {
  url: string | null;
  c1: string;
  c2: string;
  pattern: CoverPattern;
  className?: string;
  alt?: string;
}

// Renders the real uploaded photo when present, otherwise falls back to the
// same generative CoverArt used elsewhere. Reuses CoverArt's own class names
// ("cover cover-<pattern>") on the <img> itself so it picks up the same
// sizing/rounding rules — see the `img.cover` rule in app/globals.css.
export function ProfilePhoto({ url, c1, c2, pattern, className = "", alt = "" }: ProfilePhotoProps) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={`cover cover-${pattern} ${className}`.trim()} />;
  }
  return <CoverArt c1={c1} c2={c2} pattern={pattern} className={className} />;
}
