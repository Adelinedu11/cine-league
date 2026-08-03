import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import HeaderMenu from "@/components/HeaderMenu";
import { getLocale } from "@/lib/i18n";

export default async function LeaguesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();

  // Pseudo global (prioritaire sur l'e-mail) pour le lien profil du header.
  const { data: profile } = await supabase
    .from("profiles")
    .select("pseudo")
    .eq("user_id", user.id)
    .maybeSingle();
  const headerName = profile?.pseudo?.trim() || user.email || "?";

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <>
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/leagues"
            className="flex shrink-0 -translate-y-0.5 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5"
          >
            <Ticket
              size={20}
              strokeWidth={1.5}
              className="text-[var(--color-gold)]"
            />
            <span className="font-display text-2xl tracking-wide text-[var(--color-gold)]">
              Ciné League
            </span>
          </Link>
          <HeaderMenu locale={locale} name={headerName} signOut={signOut} />
        </div>
      </header>
      {children}
    </>
  );
}
