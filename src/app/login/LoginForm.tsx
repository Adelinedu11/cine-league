"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/i18n";
import { MIN_PASSWORD_LENGTH, authErrorKey } from "@/lib/auth";
import AuthCard from "@/components/AuthCard";
import PasswordField from "@/components/PasswordField";

// Deux modes dans un seul écran : on bascule par onglet, sans changer d'URL,
// pour que l'e-mail déjà saisi ne soit pas perdu.
type Mode = "signin" | "signup";

export default function LoginForm({
  locale,
  initialMode = "signin",
}: {
  locale: Locale;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMsg("");
    setPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");

    // Validation locale avant l'appel réseau : messages immédiats et traduits,
    // là où Supabase répondrait en anglais.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(
        t(locale, "login.passwordTooShort", { length: MIN_PASSWORD_LENGTH }),
      );
      return;
    }
    if (mode === "signup" && pseudo.trim() === "") {
      setErrorMsg(t(locale, "login.pseudoRequired"));
      return;
    }

    setBusy(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Échec de signInWithPassword :", error);
        setErrorMsg(t(locale, authErrorKey(error.code, error.message)));
        setBusy(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("Échec de signUp :", error);
        setErrorMsg(t(locale, authErrorKey(error.code, error.message)));
        setBusy(false);
        return;
      }

      // Sans confirmation d'e-mail, la session est ouverte immédiatement : on
      // peut écrire le pseudo tout de suite (policy profiles_insert = sa propre
      // ligne). Si l'écriture échoue, on ne bloque pas l'entrée — le pseudo
      // reste modifiable dans /profil.
      if (data.session && data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            { user_id: data.user.id, pseudo: pseudo.trim() },
            { onConflict: "user_id" },
          );
        if (profileError) {
          console.error("Pseudo non enregistré à l'inscription :", profileError);
        }
      }
    }

    // Navigation en dur (et non router.push) : elle force un aller-retour
    // serveur, sans quoi les Server Components ne verraient pas la session
    // fraîchement posée dans les cookies.
    window.location.href = "/leagues";
  }

  const isSignUp = mode === "signup";

  return (
    <AuthCard>
      {/* Onglets */}
      <div
        role="tablist"
        aria-label={t(locale, "login.signInTitle")}
        className="mb-6 flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1"
      >
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === value
                ? "bg-[var(--color-gold)] text-[var(--color-bg)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-cream)]"
            }`}
          >
            {t(locale, value === "signin" ? "login.tabSignIn" : "login.tabSignUp")}
          </button>
        ))}
      </div>

      <h1 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
        {t(locale, isSignUp ? "login.signUpTitle" : "login.signInTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t(locale, isSignUp ? "login.signUpSubtitle" : "login.signInSubtitle")}
      </p>

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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(locale, "login.emailPlaceholder")}
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
          />
        </div>

        {isSignUp && (
          <div>
            <label
              htmlFor="pseudo"
              className="block text-sm font-medium text-[var(--color-cream)]"
            >
              {t(locale, "login.pseudoLabel")}
            </label>
            <input
              id="pseudo"
              name="pseudo"
              type="text"
              required
              maxLength={40}
              autoComplete="nickname"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder={t(locale, "login.pseudoPlaceholder")}
              className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              {t(locale, "login.pseudoHint")}
            </p>
          </div>
        )}

        <PasswordField
          id="password"
          label={t(locale, "login.passwordLabel")}
          value={password}
          onChange={setPassword}
          locale={locale}
          // new-password en inscription : le gestionnaire du navigateur propose
          // alors un mot de passe fort au lieu de recompléter l'ancien.
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={MIN_PASSWORD_LENGTH}
          hint={
            isSignUp
              ? t(locale, "login.passwordHint", { length: MIN_PASSWORD_LENGTH })
              : undefined
          }
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
          {busy
            ? t(locale, isSignUp ? "login.signingUp" : "login.signingIn")
            : t(locale, isSignUp ? "login.signUp" : "login.signIn")}
        </button>
      </form>

      {!isSignUp && (
        <p className="mt-4 text-center">
          <Link
            href="/mot-de-passe-oublie"
            className="text-sm text-[var(--color-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-cream)]"
          >
            {t(locale, "login.forgot")}
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
