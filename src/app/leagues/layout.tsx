import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import LocaleToggle from "@/components/LocaleToggle";
import { getLocale, t } from "@/lib/i18n";

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
          <div className="flex items-center gap-3 overflow-hidden">
            <LocaleToggle locale={locale} />
            <ThemeToggle locale={locale} />
            <span className="font-mono truncate text-sm text-[var(--color-cream)]">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
              >
                {t(locale, "header.signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
