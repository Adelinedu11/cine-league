import { getLocale } from "@/lib/i18n";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const locale = await getLocale();
  const { mode } = await searchParams;

  // La page de garde pointe vers /login?mode=signup : le visiteur qui clique
  // « Créer un compte » doit atterrir sur cet onglet, pas sur la connexion.
  return (
    <LoginForm
      locale={locale}
      initialMode={mode === "signup" ? "signup" : "signin"}
    />
  );
}
