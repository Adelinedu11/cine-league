/**
 * Constantes partagées par les écrans d'authentification.
 *
 * ATTENTION : cette longueur minimale n'est qu'un garde-fou d'interface. La
 * règle qui protège réellement les comptes est celle configurée côté Supabase
 * (Authentication → Policies → Minimum password length). Les deux valeurs
 * doivent rester alignées, sinon l'utilisateur voit un message contradictoire.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Traduit une erreur Supabase Auth en clé i18n. Supabase renvoie des messages
 * en anglais, non traduisibles tels quels : on s'appuie sur `code` (stable)
 * plutôt que sur `message` (susceptible de changer entre versions).
 */
export function authErrorKey(
  code: string | undefined,
  message: string | undefined,
): string {
  switch (code) {
    case "invalid_credentials":
      return "login.invalidCredentials";
    case "user_already_exists":
    case "email_exists":
      return "login.emailTaken";
    case "weak_password":
      return "login.passwordTooShort";
    default:
      // Certaines versions ne renvoient pas de `code` : repli sur le message.
      if (message?.toLowerCase().includes("already registered")) {
        return "login.emailTaken";
      }
      if (message?.toLowerCase().includes("invalid login credentials")) {
        return "login.invalidCredentials";
      }
      return "login.errorFallback";
  }
}
