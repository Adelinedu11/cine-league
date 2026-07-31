"use client";

import { useState, type FormEvent } from "react";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";

type Status = "idle" | "loading" | "sent" | "error";

export default function LoginForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      // L'objet complet (name, status, code…) est loggé dans la console du
      // navigateur : cet appel ne passe pas par le serveur Next.js.
      console.error("Échec de signInWithOtp :", error);
      setStatus("error");

      // error.message peut être vide ou valoir "{}" quand Supabase ne parvient
      // pas à extraire un message : on prévoit un repli lisible + le code/statut.
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
      return;
    }

    setStatus("sent");
  }

  const brand = (
    <div className="mb-6 flex items-center justify-center gap-2">
      <Ticket size={20} strokeWidth={1.5} className="text-[var(--color-gold)]" />
      <span className="font-display text-2xl tracking-wide text-[var(--color-gold)]">
        Ciné League
      </span>
    </div>
  );

  if (status === "sent") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          {brand}
          <h1 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "login.sentTitle")}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {t(locale, "login.sentBody1")}
            <span className="font-medium text-[var(--color-cream)]">
              {email}
            </span>
            {t(locale, "login.sentBody2")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
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

        {status === "error" && (
          <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-6 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
        >
          {status === "loading"
            ? t(locale, "login.submitting")
            : t(locale, "login.submit")}
        </button>
      </form>
    </main>
  );
}
