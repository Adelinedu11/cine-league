/**
 * Bibliothèque de formes « pop & naïf », vocabulaire cinéma.
 *
 * Trois partis pris tirés des planches de référence (DearMonday,
 * back-to-school) :
 *   1. objets simplifiés à l'extrême, jamais réalistes ;
 *   2. contour noir épais et uniforme, comme tracé au feutre ;
 *   3. de petits yeux, qui suffisent à donner vie à n'importe quel objet.
 *
 * Tout est en SVG inline, jamais en image bitmap. Trois raisons : le poids
 * reste négligeable, les couleurs suivent les variables CSS (donc le thème
 * clair ET sombre sans double jeu d'assets), et une forme reste modifiable.
 *
 * Ces formes sont décoratives : elles portent toutes aria-hidden. Un lecteur
 * d'écran n'a rien à annoncer d'un pot de pop-corn qui sourit.
 *
 * Note technique : aucun `clipPath` ni `<defs>` avec identifiant. Une même
 * forme peut apparaître plusieurs fois sur une page, et des identifiants
 * dupliqués dans le DOM produisent des rendus imprévisibles.
 */

type PopProps = {
  /** Couleur de remplissage. Passe une variable CSS, ex. "var(--color-coral)". */
  fill?: string;
  /** Côté du carré de rendu, en pixels. */
  size?: number;
  className?: string;
};

const OUTLINE = "#1c1c22";
const PAPER = "#ffffff";

/** Pot de pop-corn rayé, débordant de grains. */
export function PopPopcorn({
  fill = "var(--color-coral)",
  size = 80,
  className,
}: PopProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {/* Grains, dessinés avant le pot pour passer derrière son bord. */}
      <g fill={PAPER} stroke={OUTLINE} strokeWidth="2.5">
        <circle cx="30" cy="38" r="10" />
        <circle cx="49" cy="29" r="12" />
        <circle cx="67" cy="37" r="10" />
        <circle cx="39" cy="24" r="8" />
        <circle cx="60" cy="20" r="8" />
      </g>
      {/* Pot : fond blanc, deux bandes colorées, contour par-dessus. */}
      <path d="M27 44h46l-6 48H33Z" fill={PAPER} />
      <path d="M27 44h11.5l-4.5 48h-1Z" fill={fill} />
      <path d="M50 44h11.5l-2.5 48h-9Z" fill={fill} />
      <path d="M27 44h46l-6 48H33Z" fill="none" stroke={OUTLINE} strokeWidth="2.5" />
    </svg>
  );
}

/** Claquette de tournage, bras relevé. */
export function PopClap({
  fill = "var(--color-gold-bright)",
  size = 80,
  className,
}: PopProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {/* Ardoise */}
      <rect x="10" y="50" width="80" height="40" rx="5" fill={fill} stroke={OUTLINE} strokeWidth="2.5" />
      <line x1="20" y1="66" x2="60" y2="66" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="78" x2="46" y2="78" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
      {/* Bras claquant, légèrement relevé */}
      <g transform="rotate(-9 50 40)">
        <rect x="10" y="28" width="80" height="17" rx="4" fill={PAPER} stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M22 28h11l-7 17H15Z" fill={OUTLINE} />
        <path d="M44 28h11l-7 17H37Z" fill={OUTLINE} />
        <path d="M66 28h11l-7 17H59Z" fill={OUTLINE} />
      </g>
    </svg>
  );
}

/** Bobine de film. */
export function PopReel({
  fill = "var(--color-gold)",
  size = 80,
  className,
}: PopProps) {
  const holes = [
    [50, 26],
    [72.8, 42.6],
    [64.1, 69.4],
    [35.9, 69.4],
    [27.2, 42.6],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle cx="50" cy="50" r="41" fill={fill} stroke={OUTLINE} strokeWidth="2.5" />
      <g fill="var(--color-bg)" stroke={OUTLINE} strokeWidth="2.5">
        {holes.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="10" />
        ))}
        <circle cx="50" cy="50" r="8" />
      </g>
    </svg>
  );
}

/** Pellicule : deux photogrammes et leurs perforations. */
export function PopFilmStrip({
  fill = "var(--color-cream)",
  size = 96,
  className,
}: PopProps) {
  const perfs = [16, 30, 44, 58, 72];
  return (
    <svg
      width={size}
      height={size * 0.55}
      viewBox="0 0 100 56"
      aria-hidden="true"
      className={className}
    >
      <rect x="6" y="4" width="88" height="48" rx="4" fill={fill} stroke={OUTLINE} strokeWidth="2.5" />
      <g fill="var(--color-bg)">
        {perfs.map((x) => (
          <rect key={`t${x}`} x={x} y="9" width="9" height="7" rx="1.5" />
        ))}
        {perfs.map((x) => (
          <rect key={`b${x}`} x={x} y="40" width="9" height="7" rx="1.5" />
        ))}
        <rect x="14" y="21" width="32" height="14" rx="2" />
        <rect x="54" y="21" width="32" height="14" rx="2" />
      </g>
    </svg>
  );
}

/** Lunettes 3D anaglyphes — un verre rouge, un verre bleu. */
export function PopGlasses3D({
  size = 88,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 0.55}
      viewBox="0 0 100 56"
      aria-hidden="true"
      className={className}
    >
      <g stroke={OUTLINE} strokeWidth="2.5">
        <rect x="6" y="14" width="36" height="28" rx="9" fill="var(--color-coral)" />
        <rect x="58" y="14" width="36" height="28" rx="9" fill="var(--color-gold-bright)" />
        <path d="M42 24h16v8H42z" fill="var(--color-cream)" />
      </g>
    </svg>
  );
}

/** Fauteuil de salle. */
export function PopSeat({
  fill = "var(--color-coral)",
  size = 80,
  className,
}: PopProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <g fill={fill} stroke={OUTLINE} strokeWidth="2.5">
        <rect x="14" y="50" width="12" height="30" rx="5" />
        <rect x="74" y="50" width="12" height="30" rx="5" />
        <rect x="27" y="16" width="46" height="46" rx="14" />
        <rect x="22" y="58" width="56" height="18" rx="7" />
      </g>
      <line x1="50" y1="24" x2="50" y2="54" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Statuette / trophée du palmarès. */
export function PopTrophy({
  fill = "var(--color-yellow)",
  size = 80,
  className,
}: PopProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <g fill={fill} stroke={OUTLINE} strokeWidth="2.5">
        {/* Anses */}
        <path d="M32 26H20a10 10 0 0 0 12 20" />
        <path d="M68 26h12a10 10 0 0 1-12 20" />
        {/* Coupe */}
        <path d="M30 20h40v18a20 20 0 0 1-40 0Z" />
        {/* Pied */}
        <rect x="45" y="58" width="10" height="16" />
        <rect x="31" y="74" width="38" height="11" rx="3" />
      </g>
    </svg>
  );
}

/** Projecteur, bobine sur le dessus. */
export function PopProjector({
  fill = "var(--color-sage)",
  size = 96,
  className,
}: PopProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 100 76"
      aria-hidden="true"
      className={className}
    >
      <g stroke={OUTLINE} strokeWidth="2.5">
        <circle cx="34" cy="20" r="14" fill={PAPER} />
        <circle cx="34" cy="20" r="4" fill={OUTLINE} stroke="none" />
        <rect x="12" y="32" width="58" height="32" rx="6" fill={fill} />
        <rect x="70" y="40" width="18" height="16" rx="3" fill={PAPER} />
      </g>
    </svg>
  );
}

/** Étoile à quatre branches — le « star system » en une forme. */
export function PopStar({
  fill = "var(--color-yellow)",
  size = 60,
  className,
}: PopProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path
        d="M50 4c4 26 20 42 46 46-26 4-42 20-46 46-4-26-20-42-46-46 26-4 42-20 46-46Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ticket à souche perforée — le motif signature de Ciné League. */
export function PopTicket({
  fill = "var(--color-sage)",
  size = 96,
  className,
}: PopProps) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="10" width="112" height="52" rx="12" fill={fill} stroke={OUTLINE} strokeWidth="2.5" />
      <line x1="82" y1="12" x2="82" y2="60" stroke={OUTLINE} strokeWidth="2" strokeDasharray="5 5" />
      <circle cx="82" cy="10" r="6" fill="var(--color-bg)" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="82" cy="62" r="6" fill="var(--color-bg)" stroke={OUTLINE} strokeWidth="2.5" />
    </svg>
  );
}

/** Ondulation : sert de séparateur ou de rythme dans une composition. */
export function PopSquiggle({
  fill = "var(--color-gold)",
  size = 90,
  className,
}: PopProps) {
  return (
    <svg
      width={size}
      height={size / 3}
      viewBox="0 0 120 40"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4 26c14-24 28 24 42 0s28-24 42 0 24 8 28 0"
        fill="none"
        stroke={fill}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Paire d'yeux à poser sur n'importe quelle forme. Le regard est légèrement
 * décentré : parfaitement centré, il fait robot ; décalé, il fait vivant.
 */
export function PopEyes({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size / 2}
      viewBox="0 0 60 30"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="16" cy="15" rx="9" ry="11" fill={PAPER} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="44" cy="15" rx="9" ry="11" fill={PAPER} stroke={OUTLINE} strokeWidth="2" />
      <circle cx="18" cy="17" r="4" fill={OUTLINE} />
      <circle cx="46" cy="17" r="4" fill={OUTLINE} />
    </svg>
  );
}

/** Sourire simple, à associer à PopEyes. */
export function PopSmile({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size / 2}
      viewBox="0 0 60 30"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 6c6 16 38 16 44 0"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
