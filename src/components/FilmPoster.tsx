import Image from "next/image";

/**
 * Miniature d'affiche de film (TMDB). Ratio 2:3. Si aucune affiche n'est
 * disponible, affiche un placeholder aux mêmes dimensions.
 * `posterPath` est le chemin brut TMDB (ex. « /abc.jpg »), pas l'URL complète.
 */
export default function FilmPoster({
  posterPath,
  alt,
  width = 64,
  tmdbSize = "w200",
}: {
  posterPath: string | null;
  alt: string;
  width?: number;
  // Format TMDB source (léger = w45 / w92 pour les miniatures).
  tmdbSize?: "w45" | "w92" | "w200";
}) {
  const height = Math.round(width * 1.5);

  if (!posterPath) {
    return (
      <div
        style={{ width, height }}
        className="flex-shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)]"
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={`https://image.tmdb.org/t/p/${tmdbSize}${posterPath}`}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className="flex-shrink-0 rounded-md object-cover"
    />
  );
}
