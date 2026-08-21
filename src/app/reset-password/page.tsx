import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import ResetPasswordForm from "./ResetPasswordForm";

/**
 * Écran de choix d'un nouveau mot de passe. On n'y arrive qu'avec une session
 * ouverte par le lien de récupération (le callback l'a posée) : sans session,
 * il n'y a rien à mettre à jour, donc retour au formulaire de demande.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mot-de-passe-oublie?expired=1");
  }

  const locale = await getLocale();
  return <ResetPasswordForm locale={locale} />;
}
