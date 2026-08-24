import type { ReactNode } from "react";
import { PopEyes } from "./PopShapes";

/**
 * État vide illustré.
 *
 * Un écran vide est le moment où l'on décroche : la personne arrive, ne voit
 * rien, et repart. Une ligne de texte gris ne dit ni pourquoi c'est vide ni
 * quoi faire ensuite. Ce composant impose les trois : une forme, une phrase,
 * et — quand il y a quelque chose à faire — une action.
 *
 * Les yeux sont posés sous la forme : ils transforment une illustration en
 * personnage qui attend, ce qui rend l'attente moins sèche.
 */
export default function PopEmptyState({
  shape,
  title,
  text,
  action,
}: {
  shape: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-border)] px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-2">
        {shape}
        <PopEyes size={38} />
      </div>
      <h3 className="font-display text-xl tracking-wide text-[var(--color-cream)]">
        {title}
      </h3>
      {text && (
        <p className="max-w-xs text-sm text-[var(--color-muted)]">{text}</p>
      )}
      {action}
    </div>
  );
}
