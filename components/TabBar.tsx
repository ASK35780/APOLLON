"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/store/ui-store";

const ACCUEIL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
  </svg>
);

const LIVE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    <path d="M8.5 8.5a5 5 0 0 0 0 7" strokeLinecap="round" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
    <path d="M5.5 5.5a9 9 0 0 0 0 13" strokeLinecap="round" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
  </svg>
);

const LIBRARY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 4v16M9 4l10 3.2v10L9 20M9 4v16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DISCUSSION_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function TabBar() {
  const pathname = usePathname();
  const liveOpen = useUiStore((s) => s.liveOpen);
  const openLive = useUiStore((s) => s.openLive);

  return (
    <nav className="tab-bar">
      <Link href="/" className={`tab${pathname === "/" ? " active" : ""}`}>
        {ACCUEIL_ICON}
        Accueil
      </Link>
      <Link href="/search" className={`tab${pathname === "/search" ? " active" : ""}`}>
        {SEARCH_ICON}
        Rechercher
      </Link>
      <button className={`tab${liveOpen ? " active" : ""}`} onClick={openLive}>
        {LIVE_ICON}
        Live
      </button>
      <Link href="/library" className={`tab${pathname === "/library" ? " active" : ""}`}>
        {LIBRARY_ICON}
        Bibliothèque
      </Link>
      <Link href="/discussion" className={`tab${pathname === "/discussion" ? " active" : ""}`}>
        {DISCUSSION_ICON}
        Discussion
      </Link>
    </nav>
  );
}
