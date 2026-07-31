"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

/**
 * Bouton « Renommer » qui déplie un formulaire inline (nom pré-rempli).
 * `action` est la Server Action renameLeague passée par la page.
 */
export default function RenameLeagueForm({
  action,
  currentName,
  locale,
}: {
  action: (formData: FormData) => Promise<void>;
  currentName: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
      >
        {t(locale, "league.rename")}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        name="name"
        type="text"
        required
        autoFocus
        defaultValue={currentName}
        aria-label={t(locale, "leagues.nameLabel")}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--color-gold)] px-3 py-1.5 text-xs font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
      >
        {t(locale, "league.renameSave")}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
      >
        {t(locale, "league.cancel")}
      </button>
    </form>
  );
}
