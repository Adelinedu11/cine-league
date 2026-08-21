"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";
import AuthCard from "@/components/AuthCard";

export default function ForgotPasswordForm({
  locale,
  expired,
}: {
  locale: Locale;
  expired?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Le lien reçu par mail passe par notre callback, qui échange le code
      // contre une session puis redirige vers l'écran de nouveau mot de passe.
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error("Échec de resetPasswordForEmail :", error);
      setErrorMsg(t(locale, "forgot.error"));
      setBusy(false);
      return;
    }

    // On affiche le même écran quoi qu'il arrive côté compte existant ou non :
    // dire « cet e-mail est inconnu » permettrait d'énumérer les comptes.
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <AuthCard>
        <div className="text-center">
          <MailCheck
            size={32}
            strokeWidth={1.5}
            className="mx-auto text-[var(--color-gold)]"
          />
          <h1 className="font-display mt-4 text-3xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "forgot.sentTitle")}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {t(locale, "forgot.sent", { email })}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-[var(--color-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-cream)]"
          >
            {t(locale, "forgot.back")}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
        {t(locale, "forgot.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t(locale, "forgot.subtitle")}
      </p>

      {expired && (
        <p className="mt-4 rounded-lg border border-[var(--color-yellow)] bg-[var(--color-yellow)]/15 px-3 py-2 text-sm text-[var(--color-cream)]">
          {t(locale, "reset.expired")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "login.emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "login.emailPlaceholder")}
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
          />
        </div>

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
          {busy ? t(locale, "forgot.submitting") : t(locale, "forgot.submit")}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm text-[var(--color-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-cream)]"
        >
          {t(locale, "forgot.back")}
        </Link>
      </p>
    </AuthCard>
  );
}
