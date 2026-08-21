"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

/**
 * Champ mot de passe avec bascule afficher/masquer. Sur mobile, saisir un mot
 * de passe long en aveugle est la première cause d'abandon : le bouton œil
 * n'est pas un gadget.
 */
export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  locale,
  autoComplete,
  hint,
  minLength,
  autoFocus,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  autoComplete: string;
  hint?: string;
  minLength?: number;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--color-cream)]"
      >
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name ?? id}
          type={visible ? "text" : "password"}
          required
          autoFocus={autoFocus}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t(locale, "login.passwordPlaceholder")}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 pr-11 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={t(
            locale,
            visible ? "login.hidePassword" : "login.showPassword",
          )}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-cream)]"
        >
          {visible ? (
            <EyeOff size={16} strokeWidth={1.6} />
          ) : (
            <Eye size={16} strokeWidth={1.6} />
          )}
        </button>
      </div>
      {hint && (
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}
