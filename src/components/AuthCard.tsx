import Link from "next/link";
import type { ReactNode } from "react";
import PopBackdrop from "@/components/pop/PopBackdrop";
import { PopTicket } from "@/components/pop/PopShapes";

/**
 * Coquille commune aux écrans d'authentification (connexion, mot de passe
 * oublié, nouveau mot de passe) : fond pop, logo, carte centrée, largeur
 * unique. L'habillage est posé ici une seule fois pour les trois pages.
 *
 * Le logo renvoie à la page de garde : depuis la connexion, c'est le seul
 * chemin de retour vers l'explication du jeu pour qui n'a pas encore de compte.
 */
export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <PopBackdrop density="full" />

      {/* z-10 : le formulaire passe devant le décor. */}
      <div className="relative z-10 w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5"
        >
          <PopTicket size={62} fill="var(--color-gold-bright)" />
          <span className="font-display text-2xl tracking-wide text-[var(--color-gold)]">
            Ciné League
          </span>
        </Link>
        <div className="rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
