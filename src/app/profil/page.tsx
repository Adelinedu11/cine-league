import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";
import SubmitButton from "@/components/SubmitButton";
import Avatar from "@/components/Avatar";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const { saved } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("pseudo")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentName = profile?.pseudo?.trim() || user.email || "?";

  // --- Server Action : enregistrer le pseudo global ---
  async function updatePseudo(formData: FormData) {
    "use server";
    const pseudo = String(formData.get("pseudo") ?? "").trim();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        pseudo: pseudo || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    redirect("/profil?saved=1");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <Link
        href="/accueil"
        className="text-sm text-[var(--color-gold)] underline-offset-4 hover:underline"
      >
        {t(locale, "profile.back")}
      </Link>

      <div className="flex items-center gap-3">
        <Avatar name={currentName} size={44} />
        <h1 className="font-display text-4xl tracking-wide text-[var(--color-gold)]">
          {t(locale, "profile.title")}
        </h1>
      </div>

      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "profile.hint")}
      </p>

      <form action={updatePseudo} className="flex flex-col gap-3">
        <label
          htmlFor="pseudo"
          className="text-sm font-medium text-[var(--color-cream)]"
        >
          {t(locale, "profile.pseudoLabel")}
        </label>
        <input
          id="pseudo"
          name="pseudo"
          type="text"
          maxLength={40}
          defaultValue={profile?.pseudo ?? ""}
          placeholder={t(locale, "profile.pseudoPlaceholder")}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
        />
        {saved === "1" && (
          <p className="text-sm text-[var(--color-teal)]">
            {t(locale, "profile.saved")}
          </p>
        )}
        <SubmitButton
          locale={locale}
          className="mt-1 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
        >
          {t(locale, "profile.save")}
        </SubmitButton>
      </form>
    </main>
  );
}
