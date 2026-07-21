"use client";

import { useNotificationsStore } from "@/store/notifications-store";

export function NotificationsBellButton() {
  const unread = useNotificationsStore((s) => s.notifications.filter((n) => !n.read).length);
  const openPanel = useNotificationsStore((s) => s.openPanel);

  return (
    <button className="notif-bell-btn" aria-label="Notifications" onClick={openPanel}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
      </svg>
      {unread > 0 && <span className="notif-bell-dot">{unread}</span>}
    </button>
  );
}
