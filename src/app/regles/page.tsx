import Link from "next/link";
import { Trophy, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";
import PopBackdrop from "@/components/pop/PopBackdrop";

/**
 * Règles du jeu — page PUBLIQUE.
 *
 * Elle exigeait une session, ce qui la rendait inaccessible depuis la page de
 * garde : un visiteur qui voulait comprendre le jeu avant de s'inscrire était
 * renvoyé vers la connexion. Elle ne lit aucune donnée, il n'y avait donc rien
 * à protéger. Seul le lien de retour dépend de la session.
 */
export default async function RulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = await getLocale();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PopBackdrop density="light" />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
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

      {/* Compétition officielle */}
      <section className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-wide text-[var(--color-cream)]">
          <Trophy size={20} strokeWidth={1.8} />
          {t(locale, "rules.compTitle")}
        </h2>
        <p className="text-sm text-[var(--color-cream)]/90">
          {t(locale, "rules.compBody")}
        </p>
      </section>

      {/* Ciné'Files */}
      <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display flex items-center gap-2 text-2xl tracking-wide text-[var(--color-cream)]">
          <Search size={20} strokeWidth={1.8} />
          {t(locale, "rules.cineTitle")}
        </h2>
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
      </section>
      </div>
    </main>
  );
}
