import {
  PopClap,
  PopFilmStrip,
  PopGlasses3D,
  PopPopcorn,
  PopProjector,
  PopReel,
  PopSeat,
  PopStar,
  PopTicket,
  PopTrophy,
} from "./PopShapes";

/**
 * Fond décoratif, en trois densités.
 *
 * Pourquoi trois et pas une seule. Les écrans de Ciné League ne se ressemblent
 * pas : une page de règles est un long texte qu'on parcourt, un bulletin de
 * vote est une grille de décisions. Poser le même semis sur les deux abîme le
 * second. La densité se choisit donc page par page :
 *
 *   "full"   → pages calmes et courtes (connexion, profil)
 *   "light"  → pages à contenu lisible (règles, liste des leagues)
 *   "corner" → pages denses (séance, vote, scores) : deux formes en coin,
 *              assez loin du contenu pour ne jamais gêner la lecture
 *
 * `pointer-events-none` est indispensable : sans lui, ces décorations
 * intercepteraient les clics sur les éléments qu'elles chevauchent.
 * `overflow-hidden` empêche les formes de créer du défilement horizontal.
 */

type Density = "full" | "light" | "corner";

type Item = {
  /** Coordonnées en pourcentage du conteneur. */
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  /** Masquée sous md : sur mobile la place manque, mieux vaut respirer. */
  desktopOnly?: boolean;
  node: React.ReactNode;
};

const FULL: Item[] = [
  { top: "4%", left: "4%", rotate: -12, node: <PopPopcorn size={64} /> },
  { top: "10%", right: "6%", rotate: 14, node: <PopStar size={42} /> },
  { top: "30%", right: "3%", rotate: -8, desktopOnly: true, node: <PopReel size={66} /> },
  { top: "46%", left: "2%", rotate: 10, desktopOnly: true, node: <PopClap size={72} /> },
  { top: "64%", right: "5%", rotate: -14, node: <PopGlasses3D size={76} /> },
  { top: "80%", left: "5%", rotate: 8, desktopOnly: true, node: <PopSeat size={62} /> },
  { top: "90%", right: "7%", rotate: 12, node: <PopTrophy size={54} /> },
];

const LIGHT: Item[] = [
  { top: "6%", right: "3%", rotate: 12, node: <PopStar size={40} /> },
  { top: "34%", left: "1%", rotate: -10, desktopOnly: true, node: <PopReel size={58} /> },
  { top: "62%", right: "2%", rotate: -14, desktopOnly: true, node: <PopFilmStrip size={76} /> },
  { top: "86%", left: "3%", rotate: 8, node: <PopTicket size={62} /> },
];

// Deux formes seulement, collées aux bords : sur une page dense, tout ce qui
// s'approche de la colonne de texte devient du bruit.
const CORNER: Item[] = [
  { top: "1%", right: "1%", rotate: 14, desktopOnly: true, node: <PopProjector size={70} /> },
  { top: "92%", left: "1%", rotate: -8, desktopOnly: true, node: <PopStar size={38} /> },
];

const SETS: Record<Density, Item[]> = {
  full: FULL,
  light: LIGHT,
  corner: CORNER,
};

export default function PopBackdrop({
  density = "light",
}: {
  density?: Density;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SETS[density].map((item, i) => (
        <div
          key={i}
          className={`absolute ${density === "corner" ? "opacity-50" : "opacity-75"} ${
            item.desktopOnly ? "hidden md:block" : ""
          }`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            transform: `rotate(${item.rotate}deg)`,
          }}
        >
          {item.node}
        </div>
      ))}
    </div>
  );
}
