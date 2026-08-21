import {
  PopClap,
  PopFilmStrip,
  PopGlasses3D,
  PopPopcorn,
  PopReel,
  PopSeat,
  PopStar,
  PopTrophy,
} from "./PopShapes";

/**
 * Semis de formes pop en fond de page.
 *
 * Positions écrites à la main plutôt que tirées au hasard : une composition
 * aléatoire produit presque toujours des amas et des vides. Chaque forme est
 * placée pour éviter la colonne centrale, où vit le texte.
 *
 * `pointer-events-none` est indispensable : sans lui, ces décorations
 * intercepteraient les clics sur les boutons qu'elles chevauchent.
 * `overflow-hidden` sur le parent empêche les formes de créer du défilement
 * horizontal sur mobile.
 */

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

const ITEMS: Item[] = [
  { top: "3%", left: "5%", rotate: -12, node: <PopPopcorn size={66} /> },
  { top: "9%", right: "7%", rotate: 14, node: <PopStar size={44} /> },
  { top: "26%", right: "3%", rotate: -8, desktopOnly: true, node: <PopReel size={70} /> },
  { top: "40%", left: "2%", rotate: 10, desktopOnly: true, node: <PopClap size={76} /> },
  { top: "56%", right: "5%", rotate: -14, node: <PopGlasses3D size={80} /> },
  { top: "70%", left: "6%", rotate: 8, desktopOnly: true, node: <PopSeat size={66} /> },
  { top: "82%", right: "8%", rotate: 12, node: <PopTrophy size={58} /> },
  { top: "93%", left: "8%", rotate: -6, desktopOnly: true, node: <PopFilmStrip size={88} /> },
];

export default function PopScatter() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {ITEMS.map((item, i) => (
        <div
          key={i}
          className={`absolute opacity-80 ${item.desktopOnly ? "hidden md:block" : ""}`}
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
