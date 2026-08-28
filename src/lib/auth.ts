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
 * Longueur du code envoyé par e-mail pour réinitialiser un mot de passe.
 *
 * Doit correspondre au réglage Supabase `GOTRUE_MAILER_OTP_LENGTH` du projet
 * (8 ici, hérité de l'ancienne connexion par code). Si les deux divergent, le
 * bouton reste désactivé alors que le code saisi est bon.
 *
 * Pourquoi un code plutôt qu'un lien : les messageries — Gmail en tête —
 * préchargent les liens contenus dans les e-mails pour les analyser. Ce
 * prélancement consomme le jeton, à usage unique, et l'utilisateur reçoit
 * « lien invalide ou expiré » alors qu'il n'a rien fait. Un code recopié à la
 * main n'est consommable par aucun robot.
 */
export const RESET_CODE_LENGTH = 8;

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
    // Compte créé mais adresse jamais validée. C'était le cas le plus fréquent
    // en production et il tombait dans le repli générique : la personne lisait
    // « quelque chose s'est mal passé » sans jamais apprendre qu'il lui
    // suffisait de cliquer dans un e-mail.
    case "email_not_confirmed":
      return "login.emailNotConfirmed";
    // Le service d'envoi par défaut de Supabase est bridé à quelques messages
    // par heure. Sans message dédié, la limite ressemble à une panne.
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "login.rateLimit";
    default:
      if (message?.toLowerCase().includes("not confirmed")) {
        return "login.emailNotConfirmed";
      }
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
