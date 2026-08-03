"use client";

import { useState, type ReactNode } from "react";

/**
 * Onglets simples pour la page de ligue. Le contenu de chaque onglet est
 * rendu côté serveur puis passé en `content` : on garde tous les onglets montés
 * (masqués via `hidden`) pour que les formulaires / Server Actions continuent
 * de fonctionner sans remontage.
 */
export default function LeagueTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-current={active === tab.id}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-[var(--color-gold)] text-[var(--color-gold)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-cream)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          hidden={active !== tab.id}
          className="flex flex-col gap-8"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
