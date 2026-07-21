"use client";

import { useNotificationsStore, type NotificationType } from "@/store/notifications-store";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  live: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7" strokeLinecap="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
    </svg>
  ),
  release: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l11-2v13" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  ),
  badge: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.5 6.8L12 17.1 5.8 20.5l1.5-6.8-5.1-4.7 6.9-.7z" />
    </svg>
  ),
  playlist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path d="M4 6h13M4 12h13M4 18h7" strokeLinecap="round" />
      <path d="M18 15v5M15.5 17.5h5" strokeLinecap="round" />
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.6 4.4 5.1c2.3-1.2 4.8-.4 6.2 1.4l1.4 1.8 1.4-1.8c1.4-1.8 3.9-2.6 6.2-1.4 2.8 1.5 3.4 4.9 1.7 7.7C18.7 16.7 12 21 12 21z" />
    </svg>
  ),
};

export function NotificationsOverlay() {
  const open = useNotificationsStore((s) => s.open);
  const close = useNotificationsStore((s) => s.closePanel);
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className={`notifications-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={close}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Notifications</h2>
        <div style={{ width: 34 }} />
      </div>

      {hasUnread && (
        <button
          onClick={markAllRead}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 14,
            padding: 4,
          }}
        >
          Tout marquer comme lu
        </button>
      )}

      {notifications.length === 0 ? (
        <div className="notifications-empty">Aucune notification pour le moment.</div>
      ) : (
        <div className="notification-list">
          {notifications.map((n) => (
            <div key={n.id} className="notification-item">
              <div className="notification-icon" style={{ background: `linear-gradient(135deg, ${n.c1}, ${n.c2})` }}>
                {TYPE_ICON[n.type]}
              </div>
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-desc">{n.description}</div>
                <div className="notification-time">{n.time}</div>
              </div>
              {!n.read && <div className="notification-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
