"use client";

import { useMemo } from "react";
import { t, type Locale } from "@/lib/i18n";
import { formatRoundDateWithHour, type DurationPreset } from "@/lib/rounds";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]";
const labelClass = "text-sm font-medium text-[var(--color-cream)]";

/**
 * Sélecteur de durée ("tic-tac-boom") pour la création d'un round : au lieu
 * d'une date précise, on choisit une durée depuis l'instant de lancement (ou
 * depuis l'échéance d'un champ précédent via `baseIsoMs`), avec un aperçu
 * live de l'heure d'échéance résultante.
 */
export default function DurationSelect({
  name,
  label,
  presets,
  locale,
  value,
  onChange,
  baseIsoMs,
}: {
  name: string;
  label: string;
  presets: DurationPreset[];
  locale: Locale;
  value: number;
  onChange: (minutes: number) => void;
  /** 0 tant que l'instant de référence (Date.now() calculé par le parent
   * dans un effet) n'est pas encore connu — on masque alors l'aperçu plutôt
   * que d'afficher une date fausse. */
  baseIsoMs: number;
}) {
  // Dérivé de props déjà stables (baseIsoMs vient d'un effet du parent) :
  // useMemo suffit, pas besoin d'un state + effet ici.
  const preview = useMemo(
    () =>
      baseIsoMs > 0
        ? formatRoundDateWithHour(
            new Date(baseIsoMs + value * 60_000).toISOString(),
            locale,
          )
        : null,
    [value, baseIsoMs, locale],
  );

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      >
        {presets.map((p) => (
          <option key={p.minutes} value={p.minutes}>
            {p.label[locale]}
          </option>
        ))}
      </select>
      {preview && (
        <p className="text-xs text-[var(--color-muted)]">
          {t(locale, "league.durationPreview", { date: preview })}
        </p>
      )}
    </div>
  );
}
