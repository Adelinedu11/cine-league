"use client";

import SubmitButton from "@/components/SubmitButton";
import type { Locale } from "@/lib/i18n";

/**
 * Bouton de soumission d'une Server Action, précédé d'une confirmation native.
 * Sert aux actions destructrices (supprimer un round, exclure un membre,
 * supprimer une ligue). Le bouton interne (SubmitButton) affiche l'état de
 * chargement une fois la confirmation acceptée.
 */
export default function ConfirmSubmitButton({
  action,
  confirmMessage,
  children,
  className,
  locale,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
  locale: Locale;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton locale={locale} className={className}>
        {children}
      </SubmitButton>
    </form>
  );
}
