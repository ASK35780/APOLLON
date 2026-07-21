import { create } from "zustand";

export type NotificationType = "live" | "release" | "badge" | "playlist" | "social";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
  c1: string;
  c2: string;
}

// Placeholder data so the notifications UI has something to show — no
// backend/table exists yet. Swap for a real `notifications` query (with its
// own RLS policy, mirroring likes/live_show_purchases) when this ships.
const FAKE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    type: "live",
    title: "Nour Kali est en direct",
    description: "Session acoustique surprise vient de commencer.",
    time: "À l'instant",
    read: false,
    c1: "#FF3B4E",
    c2: "#FF6B4A",
  },
  {
    id: "2",
    type: "release",
    title: "Nouveau titre de Kaïros",
    description: "« Combustion » vient d'être ajouté à ta bibliothèque.",
    time: "Il y a 2 h",
    read: false,
    c1: "oklch(0.5 0.06 60)",
    c2: "#14213D",
  },
  {
    id: "3",
    type: "badge",
    title: "Badge débloqué : Noctambule",
    description: "Tu as écouté après minuit 10 fois.",
    time: "Hier",
    read: true,
    c1: "oklch(0.78 0.16 75)",
    c2: "oklch(0.65 0.15 75)",
  },
  {
    id: "4",
    type: "live",
    title: "Le live commence dans 1 heure",
    description: "Anaïs Dune — Concert de clôture de tournée.",
    time: "Hier",
    read: true,
    c1: "oklch(0.6 0.14 55)",
    c2: "#6C8EEF",
  },
  {
    id: "5",
    type: "playlist",
    title: "Playlist mise à jour",
    description: "« Focus profond » a reçu 8 nouveaux titres.",
    time: "Il y a 2 jours",
    read: true,
    c1: "#2FB8C6",
    c2: "oklch(0.78 0.16 75)",
  },
  {
    id: "6",
    type: "social",
    title: "Yuna Vesper a aimé ta playlist",
    description: "« Retour de flamme » lui a plu.",
    time: "Il y a 3 jours",
    read: true,
    c1: "#8FD3F4",
    c2: "oklch(0.6 0.14 55)",
  },
];

interface NotificationsState {
  open: boolean;
  notifications: AppNotification[];
  openPanel: () => void;
  closePanel: () => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  open: false,
  notifications: FAKE_NOTIFICATIONS,
  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));
