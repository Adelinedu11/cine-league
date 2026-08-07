"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/rounds";
import { t, type Locale } from "@/lib/i18n";

/**
 * Compte à rebours live jusqu'à `targetIso`, recalculé chaque seconde.
 * Remplace la seule comparaison de date fixe par un affichage lisible côté
 * client (voir backlog point 13 — système de durée).
 */
export default function RoundCountdown({
  targetIso,
  locale,
}: {
  targetIso: string;
  locale: Locale;
}) {
  // `null` tant que le premier calcul (useEffect) n'a pas tourné, pour ne
  // jamais rendre une valeur dérivée de Date.now() côté serveur.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (remaining === null) return null;

  return (
    <p className="font-mono text-xs text-[var(--color-gold)]">
      ⏳{" "}
      {remaining > 0
        ? `${t(locale, "round.countdownPrefix")} ${formatCountdown(remaining, locale)}`
        : t(locale, "round.countdownEnded")}
    </p>
  );
}
