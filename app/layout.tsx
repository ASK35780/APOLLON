import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LaunchScreen } from "@/components/LaunchScreen";

export const metadata: Metadata = {
  title: "Apollon — Streaming musical",
  description: "La musique, en mouvement. Écoute, playlists et concerts en direct.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Apollon",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15161c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LaunchScreen />
        {children}
      </body>
    </html>
  );
}
