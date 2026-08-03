import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";

export default async function RulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 p-6">
      <Link
        href="/accueil"
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
        <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
          🏆 {t(locale, "rules.compTitle")}
        </h2>
        <p className="text-sm text-[var(--color-cream)]/90">
          {t(locale, "rules.compBody")}
        </p>
      </section>

      {/* Ciné'Files */}
      <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
          🔎 {t(locale, "rules.cineTitle")}
        </h2>
        <p className="text-sm text-[var(--color-cream)]/90">
          {t(locale, "rules.cineBody")}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t(locale, "rules.cineFeedback")}
        </p>

        <h3 className="font-display mt-2 text-lg tracking-wide text-[var(--color-cream)]">
          {t(locale, "rules.scoringTitle")}
        </h3>
        <ul className="flex flex-col gap-1 text-sm text-[var(--color-cream)]/90">
          <li>• {t(locale, "rules.scoringGuesser")}</li>
          <li>• {t(locale, "rules.scoringAuthor")}</li>
        </ul>
        <ul className="mt-1 flex flex-col gap-1 rounded-lg border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 px-4 py-3 text-sm text-[var(--color-cream)]">
          <li>{t(locale, "rules.example1")}</li>
          <li>{t(locale, "rules.example15")}</li>
          <li>{t(locale, "rules.exampleNever")}</li>
        </ul>
      </section>
    </main>
  );
}
