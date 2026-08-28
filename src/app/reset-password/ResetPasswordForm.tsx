"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";
import PasswordField from "@/components/PasswordField";

export default function ResetPasswordForm({ locale }: { locale: Locale }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(
        t(locale, "login.passwordTooShort", { length: MIN_PASSWORD_LENGTH }),
      );
      return;
    }
    if (password !== confirm) {
      setErrorMsg(t(locale, "reset.mismatch"));
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Échec de updateUser (mot de passe) :", error);
      setErrorMsg(t(locale, "reset.error"));
      setBusy(false);
      return;
    }

    window.location.href = "/leagues";
  }

  return (
    <AuthCard>
      <h1 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
        {t(locale, "reset.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t(locale, "reset.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <PasswordField
          id="password"
          label={t(locale, "reset.passwordLabel")}
          value={password}
          onChange={setPassword}
          locale={locale}
          autoComplete="new-password"
          autoFocus
          minLength={MIN_PASSWORD_LENGTH}
          hint={t(locale, "login.passwordHint", {
            length: MIN_PASSWORD_LENGTH,
          })}
        />

        <PasswordField
          id="confirm"
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

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
        >
          {busy ? t(locale, "reset.submitting") : t(locale, "reset.submit")}
        </button>
      </form>
    </AuthCard>
  );
}
