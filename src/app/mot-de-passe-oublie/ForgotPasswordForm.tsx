"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";
import { RESET_CODE_LENGTH } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";

/**
 * Réinitialisation du mot de passe, en UN SEUL écran.
 *
 * Le découpage en deux étapes (e-mail puis code) était un piège : l'utilisateur
 * quitte forcément la page pour aller lire son e-mail, et au retour un simple
 * rechargement effaçait l'étape « saisie du code » sans aucun moyen d'y revenir.
 * Les deux champs sont donc affichés en permanence : recharger ne fait plus
 * perdre que ce qui est de toute façon dans la boîte mail.
 */
export default function ForgotPasswordForm({
  locale,
  expired,
}: {
  locale: Locale;
  expired?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Envoi du code. Volontairement PAS un submit de formulaire : le bouton
  // principal du formulaire est la validation du code.
  async function handleSendCode() {
    if (!email.trim()) {
      setErrorMsg(t(locale, "forgot.emailRequired"));
      return;
    }
    setSending(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      console.error("Échec de resetPasswordForEmail :", error);
      setErrorMsg(t(locale, "forgot.error"));
      setSending(false);
      return;
    }

    // Même confirmation que le compte existe ou non : dire « cet e-mail est
    // inconnu » permettrait d'énumérer les comptes inscrits.
    setSent(true);
    setSending(false);
  }

  // Validation du code. En cas de succès une session est ouverte : c'est elle
  // qui autorise ensuite le changement de mot de passe sur /reset-password.
  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });

    if (error) {
      console.error("Échec de verifyOtp (recovery) :", error);
      setErrorMsg(t(locale, "forgot.verifyError"));
      setVerifying(false);
      return;
    }

    // Navigation en dur : les Server Components doivent voir la session
    // fraîchement posée dans les cookies.
    window.location.href = "/reset-password";
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

      <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-4">
        {/* 1. Adresse e-mail + envoi du code */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "login.emailLabel")}
          </label>
          <div className="mt-2 flex gap-2">
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
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending}
              className="shrink-0 rounded-lg border border-[var(--color-gold)] px-3 py-2 text-sm font-medium text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-bg)] disabled:opacity-50"
            >
              {sending
                ? t(locale, "forgot.submitting")
                : sent
                  ? t(locale, "forgot.resend")
                  : t(locale, "forgot.submit")}
            </button>
          </div>
          {sent && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--color-teal-ink)]">
              <MailCheck size={14} strokeWidth={1.8} className="mt-px shrink-0" />
              {t(locale, "forgot.codeSentTo", {
                email: email.trim(),
                length: RESET_CODE_LENGTH,
              })}
            </p>
          )}
        </div>

        {/* 2. Code reçu par e-mail — toujours affiché, pour que revenir sur la
            page après avoir consulté sa boîte mail ne mène pas à un cul-de-sac. */}
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "forgot.codeLabel", { length: RESET_CODE_LENGTH })}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={RESET_CODE_LENGTH}
            required
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value.replace(/\D/g, "").slice(0, RESET_CODE_LENGTH),
              )
            }
            placeholder={"0".repeat(RESET_CODE_LENGTH)}
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/25 focus:border-[var(--color-gold)]"
          />
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            {t(locale, "forgot.codeHint")}
          </p>
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
          disabled={verifying || code.length < RESET_CODE_LENGTH}
          className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
        >
          {verifying ? t(locale, "forgot.verifying") : t(locale, "forgot.verify")}
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
