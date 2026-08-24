import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";
import PopBackdrop from "@/components/pop/PopBackdrop";
import {
  PopClap,
  PopReel,
  PopTicket,
  PopTrophy,
} from "@/components/pop/PopShapes";

/**
 * Règles du jeu — page PUBLIQUE.
 *
 * Elle exigeait une session, ce qui la rendait inaccessible depuis la page de
 * garde : un visiteur qui voulait comprendre le jeu avant de s'inscrire était
 * renvoyé vers la connexion. Elle ne lit aucune donnée, il n'y avait donc rien
 * à protéger. Seul le lien de retour dépend de la session.
 *
 * Structure : « Comment ça marche » (les trois temps d'une séance, en survol)
 * puis « Deux façons de jouer » (le détail de chaque mode). Le survol vient
 * d'abord parce qu'un nouveau venu a besoin de la boucle du jeu avant le
 * barème.
 */
export default async function RulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = await getLocale();

  // Une forme par étape, choisie pour illustrer l'étape et non pour décorer :
  // la claquette ouvre le tournage, la bobine porte les films, le trophée
  // couronne la cérémonie.
  const steps = [
    {
      title: t(locale, "landing.step1Title"),
      text: t(locale, "landing.step1Text"),
      shape: <PopClap size={48} fill="var(--color-gold-bright)" />,
    },
    {
      title: t(locale, "landing.step2Title"),
      text: t(locale, "landing.step2Text"),
      shape: <PopReel size={48} fill="var(--color-coral)" />,
    },
    {
      title: t(locale, "landing.step3Title"),
      text: t(locale, "landing.step3Text"),
      shape: <PopTrophy size={48} fill="var(--color-yellow)" />,
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PopBackdrop density="light" />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-10 p-6">
        <Link
          href={user ? "/leagues" : "/"}
          className="text-sm text-[var(--color-gold)] underline-offset-4 hover:underline"
        >
          {t(locale, "rules.back")}
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl tracking-wide text-[var(--color-gold)]">
            {t(locale, "rules.title")}
          </h1>
          <p className="text-[var(--color-muted)]">{t(locale, "rules.intro")}</p>
        </div>

        {/* --- Comment ça marche : les trois temps d'une séance --- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "landing.howTitle")}
          </h2>
          <ol className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex shrink-0 flex-col items-center gap-1">
                  {step.shape}
                  <span className="font-display text-sm text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-wide text-[var(--color-cream)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Le détail des deux modes --- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "landing.modesTitle")}
          </h2>

          {/* Compétition officielle */}
          <article className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] p-6">
            <PopTicket size={84} fill="var(--color-gold-bright)" />
            <h3 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
              {t(locale, "rules.compTitle")}
            </h3>
            <p className="text-sm text-[var(--color-cream)]/90">
              {t(locale, "rules.compBody")}
            </p>
          </article>

          {/* Ciné'Files */}
          <article className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] p-6">
            <PopTicket size={84} fill="var(--color-sage)" />
            <h3 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
              {t(locale, "rules.cineTitle")}
            </h3>
            <p className="text-sm text-[var(--color-cream)]/90">
              {t(locale, "rules.cineIntro")}
            </p>
            <p className="text-sm text-[var(--color-cream)]/90">
              {t(locale, "rules.cineBody")}
            </p>
            <p className="text-sm text-[var(--color-cream)]/90">
              {t(locale, "rules.cineBonus")}
            </p>
            <p className="mt-1 text-sm text-[var(--color-cream)]/90">
              {t(locale, "rules.scoringMain")}
            </p>
            <ul className="mt-1 flex flex-col gap-1 rounded-lg border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 px-4 py-3 text-sm text-[var(--color-cream)]">
              <li>{t(locale, "rules.example15")}</li>
              <li>{t(locale, "rules.exampleNever")}</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
