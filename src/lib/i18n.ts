/**
 * i18n minimaliste sans bibliothèque, basé sur un cookie `locale`.
 *
 * - `dict` : toutes les chaînes de l'app en fr / en.
 * - `t(locale, key, params?)` : fonction PURE (utilisable client & serveur),
 *   avec interpolation de `{param}`.
 * - `getLocale()` : lit le cookie côté serveur (import dynamique de next/headers
 *   pour que ce module reste importable depuis un Client Component).
 *
 * Les Client Components reçoivent `locale` en prop puis appellent `t`.
 */

export type Locale = "fr" | "en";

export const LOCALES: Locale[] = ["fr", "en"];

type Dict = Record<string, string>;

export const dict: Record<Locale, Dict> = {
  fr: {
    // Métadonnées
    "meta.description": "Ligues de cinéma entre amis",

    // Commun
    "common.sending": "Envoi…",

    // Header / bascules
    "header.signOut": "Se déconnecter",
    "toggle.toLight": "Passer en mode clair",
    "toggle.toDark": "Passer en mode sombre",
    "toggle.locale": "Changer de langue",

    // Login
    "login.title": "Connexion",
    "login.subtitle": "Reçois un code de connexion par e-mail, sans mot de passe.",
    "login.emailLabel": "Adresse e-mail",
    "login.emailPlaceholder": "ton@email.com",
    "login.submit": "Recevoir mon code",
    "login.submitting": "Envoi en cours…",
    "login.sentTitle": "Vérifie ta boîte mail 📬",
    "login.codeSentTo": "Un code à {length} chiffres a été envoyé à {email}.",
    "login.codeLabel": "Code à {length} chiffres",
    "login.verify": "Valider",
    "login.verifying": "Vérification…",
    "login.verifyError": "Code invalide ou expiré, réessaie.",
    "login.errorFallback": "Impossible d'envoyer le code de connexion.",

    // Accueil
    "home.badge": "BIENVENUE",
    "home.pitch":
      "Vos soirées ciné en compétition : proposez un film sur un thème, votez en aveugle, et découvrez le palmarès à la cérémonie.",
    "home.cta": "Accéder à mes ligues",
    "home.loggedInAs": "Connecté en tant que {email}",

    // Liste des ligues
    "leagues.badge": "VOS LIGUES",
    "leagues.title": "Mes ligues",
    "leagues.subtitle": "Rejoignez ou créez une ligue.",
    "leagues.empty": "Tu ne fais partie d'aucune ligue pour l'instant.",
    "leagues.createTitle": "Créer une ligue",
    "leagues.nameLabel": "Nom de la ligue",
    "leagues.namePlaceholder": "Ex : Ciné du bureau",
    "leagues.createError": "La création a échoué, réessaie.",
    "leagues.createButton": "Créer",
    "leagues.joinTitle": "Rejoindre une ligue",
    "leagues.inviteLabel": "Code d'invitation",
    "leagues.invitePlaceholder": "Ex : ABC123",
    "leagues.invalidCode": "Code invalide.",
    "leagues.joinError": "Impossible de rejoindre cette ligue, réessaie.",
    "leagues.joinButton": "Rejoindre",

    // Détail d'une ligue
    "league.back": "← Mes ligues",
    "league.badge": "LIGUE",
    "league.pitch":
      "Choisissez un film qui incarne ce thème. Personne ne saura qui a soumis quoi — jusqu'à la cérémonie.",
    "league.inviteCode": "Code d'invitation :",
    "league.rename": "Renommer",
    "league.renameSave": "Enregistrer",
    "league.cancel": "Annuler",
    "league.deleteLeagueButton": "Supprimer cette ligue",
    "league.deleteLeagueConfirm":
      "Supprimer définitivement cette ligue et tous ses rounds ? Cette action est irréversible.",
    "league.roundsTitle": "Rounds",
    "league.roundsEmpty": "Aucun round pour l'instant. Crée le premier ci-dessous.",
    "league.standingsTitle": "Classement",
    "league.standingsEmpty":
      "Aucune victoire pour l'instant — le classement s'affichera après le premier round terminé.",
    "league.wins": "{count} victoires",
    "league.win": "{count} victoire",
    "league.membersTitle": "Membres",
    "league.adminBadge": "Admin",
    "league.exclude": "Exclure",
    "league.excludeConfirm": "Exclure {name} de la ligue ?",
    "league.createRoundTitle": "Créer un round",
    "league.themeLabel": "Thème",
    "league.themePlaceholder": "Ex : Films de casse",
    "league.deadlineLabel": "Date limite de soumission",
    "league.ceremonyLabel": "Date de la cérémonie",
    "league.createRoundError":
      "La création du round a échoué, vérifie les champs et réessaie.",
    "league.createRoundButton": "Créer le round",

    // Round — statuts et transitions
    "roundStatus.submission": "Soumissions ouvertes",
    "roundStatus.voting": "Votes en cours",
    "roundStatus.closed": "Terminé",
    "roundAction.submission": "Ouvrir les votes",
    "roundAction.voting": "Clôturer le round",
    "round.votesOpenOn": "Les votes ouvriront le {date}.",
    "round.canCloseOn": "Le round pourra être clôturé le {date}.",

    // Round — dates
    "round.submissionsUntil": "Soumissions jusqu'au {date}",
    "round.ceremonyOn": "Cérémonie le {date}",
    "date.at": "à",

    // Page round
    "round.back": "← Retour à la ligue",
    "round.tooEarly": "Cette transition n'est pas encore possible.",
    "round.deleteButton": "Supprimer ce round",
    "round.deleteConfirm":
      "Supprimer définitivement ce round ? Cette action est irréversible.",
    "round.submissionTitle": "Ta soumission",
    "round.voteTitle": "Voter",
    "round.votesSaved": "Votes enregistrés.",
    "round.voteError": "L'enregistrement des votes a échoué, réessaie.",
    "round.nothingToVote":
      "Rien à voter pour l'instant (aucune catégorie ou aucun film éligible).",
    "round.whyChoice": "Pourquoi ce choix ? (optionnel)",
    "round.voteCommentPlaceholder": "Quelques mots sur ton vote…",
    "round.voteButton": "Voter",
    "round.resultsTitle": "Résultats",

    // Recherche / soumission de film
    "film.alreadySubmitted": "Tu as déjà soumis :",
    "film.editSubmission": "Modifier ma soumission",
    "film.currentSubmission": "Soumission actuelle : {title}",
    "film.errorDuplicate": "Ce film a déjà été choisi par un autre joueur.",
    "film.errorClosed": "Les soumissions ne sont plus ouvertes pour ce round.",
    "film.errorSubmit": "L'enregistrement a échoué, réessaie.",
    "film.searchLabel": "Rechercher un film",
    "film.searchPlaceholder": "Tape un titre…",
    "film.searching": "Recherche…",
    "film.loadingDetails": "Chargement des détails…",
    "film.noPlatform": "Aucune plateforme trouvée en France.",
    "film.overlap": "⚠️ {person} apparaît aussi dans {film}",
    "film.commentPlaceholder": "Quelques mots sur ton film…",
    "film.submitting": "Envoi…",
    "film.submitButton": "Soumettre ce film",

    // Résultats / cérémonie
    "results.empty": "Aucun vote n'a été enregistré pour ce round.",
    "results.hideCredits": "Masquer le générique",
    "results.showCredits": "Afficher le générique",
    "results.tie": "Ex-aequo",
    "results.votes": "{count} votes",
    "results.vote": "{count} vote",
    "results.submittedBy": "soumis par",
    "results.unknown": "inconnu",
    "results.noteBy": "Note de {name} : « {comment} »",
  },
  en: {
    // Metadata
    "meta.description": "Movie leagues with friends",

    // Common
    "common.sending": "Sending…",

    // Header / toggles
    "header.signOut": "Sign out",
    "toggle.toLight": "Switch to light mode",
    "toggle.toDark": "Switch to dark mode",
    "toggle.locale": "Change language",

    // Login
    "login.title": "Sign in",
    "login.subtitle": "Get a sign-in code by email, no password needed.",
    "login.emailLabel": "Email address",
    "login.emailPlaceholder": "you@email.com",
    "login.submit": "Send my code",
    "login.submitting": "Sending…",
    "login.sentTitle": "Check your inbox 📬",
    "login.codeSentTo": "Your {length}-digit code was sent to {email}.",
    "login.codeLabel": "{length}-digit code",
    "login.verify": "Verify",
    "login.verifying": "Verifying…",
    "login.verifyError": "Invalid or expired code, try again.",
    "login.errorFallback": "Couldn't send the sign-in code.",

    // Home
    "home.badge": "WELCOME",
    "home.pitch":
      "Your movie nights, gamified: submit a film on a theme, vote blind, and reveal the winners at the ceremony.",
    "home.cta": "Go to my leagues",
    "home.loggedInAs": "Signed in as {email}",

    // Leagues list
    "leagues.badge": "YOUR LEAGUES",
    "leagues.title": "My leagues",
    "leagues.subtitle": "Join or create a league.",
    "leagues.empty": "You're not part of any league yet.",
    "leagues.createTitle": "Create a league",
    "leagues.nameLabel": "League name",
    "leagues.namePlaceholder": "e.g. Office movie club",
    "leagues.createError": "Creation failed, try again.",
    "leagues.createButton": "Create",
    "leagues.joinTitle": "Join a league",
    "leagues.inviteLabel": "Invite code",
    "leagues.invitePlaceholder": "e.g. ABC123",
    "leagues.invalidCode": "Invalid code.",
    "leagues.joinError": "Couldn't join this league, try again.",
    "leagues.joinButton": "Join",

    // League detail
    "league.back": "← My leagues",
    "league.badge": "LEAGUE",
    "league.pitch":
      "Pick a film that embodies the theme. No one knows who submitted what — until the ceremony.",
    "league.inviteCode": "Invite code:",
    "league.rename": "Rename",
    "league.renameSave": "Save",
    "league.cancel": "Cancel",
    "league.deleteLeagueButton": "Delete this league",
    "league.deleteLeagueConfirm":
      "Permanently delete this league and all its rounds? This action cannot be undone.",
    "league.roundsTitle": "Rounds",
    "league.roundsEmpty": "No round yet. Create the first one below.",
    "league.standingsTitle": "Standings",
    "league.standingsEmpty":
      "No win yet — standings will appear after the first completed round.",
    "league.wins": "{count} wins",
    "league.win": "{count} win",
    "league.membersTitle": "Members",
    "league.adminBadge": "Admin",
    "league.exclude": "Remove",
    "league.excludeConfirm": "Remove {name} from the league?",
    "league.createRoundTitle": "Create a round",
    "league.themeLabel": "Theme",
    "league.themePlaceholder": "e.g. Heist movies",
    "league.deadlineLabel": "Submission deadline",
    "league.ceremonyLabel": "Ceremony date",
    "league.createRoundError":
      "Round creation failed, check the fields and try again.",
    "league.createRoundButton": "Create the round",

    // Round — statuses and transitions
    "roundStatus.submission": "Submissions open",
    "roundStatus.voting": "Voting open",
    "roundStatus.closed": "Closed",
    "roundAction.submission": "Open voting",
    "roundAction.voting": "Close the round",
    "round.votesOpenOn": "Voting opens on {date}.",
    "round.canCloseOn": "The round can be closed on {date}.",

    // Round — dates
    "round.submissionsUntil": "Submissions until {date}",
    "round.ceremonyOn": "Ceremony on {date}",
    "date.at": "at",

    // Round page
    "round.back": "← Back to league",
    "round.tooEarly": "This transition isn't possible yet.",
    "round.deleteButton": "Delete this round",
    "round.deleteConfirm":
      "Permanently delete this round? This action cannot be undone.",
    "round.submissionTitle": "Your submission",
    "round.voteTitle": "Vote",
    "round.votesSaved": "Votes saved.",
    "round.voteError": "Saving your votes failed, try again.",
    "round.nothingToVote":
      "Nothing to vote on yet (no category or no eligible film).",
    "round.whyChoice": "Why this choice? (optional)",
    "round.voteCommentPlaceholder": "A few words about your vote…",
    "round.voteButton": "Vote",
    "round.resultsTitle": "Results",

    // Film search / submission
    "film.alreadySubmitted": "You already submitted:",
    "film.editSubmission": "Edit my submission",
    "film.currentSubmission": "Current submission: {title}",
    "film.errorDuplicate": "This film was already picked by another player.",
    "film.errorClosed": "Submissions are closed for this round.",
    "film.errorSubmit": "Saving failed, try again.",
    "film.searchLabel": "Search for a film",
    "film.searchPlaceholder": "Type a title…",
    "film.searching": "Searching…",
    "film.loadingDetails": "Loading details…",
    "film.noPlatform": "No platform found in France.",
    "film.overlap": "⚠️ {person} also appears in {film}",
    "film.commentPlaceholder": "A few words about your film…",
    "film.submitting": "Sending…",
    "film.submitButton": "Submit this film",

    // Results / ceremony
    "results.empty": "No vote was recorded for this round.",
    "results.hideCredits": "Hide the credits",
    "results.showCredits": "Show the credits",
    "results.tie": "Tie",
    "results.votes": "{count} votes",
    "results.vote": "{count} vote",
    "results.submittedBy": "submitted by",
    "results.unknown": "unknown",
    "results.noteBy": "Note by {name}: “{comment}”",
  },
};

/** Traduit `key` dans `locale`, avec interpolation optionnelle de `{param}`. */
export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const table = dict[locale] ?? dict.fr;
  let str = table[key] ?? dict.fr[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

/**
 * Lit le cookie `locale` côté serveur ('fr' par défaut). Import dynamique de
 * next/headers pour ne pas contaminer les bundles Client qui importent `t`.
 */
export async function getLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get("locale")?.value === "en" ? "en" : "fr";
}
