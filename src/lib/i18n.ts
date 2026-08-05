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

    // Profil
    "header.profile": "Mon profil",
    "header.theme": "Thème",
    "header.language": "Langue",
    "profile.title": "Mon profil",
    "profile.back": "← Retour",
    "profile.hint":
      "Ton pseudo s'affiche à la place de ton e-mail partout dans l'app.",
    "profile.pseudoLabel": "Pseudo",
    "profile.pseudoPlaceholder": "Ton pseudo",
    "profile.save": "Enregistrer",
    "profile.saved": "Pseudo enregistré.",

    // Ciné'Files (compléments)
    "cinefiles.proposalBy": "Le secret de {name}",
    "roundStatus.cineOngoing": "En cours",
    "roundAction.cineClose": "Clôturer cette séance",
    "league.closeDateLabel": "Date de clôture",

    // Onglets + classements + règles
    "header.rules": "Règles",
    "league.tabRounds": "Séances",
    "league.tabMembers": "Membres",
    "league.tabStandings": "Classements",
    "league.cineStandingsTitle": "Classement Ciné'Files",
    "league.cineStandingsEmpty":
      "Aucun point Ciné'Files pour l'instant — joue une séance Ciné'Files clôturée.",
    "league.points": "{count} pts",
    "cinefiles.roundScoresTitle": "Classement de la séance",
    "rules.title": "Règles du jeu",
    "rules.back": "← Retour",
    "rules.intro": "Deux modes de jeu, une même ligue.",
    "rules.compTitle": "Compétition officielle",
    "rules.compBody":
      "Chaque membre soumet un film de façon anonyme sur un thème donné. Une fois les votes ouverts, chacun vote par catégorie (meilleur film, meilleur réalisateur…) sans savoir qui a proposé quoi. À la clôture, le générique est révélé : on découvre qui avait soumis chaque film et les gagnants de chaque catégorie.",
    "rules.cineTitle": "Comment jouer à Ciné'Files",
    "rules.cineIntro":
      "Un joueur propose un film mystère, correspondant au thème de la séance.",
    "rules.cineBody":
      "Les autres joueurs tentent de deviner ce film en proposant des titres. Après chaque proposition, le jeu compare ton film candidat au mystère sur plusieurs critères : genre, décennie, année, réalisateur, pays, langue, un acteur du casting, plateforme de diffusion. Chaque critère qui correspond est validé (✓) et reste affiché aux tentatives suivantes.",
    "rules.cineBonus":
      "À partir du 10e essai, tu peux demander un indice bonus : un acteur supplémentaire du casting, différent de ceux déjà révélés.",
    "rules.scoringMain":
      "Le film mystère rapporte 100 points, partagés entre toi (le devineur) et l'auteur du mystère. Plus tu trouves tôt, plus tu gagnes de points — et moins l'auteur en garde.",
    "rules.example15":
      "Trouvé entre le 15e et le 19e essai : 10 points pour toi, 10 points pour l'auteur.",
    "rules.exampleNever":
      "Toujours pas trouvé après 20 essais : personne ne marque de points.",

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
    "leagues.welcomeTitle": "Bienvenue sur Ciné League 🎬",
    "leagues.welcomeIntro":
      "Crée ou rejoins une ligue pour jouer entre amis : proposez des films, votez, devinez les films mystères, et grimpez au classement.",
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
      "Supprimer définitivement cette ligue et toutes ses séances ? Cette action est irréversible.",
    "league.roundsTitle": "Séances",
    "league.roundsEmpty":
      "Aucune séance pour l'instant. Crée la première ci-dessous.",
    "league.standingsTitle": "Classement",
    "league.standingsEmpty":
      "Aucune victoire pour l'instant — le classement s'affichera après la première séance terminée.",
    "league.wins": "{count} victoires",
    "league.win": "{count} victoire",
    "league.membersTitle": "Membres",
    "league.adminBadge": "Admin",
    "league.exclude": "Exclure",
    "league.excludeConfirm": "Exclure {name} de la ligue ?",
    "league.createRoundTitle": "Créer une séance",
    "league.themeLabel": "Thème",
    "league.themePlaceholder": "Ex : Films de casse",
    "league.deadlineLabel": "Date limite de soumission",
    "league.ceremonyLabel": "Date de la cérémonie",
    "league.createRoundError":
      "La création de la séance a échoué, vérifie les champs et réessaie.",
    "league.createRoundButton": "Créer la séance",

    // Round — statuts et transitions
    "roundStatus.submission": "Soumissions ouvertes",
    "roundStatus.voting": "Votes en cours",
    "roundStatus.closed": "Terminé",
    "roundAction.submission": "Ouvrir les votes",
    "roundAction.voting": "Clôturer la séance",
    "round.votesOpenOn": "Les votes ouvriront le {date}.",
    "round.canCloseOn": "La séance pourra être clôturée le {date}.",

    // Round — dates
    "round.submissionsUntil": "Soumissions jusqu'au {date}",
    "round.ceremonyOn": "Cérémonie le {date}",
    "date.at": "à",

    // Page round
    "round.back": "← Retour à la ligue",
    "round.tooEarly": "Cette transition n'est pas encore possible.",
    "round.editDates": "Modifier les dates",
    "round.datesError":
      "La cérémonie doit être postérieure à la date limite de soumission.",
    "round.deleteButton": "Supprimer cette séance",
    "round.deleteConfirm":
      "Supprimer définitivement cette séance ? Cette action est irréversible.",
    "round.submissionTitle": "Ta soumission",
    "round.voteTitle": "Voter",
    "round.votesSaved": "Votes enregistrés.",
    "round.voteError": "L'enregistrement des votes a échoué, réessaie.",
    "round.nothingToVote":
      "Rien à voter pour l'instant (aucune catégorie ou aucun film éligible).",
    "round.whyChoice": "Pourquoi ce choix ? (optionnel)",
    "round.voteCommentPlaceholder": "Quelques mots sur ton vote…",
    "round.voteButton": "Voter",
    "round.votersTitle": "Qui a voté",
    "round.voterVoted": "a voté",
    "round.voterPending": "pas encore",
    "round.submittersTitle": "Qui a soumis",
    "round.submitterSubmitted": "a soumis",
    "roundMode.competition": "Compétition officielle",
    "roundMode.cineFiles": "Ciné'Files",
    "league.modeLabel": "Type de séance",
    "cinefiles.submissionTitle": "Ton film secret",
    "cinefiles.chooseButton": "Choisir mon film mystère",
    "cinefiles.themeExplain":
      "Le thème est « {theme} ». Chaque joueur a choisi un film secret qui y correspond — devine ceux des autres !",
    "cinefiles.createNote":
      "Chacun choisira secrètement un film qui correspond à ce thème.",
    "cinefiles.guessTitle": "Deviner les films mystères",
    "cinefiles.chooseFirst":
      "Choisis d'abord ton film mystère pour pouvoir deviner ceux des autres.",
    "cinefiles.noMysteries": "Aucun autre film mystère à deviner pour l'instant.",
    "cinefiles.mystery": "Mystère {label}",
    "cinefiles.attempt": "{count} tentative",
    "cinefiles.attempts": "{count} tentatives",
    "cinefiles.foundBadge": "Trouvé",
    "cinefiles.guessButton": "Proposer ce film",
    "cinefiles.guessError": "La tentative a échoué, réessaie.",
    "cinefiles.attemptsEmpty": "Aucune tentative pour l'instant.",
    "cinefiles.critGenre": "Genre",
    "cinefiles.critDecade": "Décennie",
    "cinefiles.critYear": "Année",
    "cinefiles.critDirector": "Réalisateur",
    "cinefiles.critCountry": "Pays",
    "cinefiles.critLanguage": "Langue",
    "cinefiles.critActors": "Acteurs",
    "cinefiles.critPlatforms": "Plateformes",
    "cinefiles.decadeValue": "Années {decade}",
    "cinefiles.attemptCounter": "{count}/{max} essais",
    "cinefiles.bonusHints": "Indices bonus",
    "cinefiles.bonusButton": "Demander un indice bonus",
    "cinefiles.bonusEmpty": "Plus d'acteur à révéler.",
    "cinefiles.solved": "Trouvé ! ✅",
    "cinefiles.exhausted": "Essais épuisés (20).",
    "cinefiles.secretFilm": "Film secret",
    "cinefiles.foundCount": "{count}/{total} mystères trouvés",
    "cinefiles.foundShort": "{count} trouvé(s)",
    "cinefiles.confirmedHints": "Indices confirmés",
    "cinefiles.contradiction":
      "Ce choix contredit l'indice déjà confirmé : {hint}",
    "round.resultsTitle": "Résultats",

    // Recherche / soumission de film
    "film.alreadySubmitted": "Tu as déjà soumis :",
    "film.editSubmission": "Modifier ma soumission",
    "film.currentSubmission": "Soumission actuelle : {title}",
    "film.errorDuplicate": "Ce film a déjà été choisi par un autre joueur.",
    "film.errorClosed": "Les soumissions ne sont plus ouvertes pour cette séance.",
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
    "results.empty": "Aucun vote n'a été enregistré pour cette séance.",
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

    // Profile
    "header.profile": "My profile",
    "header.theme": "Theme",
    "header.language": "Language",
    "profile.title": "My profile",
    "profile.back": "← Back",
    "profile.hint":
      "Your nickname is shown instead of your email everywhere in the app.",
    "profile.pseudoLabel": "Nickname",
    "profile.pseudoPlaceholder": "Your nickname",
    "profile.save": "Save",
    "profile.saved": "Nickname saved.",

    // Ciné'Files (extras)
    "cinefiles.proposalBy": "{name}'s secret",
    "roundStatus.cineOngoing": "Ongoing",
    "roundAction.cineClose": "Close this screening",
    "league.closeDateLabel": "Close date",

    // Tabs + standings + rules
    "header.rules": "Rules",
    "league.tabRounds": "Screenings",
    "league.tabMembers": "Members",
    "league.tabStandings": "Standings",
    "league.cineStandingsTitle": "Ciné'Files standings",
    "league.cineStandingsEmpty":
      "No Ciné'Files points yet — play a closed Ciné'Files screening.",
    "league.points": "{count} pts",
    "cinefiles.roundScoresTitle": "Screening standings",
    "rules.title": "Game rules",
    "rules.back": "← Back",
    "rules.intro": "Two game modes, one league.",
    "rules.compTitle": "Official competition",
    "rules.compBody":
      "Each member submits a film anonymously on a given theme. Once voting opens, everyone votes by category (best film, best director…) without knowing who submitted what. At closing, the credits are revealed: you find out who submitted each film and the winners of each category.",
    "rules.cineTitle": "How to play Ciné'Files",
    "rules.cineIntro":
      "One player submits a mystery film that matches the screening's theme.",
    "rules.cineBody":
      "The other players try to guess it by proposing titles. After each guess, the game compares your candidate film to the mystery across several criteria: genre, decade, year, director, country, language, one cast member, and streaming platform. Each matching criterion is validated (✓) and stays shown on later attempts.",
    "rules.cineBonus":
      "From the 10th attempt, you can request a bonus hint: an extra cast member, different from those already revealed.",
    "rules.scoringMain":
      "The mystery film is worth 100 points, shared between you (the guesser) and the mystery's author. The earlier you find it, the more you score — and the less the author keeps.",
    "rules.example15":
      "Found between the 15th and 19th attempt: 10 points for you, 10 points for the author.",
    "rules.exampleNever":
      "Still not found after 20 attempts: no one scores.",

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
    "leagues.welcomeTitle": "Welcome to Ciné League 🎬",
    "leagues.welcomeIntro":
      "Create or join a league to play with friends: submit films, vote, guess mystery films, and climb the standings.",
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
      "Permanently delete this league and all its screenings? This action cannot be undone.",
    "league.roundsTitle": "Screenings",
    "league.roundsEmpty": "No screening yet. Create the first one below.",
    "league.standingsTitle": "Standings",
    "league.standingsEmpty":
      "No win yet — standings will appear after the first completed screening.",
    "league.wins": "{count} wins",
    "league.win": "{count} win",
    "league.membersTitle": "Members",
    "league.adminBadge": "Admin",
    "league.exclude": "Remove",
    "league.excludeConfirm": "Remove {name} from the league?",
    "league.createRoundTitle": "Create a screening",
    "league.themeLabel": "Theme",
    "league.themePlaceholder": "e.g. Heist movies",
    "league.deadlineLabel": "Submission deadline",
    "league.ceremonyLabel": "Ceremony date",
    "league.createRoundError":
      "Screening creation failed, check the fields and try again.",
    "league.createRoundButton": "Create the screening",

    // Round — statuses and transitions
    "roundStatus.submission": "Submissions open",
    "roundStatus.voting": "Voting open",
    "roundStatus.closed": "Closed",
    "roundAction.submission": "Open voting",
    "roundAction.voting": "Close the screening",
    "round.votesOpenOn": "Voting opens on {date}.",
    "round.canCloseOn": "The screening can be closed on {date}.",

    // Round — dates
    "round.submissionsUntil": "Submissions until {date}",
    "round.ceremonyOn": "Ceremony on {date}",
    "date.at": "at",

    // Round page
    "round.back": "← Back to league",
    "round.tooEarly": "This transition isn't possible yet.",
    "round.editDates": "Edit dates",
    "round.datesError":
      "The ceremony must be later than the submission deadline.",
    "round.deleteButton": "Delete this screening",
    "round.deleteConfirm":
      "Permanently delete this screening? This action cannot be undone.",
    "round.submissionTitle": "Your submission",
    "round.voteTitle": "Vote",
    "round.votesSaved": "Votes saved.",
    "round.voteError": "Saving your votes failed, try again.",
    "round.nothingToVote":
      "Nothing to vote on yet (no category or no eligible film).",
    "round.whyChoice": "Why this choice? (optional)",
    "round.voteCommentPlaceholder": "A few words about your vote…",
    "round.voteButton": "Vote",
    "round.votersTitle": "Who has voted",
    "round.voterVoted": "voted",
    "round.voterPending": "not yet",
    "round.submittersTitle": "Who has submitted",
    "round.submitterSubmitted": "submitted",
    "roundMode.competition": "Official competition",
    "roundMode.cineFiles": "Ciné'Files",
    "league.modeLabel": "Screening type",
    "cinefiles.submissionTitle": "Your secret film",
    "cinefiles.chooseButton": "Choose my mystery film",
    "cinefiles.themeExplain":
      "The theme is “{theme}”. Each player picked a secret film that fits it — guess the others!",
    "cinefiles.createNote":
      "Everyone will secretly pick a film that matches this theme.",
    "cinefiles.guessTitle": "Guess the mystery films",
    "cinefiles.chooseFirst":
      "Choose your own mystery film first to start guessing the others.",
    "cinefiles.noMysteries": "No other mystery film to guess yet.",
    "cinefiles.mystery": "Mystery {label}",
    "cinefiles.attempt": "{count} attempt",
    "cinefiles.attempts": "{count} attempts",
    "cinefiles.foundBadge": "Found",
    "cinefiles.guessButton": "Guess this film",
    "cinefiles.guessError": "The guess failed, try again.",
    "cinefiles.attemptsEmpty": "No attempt yet.",
    "cinefiles.critGenre": "Genre",
    "cinefiles.critDecade": "Decade",
    "cinefiles.critYear": "Year",
    "cinefiles.critDirector": "Director",
    "cinefiles.critCountry": "Country",
    "cinefiles.critLanguage": "Language",
    "cinefiles.critActors": "Actors",
    "cinefiles.critPlatforms": "Platforms",
    "cinefiles.decadeValue": "{decade}s",
    "cinefiles.attemptCounter": "{count}/{max} tries",
    "cinefiles.bonusHints": "Bonus hints",
    "cinefiles.bonusButton": "Request a bonus hint",
    "cinefiles.bonusEmpty": "No more actor to reveal.",
    "cinefiles.solved": "Found! ✅",
    "cinefiles.exhausted": "Out of tries (20).",
    "cinefiles.secretFilm": "Secret film",
    "cinefiles.foundCount": "{count}/{total} mysteries found",
    "cinefiles.foundShort": "{count} found",
    "cinefiles.confirmedHints": "Confirmed hints",
    "cinefiles.contradiction":
      "This choice contradicts an already-confirmed hint: {hint}",
    "round.resultsTitle": "Results",

    // Film search / submission
    "film.alreadySubmitted": "You already submitted:",
    "film.editSubmission": "Edit my submission",
    "film.currentSubmission": "Current submission: {title}",
    "film.errorDuplicate": "This film was already picked by another player.",
    "film.errorClosed": "Submissions are closed for this screening.",
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
    "results.empty": "No vote was recorded for this screening.",
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
