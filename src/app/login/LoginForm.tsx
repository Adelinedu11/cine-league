"use client";

import { useState, type FormEvent } from "react";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";

// idle/sending : écran e-mail ; code/verifying : écran de saisie du code.
type Status = "idle" | "sending" | "code" | "verifying";

export default function LoginForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Étape 1 : demander l'envoi d'un code à 6 chiffres (pas de emailRedirectTo →
  // Supabase envoie un code OTP au lieu d'un lien magique).
  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      // L'objet complet (name, status, code…) est loggé dans la console du
      // navigateur : cet appel ne passe pas par le serveur Next.js.
      console.error("Échec de signInWithOtp :", error);
      const hasReadableMessage =
        typeof error.message === "string" &&
        error.message.trim() !== "" &&
        error.message.trim() !== "{}";
      const base = hasReadableMessage
        ? error.message
        : t(locale, "login.errorFallback");
      const detail = [error.code, error.status ? `HTTP ${error.status}` : null]
        .filter(Boolean)
        .join(" · ");
      setErrorMsg(detail ? `${base} (${detail})` : base);
      setStatus("idle");
      return;
    }

    setStatus("code");
  }

  // Étape 2 : vérifier le code saisi. En cas de succès, la session est posée
  // dans les cookies (client @supabase/ssr) ; on navigue en dur pour que les
  // Server Components la voient.
  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("verifying");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (error) {
      console.error("Échec de verifyOtp :", error);
      setErrorMsg(t(locale, "login.verifyError"));
      setStatus("code");
      return;
    }

    window.location.href = "/accueil";
  }

  const brand = (
    <div className="mb-6 flex items-center justify-center gap-2">
      <Ticket size={20} strokeWidth={1.5} className="text-[var(--color-gold)]" />
      <span className="font-display text-2xl tracking-wide text-[var(--color-gold)]">
        Ciné League
      </span>
    </div>
  );

  // Écran 2 : saisie du code à 6 chiffres.
  if (status === "code" || status === "verifying") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <form
          onSubmit={handleVerify}
          className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center"
        >
          {brand}
          <h1 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "login.sentTitle")}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {t(locale, "login.codeSentTo", { email })}
          </p>

          <label
            htmlFor="code"
            className="mt-6 block text-left text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "login.codeLabel")}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder={t(locale, "login.codePlaceholder")}
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-[var(--color-cream)] outline-none placeholder:tracking-normal placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
          />

          {errorMsg && (
            <p className="mt-3 text-left text-sm text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "verifying" || code.length < 6}
            className="mt-6 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
          >
            {status === "verifying"
              ? t(locale, "login.verifying")
              : t(locale, "login.verify")}
          </button>
        </form>
      </main>
    );
  }

  // Écran 1 : saisie de l'e-mail.
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSendCode}
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
      >
        {brand}
        <h1 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
          {t(locale, "login.title")}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(locale, "login.subtitle")}
        </p>

        <label
          htmlFor="email"
          className="mt-6 block text-sm font-medium text-[var(--color-cream)]"
        >
          {t(locale, "login.emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t(locale, "login.emailPlaceholder")}
          className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
        />

        {errorMsg && (
          <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-6 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
        >
          {status === "sending"
            ? t(locale, "login.submitting")
            : t(locale, "login.submit")}
        </button>
      </form>
    </main>
  );
}
