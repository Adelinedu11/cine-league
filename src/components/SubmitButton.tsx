"use client";

import { useFormStatus } from "react-dom";
import { t, type Locale } from "@/lib/i18n";

/**
 * Bouton de soumission avec état de chargement automatique via useFormStatus :
 * doit être rendu À L'INTÉRIEUR d'un <form> piloté par une action (Server Action
 * ou fonction). Pendant l'envoi : désactivé, opacité réduite, spinner + « Envoi… ».
 * `disabled` permet d'ajouter une condition de désactivation propre au champ.
 */
export default function SubmitButton({
  children,
  locale,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  locale: Locale;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          {t(locale, "common.sending")}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
