import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";
import PopBackdrop from "@/components/pop/PopBackdrop";
import ToileGame from "./ToileGame";

/**
 * La Toile — le jeu du jour.
 *
 * Page PUBLIQUE : on peut jouer sans compte. C'est ce qui sépare un jeu qu'on
 * essaie d'un jeu qu'on abandonne à l'inscription. Le compte ne servira qu'à
 * conserver sa série.
 *
 * `toile_du_jour()` ne renvoie jamais la cible — seulement le numéro du jour,
 * le métier et le film d'amorce.
 */
export default async function ToilePage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const locale = await getLocale();
  const { jour } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.rpc("toile_du_jour", {
    ...(jour ? { _jour: jour } : {}),
  });

  const partie = data as {
    jour: string;
    numero: number;
    metier: string | null;
    amorce: { tmdb_id: number; titre: string; annee: string | null };
  } | null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PopBackdrop density="corner" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
        {partie ? (
          <ToileGame locale={locale} partie={partie} />
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-muted)]">
            {t(locale, "toile.aucunePartie")}
          </p>
        )}
      </div>
    </main>
  );
}
