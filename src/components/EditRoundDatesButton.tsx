"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { t, type Locale } from "@/lib/i18n";
import { toDatetimeLocalValue } from "@/lib/rounds";

/**
 * Bouton admin « Modifier les dates » d'une séance. Au clic, déplie un
 * formulaire (Server Action) avec deux champs date/heure pré-remplis :
 * date limite de soumission et date de la cérémonie.
 */
export default function EditRoundDatesButton({
  action,
  submissionDeadline,
  ceremonyAt,
  locale,
}: {
  action: (formData: FormData) => Promise<void>;
  submissionDeadline: string;
  ceremonyAt: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)]"
      >
        {t(locale, "round.editDates")}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex w-full flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-[var(--color-cream)]">
        {t(locale, "league.deadlineLabel")}
        <input
          type="datetime-local"
          name="submission_deadline"
          defaultValue={toDatetimeLocalValue(submissionDeadline)}
          required
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-cream)]">
        {t(locale, "league.ceremonyLabel")}
        <input
          type="datetime-local"
          name="ceremony_at"
          defaultValue={toDatetimeLocalValue(ceremonyAt)}
          required
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)]"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <SubmitButton
          locale={locale}
          className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
        >
          {t(locale, "profile.save")}
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-alt)]"
        >
          {t(locale, "league.cancel")}
        </button>
      </div>
    </form>
  );
}
