import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";
import PopScatter from "@/components/pop/PopScatter";
import {
  PopClap,
  PopEyes,
  PopPopcorn,
  PopReel,
  PopSmile,
  PopStar,
  PopTicket,
  PopTrophy,
} from "@/components/pop/PopShapes";

/**
 * Page de garde publique. Premier écran d'un visiteur sans compte : elle doit
 * expliquer le jeu et donner envie, sans jamais interroger la base — aucune
 * donnée de league n'y est lue, donc aucune policy RLS à ouvrir en anonyme.
 *
 * Un visiteur déjà connecté n'a rien à faire ici : on l'envoie sur /leagues.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/leagues");
  }

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
    <main className="relative overflow-hidden">
      <PopScatter />

      {/* z-10 : le contenu passe devant le semis décoratif. */}
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-16 px-6 py-16">
        {/* --- Héros --- */}
        <section className="flex flex-col items-center text-center">
          <span className="font-mono rounded-full border-2 border-[var(--color-cream)] bg-[var(--color-surface)] px-3 py-1 text-[11px] tracking-wider text-[var(--color-cream)]">
            {t(locale, "landing.tagline")}
          </span>

          {/* Titre + visage : les yeux et le sourire posés sur le mot suffisent
              à donner le ton, sans illustration supplémentaire. */}
          <h1 className="font-display mt-6 text-6xl leading-[0.9] tracking-wide text-[var(--color-gold)] sm:text-7xl">
            Ciné
            <br />
            League
          </h1>
          {/* Le sourire est descendu (gap-5) : collé aux yeux il écrasait le
              visage. Pour le retirer complètement, supprimer la ligne PopSmile. */}
          <div className="mt-3 flex flex-col items-center gap-5">
            <PopEyes size={54} />
            <PopSmile size={38} />
          </div>

          <p className="mt-6 max-w-md text-balance text-[var(--color-cream)]">
            {t(locale, "landing.pitch")}
          </p>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/login?mode=signup"
              className="font-display rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-gold)] px-6 py-3 text-xl tracking-wide text-[var(--color-bg)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {t(locale, "landing.ctaSignUp")}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2.5 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-cream)]"
            >
              {t(locale, "landing.ctaSignIn")}
            </Link>
          </div>

          <p className="mt-4 max-w-xs text-xs text-[var(--color-muted)]">
            {t(locale, "landing.ctaNote")}
          </p>
        </section>

        {/* --- Comment ça marche --- */}
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

        {/* --- Les deux modes --- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-3xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "landing.modesTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-gold-bright)]/25 p-5">
              <PopTicket size={80} fill="var(--color-gold-bright)" />
              <h3 className="font-display mt-3 text-xl tracking-wide text-[var(--color-cream)]">
                {t(locale, "landing.mode1Title")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-cream)]/80">
                {t(locale, "landing.mode1Text")}
              </p>
            </article>
            <article className="rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-sage)]/25 p-5">
              <PopTicket size={80} fill="var(--color-sage)" />
              <h3 className="font-display mt-3 text-xl tracking-wide text-[var(--color-cream)]">
                {t(locale, "landing.mode2Title")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-cream)]/80">
                {t(locale, "landing.mode2Text")}
              </p>
            </article>
          </div>
        </section>

        {/* --- League publique --- */}
        <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-yellow)]/30 p-6">
          <div className="relative z-10 max-w-md">
            <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
              {t(locale, "landing.publicTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-cream)]/85">
              {t(locale, "landing.publicText")}
            </p>
            <Link
              href="/login?mode=signup"
              className="font-display mt-5 inline-block rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] px-5 py-2.5 tracking-wide text-[var(--color-cream)] transition-transform hover:-translate-y-0.5"
            >
              {t(locale, "landing.ctaSignUp")}
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 -right-3 hidden rotate-12 sm:block"
          >
            <PopPopcorn size={116} />
          </div>
        </section>

        <footer className="flex flex-col items-center gap-3 pt-4 text-center">
          <PopStar size={30} fill="var(--color-gold)" />
          <p className="text-xs text-[var(--color-muted)]">
            {t(locale, "landing.footer")}
          </p>
          <Link
            href="/regles"
            className="text-xs text-[var(--color-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-cream)]"
          >
            {t(locale, "rules.title")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
