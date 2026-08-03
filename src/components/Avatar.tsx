// Palette d'avatars : teintes moyennes lisibles avec du texte blanc, dans deux
// thèmes. Couleur choisie de façon déterministe à partir du nom.
const AVATAR_COLORS = [
  "#B85C6B",
  "#3E7CA3",
  "#4E7A6D",
  "#8A6D3B",
  "#6B5B95",
  "#A0522D",
  "#5F8A8B",
  "#9A6A4F",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Rond coloré avec l'initiale du nom. Couleur dérivée du nom (stable).
 * Composant de présentation pur (aucune interactivité) — serveur ou client.
 */
export default function Avatar({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  const trimmed = name.trim();
  const initial = (trimmed[0] ?? "?").toUpperCase();
  const color = AVATAR_COLORS[hash(trimmed || "?") % AVATAR_COLORS.length];

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: Math.round(size * 0.45),
      }}
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold leading-none text-white"
    >
      {initial}
    </span>
  );
}
