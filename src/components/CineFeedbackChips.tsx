import { t, type Locale } from "@/lib/i18n";
import type { CineFeedback } from "@/lib/cinefiles";

type Status = "match" | "partial" | "none";

function statusBg(status: Status): string {
  if (status === "match") return "bg-emerald-500/20";
  if (status === "partial") return "bg-amber-500/20";
  return "bg-[var(--color-surface-alt)]";
}

function Chip({
  status,
  label,
  value,
}: {
  status: Status;
  label: string;
  value: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-cream)] ${statusBg(status)}`}
    >
      <span className="font-mono opacity-70">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

/** Chips de feedback (genre, décennie, année, réalisateur…) pour une tentative.
 * `year` = année du film PROPOSÉ pour cette tentative : quand année/décennie
 * correspondent exactement, on affiche la valeur (identique au mystère). */
export default function CineFeedbackChips({
  feedback: fb,
  locale,
  year,
}: {
  feedback: CineFeedback;
  locale: Locale;
  year?: number | null;
}) {
  const yesNo = (b: boolean): Status => (b ? "match" : "none");
  const dir = (d: CineFeedback["decade"]) =>
    d === "exact" ? "✓" : d === "earlier" ? "↓" : d === "later" ? "↑" : "—";
  const dirStatus = (d: CineFeedback["decade"]): Status =>
    d === "exact" ? "match" : d === "unknown" ? "none" : "partial";

  // Valeur révélée quand c'est exact (sinon flèche / —).
  const yearValue =
    fb.releaseYear === "exact" && year != null ? `${year} ✓` : dir(fb.releaseYear);
  const decadeValue =
    fb.decade === "exact" && year != null
      ? `${t(locale, "cinefiles.decadeValue", { decade: Math.floor(year / 10) * 10 })} ✓`
      : dir(fb.decade);

  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      <Chip
        status={
          fb.genre.result === "exact"
            ? "match"
            : fb.genre.result === "partial"
              ? "partial"
              : "none"
        }
        label={t(locale, "cinefiles.critGenre")}
        value={fb.genre.shared.length ? fb.genre.shared.join(", ") : "—"}
      />
      <Chip
        status={dirStatus(fb.decade)}
        label={t(locale, "cinefiles.critDecade")}
        value={decadeValue}
      />
      <Chip
        status={dirStatus(fb.releaseYear)}
        label={t(locale, "cinefiles.critYear")}
        value={yearValue}
      />
      <Chip
        status={yesNo(fb.director)}
        label={t(locale, "cinefiles.critDirector")}
        value={fb.director ? "✓" : "✗"}
      />
      <Chip
        status={yesNo(fb.country)}
        label={t(locale, "cinefiles.critCountry")}
        value={fb.country ? "✓" : "✗"}
      />
      <Chip
        status={yesNo(fb.language)}
        label={t(locale, "cinefiles.critLanguage")}
        value={fb.language ? "✓" : "✗"}
      />
      <Chip
        status={fb.actors.sharedCount > 0 ? "partial" : "none"}
        label={t(locale, "cinefiles.critActors")}
        value={
          fb.actors.shared.length
            ? fb.actors.shared.join(", ")
            : String(fb.actors.sharedCount)
        }
      />
      <Chip
        status={fb.platforms.sharedCount > 0 ? "partial" : "none"}
        label={t(locale, "cinefiles.critPlatforms")}
        value={
          fb.platforms.shared.length
            ? fb.platforms.shared.join(", ")
            : String(fb.platforms.sharedCount)
        }
      />
    </div>
  );
}
