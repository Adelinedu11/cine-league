"use client";

/**
 * Bouton de soumission d'une Server Action, précédé d'une confirmation native.
 * Sert aux actions destructrices (supprimer un round, exclure un membre).
 * `action` est une Server Action sans argument ; `confirmMessage` est le texte
 * du dialogue de confirmation.
 */
export default function ConfirmSubmitButton({
  action,
  confirmMessage,
  children,
  className,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
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
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
