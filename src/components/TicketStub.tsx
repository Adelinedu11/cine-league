/**
 * Carte « ticket perforé » : partie principale à gauche, languette latérale à
 * droite (séparée par une ligne pointillée + encoches) avec un texte centré.
 * Composant de présentation réutilisable (aucune interactivité).
 * `stubClassName` permet de colorer le texte de la languette selon le contexte.
 */
export default function TicketStub({
  children,
  stub,
  stubClassName = "text-[var(--color-gold)]",
}: {
  children: React.ReactNode;
  stub: React.ReactNode;
  stubClassName?: string;
}) {
  return (
    <div className="relative flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="w-1/2 p-5">{children}</div>
      {/* Split 50-50 : les deux parties occupent chacune la moitié de la carte,
          pour une taille uniforme d'un ticket à l'autre. Les retours à la ligne
          n'ont lieu qu'aux espaces (pas de coupure en plein mot). */}
      <div className="relative flex w-1/2 items-center justify-center border-l border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4">
        {/* Encoches perforées haut/bas */}
        <div className="absolute -top-2.5 left-0 h-5 w-5 -translate-x-1/2 rounded-full bg-[var(--color-bg)]" />
        <div className="absolute -bottom-2.5 left-0 h-5 w-5 -translate-x-1/2 rounded-full bg-[var(--color-bg)]" />
        <span
          className={`font-display block w-full break-normal text-center text-xs tracking-[0.2em] ${stubClassName}`}
        >
          {stub}
        </span>
      </div>
    </div>
  );
}
