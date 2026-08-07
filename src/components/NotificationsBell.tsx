"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { formatRoundDate } from "@/lib/rounds";

export type NotificationItem = {
  id: string;
  league_id: string | null;
  round_id: string | null;
  kind: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

/**
 * Cloche de notifications in-app (badge + liste), sans push ni email — juste
 * un signal pour savoir "sur quoi aller" (backlog point 12). Le contenu est
 * calculé côté serveur (jamais de titre de film ni de contenu de vote dans
 * les messages, pour préserver l'anonymat des phases en cours).
 */
export default function NotificationsBell({
  notifications,
  locale,
  markAllRead,
}: {
  notifications: NotificationItem[];
  locale: Locale;
  markAllRead: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(locale, "notifications.title")}
        className="relative flex shrink-0 items-center rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-gold)] px-1 text-[10px] font-medium text-[var(--color-bg)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
            <span className="text-sm font-medium text-[var(--color-cream)]">
              {t(locale, "notifications.title")}
            </span>
            {unreadCount > 0 && (
              <form action={markAllRead}>
                <button
                  type="submit"
                  className="text-xs text-[var(--color-gold)] hover:underline"
                >
                  {t(locale, "notifications.markAllRead")}
                </button>
              </form>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
                {t(locale, "notifications.empty")}
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-[var(--color-border)] px-4 py-2.5 text-sm last:border-b-0 ${
                    n.read_at
                      ? "text-[var(--color-muted)]"
                      : "text-[var(--color-cream)]"
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="font-mono mt-0.5 text-[10px] text-[var(--color-muted)]">
                    {formatRoundDate(n.created_at, locale)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
