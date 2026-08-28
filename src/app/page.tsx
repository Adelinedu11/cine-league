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
import StatutDuJour from "@/components/toile/StatutDuJour";

/**
 * Page d'accueil, pour TOUT LE MONDE.
 *
 * Elle a d'abord redirigé les personnes connectées vers /toile, au motif
 * qu'elles venaient pour le jeu. C'était une erreur : la page d'accueil
 * devenait inaccessible dès qu'on avait un compte, sans aucun moyen d'y
 * revenir. Et l'argument est tombé avec sa réorganisation — depuis qu'elle mène
 * avec La Toile et porte les ligues en dessous, elle sert aussi bien de hub aux
 * membres que de vitrine aux visiteurs.
 *
 * Elle n'interroge la base que pour savoir si quelqu'un est connecté, afin
 * d'adapter ses boutons. Aucune donnée de league n'y est lue, donc aucune
 * policy RLS à ouvrir en anonyme.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = await getLocale();

  // Y a-t-il une partie aujourd'hui ? On ne récupère que sa date : le statut du
  // joueur, lui, vit dans son navigateur et n'a pas à remonter jusqu'ici.
  const { data: duJour } = await supabase.rpc("toile_du_jour", {});
  const partie = duJour as { jour: string } | null;

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

          {/* L'action principale est de JOUER, pas de s'inscrire. La Toile ne
              demande pas de compte : mettre l'inscription en premier
              reviendrait à poser une barrière devant la seule chose qu'on peut
              essayer en trente secondes. */}
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/toile"
              className="font-display rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-gold)] px-6 py-3 text-xl tracking-wide text-[var(--color-bg)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {t(locale, "landing.ctaJouer")}
            </Link>
            {/* Le bouton secondaire dépend de qui regarde : se connecter pour
                un visiteur, aller à ses ligues pour un membre. Proposer une
                connexion à quelqu'un de déjà connecté n'a aucun sens. */}
            <Link
              href={user ? "/leagues" : "/login"}
              className="rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2.5 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-cream)]"
            >
              {t(locale, user ? "landing.ctaMesLigues" : "landing.ctaSignIn")}
            </Link>
          </div>

          {!user && (
            <p className="mt-4 max-w-xs text-xs text-[var(--color-muted)]">
              {t(locale, "landing.ctaNote")}
            </p>
          )}
        </section>

        {/* --- La Toile, juste après le héros : c'est le geste quotidien et la
                seule chose jouable sans compte ni ami. --- */}
        <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-gold-bright)]/25 p-6">
          <div className="relative z-10 max-w-md">
            <PopReel size={64} fill="var(--color-gold-bright)" />
            {/* Le statut n'apparaît que s'il y a une partie programmée ce
                jour-là : annoncer « pas encore joué » un jour sans partie
                enverrait le joueur sur un écran vide. */}
            {partie && (
              <div className="mt-3">
                <StatutDuJour locale={locale} jour={partie.jour} />
              </div>
            )}
            <h2 className="font-display mt-3 text-3xl tracking-wide text-[var(--color-cream)]">
              {t(locale, "landing.toileTitle")}
            </h2>
            <p className="mt-2 text-[var(--color-cream)]/90">
              {t(locale, "landing.toileText")}
            </p>
            <Link
              href="/toile"
              className="font-display mt-5 inline-block rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] px-5 py-2.5 tracking-wide text-[var(--color-cream)] transition-transform hover:-translate-y-0.5"
            >
              {t(locale, "landing.toileCta")}
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 -right-3 hidden rotate-12 sm:block"
          >
            <PopPopcorn size={116} />
          </div>
        </section>

        {/* --- Bascule vers l'autre moitié du produit --- */}
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl tracking-wide text-[var(--color-gold)]">
            {t(locale, "landing.leaguesTitle")}
          </h2>
          <p className="text-[var(--color-muted)]">
            {t(locale, "landing.leaguesText")}
          </p>
        </div>

        {/* --- Comment marche une séance --- */}
        <section className="flex flex-col gap-5">
          <h3 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "landing.howTitle")}
          </h3>
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

        {/* --- Les deux modes de séance --- */}
        <section className="flex flex-col gap-5">
          <h3 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "landing.modesTitle")}
          </h3>
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

        {/* --- Créer un compte : demandé ICI, et pas avant. Une inscription se
                justifie quand on veut jouer avec des gens ; pour La Toile elle
                n'a aucun sens. Pour un membre, le même bloc devient l'accès à
                ses ligues. --- */}
        <section className="rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-yellow)]/30 p-6 text-center">
          <h3 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, user ? "landing.membreTitle" : "landing.compteTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-cream)]/85">
            {t(locale, user ? "landing.membreText" : "landing.compteText")}
          </p>
          <Link
            href={user ? "/leagues" : "/login?mode=signup"}
            className="font-display mt-5 inline-block rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-gold)] px-6 py-3 text-lg tracking-wide text-[var(--color-bg)] transition-transform hover:-translate-y-0.5"
          >
            {t(locale, user ? "landing.ctaMesLigues" : "landing.ctaSignUp")}
          </Link>
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
