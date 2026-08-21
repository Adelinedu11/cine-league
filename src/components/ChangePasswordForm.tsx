"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import PasswordField from "@/components/PasswordField";

/**
 * Changement de mot de passe depuis « Mon profil ».
 *
 * `updateUser({ password })` ne réclame pas l'ancien mot de passe : n'importe
 * qui trouvant une session ouverte (téléphone déverrouillé, poste partagé)
 * pourrait s'approprier le compte. On revérifie donc l'identité avec
 * `signInWithPassword` avant la mise à jour.
 */
export default function ChangePasswordForm({
  locale,
  email,
}: {
  locale: Locale;
  email: string;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");
    setDone(false);

    if (next.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(
        t(locale, "login.passwordTooShort", { length: MIN_PASSWORD_LENGTH }),
      );
      return;
    }
    if (next !== confirm) {
      setErrorMsg(t(locale, "reset.mismatch"));
      return;
    }
    if (next === current) {
      setErrorMsg(t(locale, "profile.passwordSame"));
      return;
    }

    setBusy(true);
    const supabase = createClient();

    // 1. Revérification de l'identité. Sur succès, Supabase renouvelle la
    // session en place : aucune déconnexion visible pour l'utilisateur.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInError) {
      setErrorMsg(t(locale, "profile.currentPasswordWrong"));
      setBusy(false);
      return;
    }

    // 2. Mise à jour effective.
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      console.error("Échec de updateUser (mot de passe) :", error);
      setErrorMsg(t(locale, "reset.error"));
      setBusy(false);
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(true);
    setBusy(false);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="font-display flex items-center gap-2 text-xl tracking-wide text-[var(--color-cream)]">
        <KeyRound size={16} strokeWidth={1.6} className="text-[var(--color-muted)]" />
        {t(locale, "profile.passwordTitle")}
      </h2>
      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "profile.passwordHint")}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          id="current-password"
          label={t(locale, "profile.currentPassword")}
          value={current}
          onChange={setCurrent}
          locale={locale}
          autoComplete="current-password"
        />
        <PasswordField
          id="new-password"
          label={t(locale, "reset.passwordLabel")}
          value={next}
          onChange={setNext}
          locale={locale}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={t(locale, "login.passwordHint", {
            length: MIN_PASSWORD_LENGTH,
          })}
        />
        <PasswordField
          id="confirm-password"
          label={t(locale, "reset.confirmLabel")}
          value={confirm}
          onChange={setConfirm}
          locale={locale}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />

        {errorMsg && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {errorMsg}
          </p>
        )}
        {done && (
          <p
            role="status"
            className="rounded-lg border border-[var(--color-teal)] bg-[var(--color-teal)]/15 px-3 py-2 text-sm text-[var(--color-cream)]"
          >
            {t(locale, "profile.passwordSaved")}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
        >
          {busy
            ? t(locale, "profile.passwordSaving")
            : t(locale, "profile.passwordSave")}
        </button>
      </form>
    </section>
  );
}
