import { Ticket } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Coquille commune aux écrans d'authentification (connexion, mot de passe
 * oublié, nouveau mot de passe) : logo, carte centrée, largeur unique.
 * L'habillage pop de l'étape 4 se posera ici, en un seul endroit.
 */
export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Ticket
            size={20}
            strokeWidth={1.5}
            className="text-[var(--color-gold)]"
          />
          <span className="font-display text-2xl tracking-wide text-[var(--color-gold)]">
            Ciné League
          </span>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
