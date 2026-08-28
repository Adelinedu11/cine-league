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
    "header.toile": "La Toile — jeu du jour",
    "header.myLeagues": "Mes ligues",
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
    "profile.passwordTitle": "Changer de mot de passe",
    "profile.passwordHint":
      "Ton mot de passe actuel est demandé pour vérifier que c'est bien toi.",
    "profile.currentPassword": "Mot de passe actuel",
    "profile.passwordSave": "Changer le mot de passe",
    "profile.passwordSaving": "Enregistrement…",
    "profile.passwordSaved": "Mot de passe modifié.",
    "profile.currentPasswordWrong": "Ton mot de passe actuel est incorrect.",
    "profile.passwordSame":
      "Le nouveau mot de passe est identique à l'ancien.",

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

    // Login / inscription (e-mail + mot de passe)
    "login.tabSignIn": "Connexion",
    "login.tabSignUp": "Créer un compte",
    "login.signInTitle": "Connexion",
    "login.signInSubtitle": "Retrouve tes leagues et tes séances en cours.",
    "login.signUpTitle": "Créer un compte",
    "login.signUpSubtitle":
      "Choisis un pseudo, et tu rejoins directement la league publique.",
    "login.emailLabel": "Adresse e-mail",
    "login.emailPlaceholder": "ton@email.com",
    "login.passwordLabel": "Mot de passe",
    "login.passwordPlaceholder": "••••••••",
    "login.passwordHint": "{length} caractères minimum.",
    "login.showPassword": "Afficher le mot de passe",
    "login.hidePassword": "Masquer le mot de passe",
    "login.pseudoLabel": "Pseudo",
    "login.pseudoPlaceholder": "Ton pseudo",
    "login.pseudoHint": "C'est lui qui s'affichera dans les classements.",
    "login.signIn": "Se connecter",
    "login.signingIn": "Connexion…",
    "login.signUp": "Créer mon compte",
    "login.signingUp": "Création du compte…",
    "login.forgot": "Mot de passe oublié ?",
    "login.pseudoRequired": "Choisis un pseudo pour continuer.",
    "login.passwordTooShort":
      "Ton mot de passe doit faire au moins {length} caractères.",
    "login.invalidCredentials": "E-mail ou mot de passe incorrect.",
    "login.emailTaken":
      "Un compte existe déjà avec cet e-mail. Essaie de te connecter.",
    "login.errorFallback": "Quelque chose s'est mal passé, réessaie.",
    "login.emailNotConfirmed":
      "Ton compte existe, mais son adresse n'a jamais été validée. Clique sur le lien reçu à l'inscription, ou demande un nouveau mot de passe : ça la validera aussi.",
    "login.rateLimit":
      "Trop d'e-mails envoyés dans la dernière heure. Réessaie un peu plus tard.",
    "login.confirmTitle": "Compte créé",
    "login.confirmText":
      "Ton compte existe. Il reste à confirmer ton adresse : un lien vient d'être envoyé à {email}. Clique dessus, puis reviens te connecter.",
    "login.confirmSpam":
      "Rien reçu au bout de quelques minutes ? Regarde dans les indésirables.",

    // Mot de passe oublié
    "forgot.title": "Mot de passe oublié",
    "forgot.subtitle":
      "Indique ton e-mail : on t'envoie un code pour choisir un nouveau mot de passe.",
    "forgot.submit": "Envoyer le code",
    "forgot.submitting": "Envoi en cours…",
    "forgot.sentTitle": "Vérifie ta boîte mail",
    "forgot.codeSentTo":
      "Si un compte existe pour {email}, un code à {length} chiffres vient d'y être envoyé.",
    "forgot.codeLabel": "Code à {length} chiffres",
    "forgot.verify": "Valider le code",
    "forgot.verifying": "Vérification…",
    "forgot.verifyError": "Code invalide ou expiré, redemandes-en un.",
    "forgot.resend": "Renvoyer",
    "forgot.emailRequired": "Indique d'abord ton adresse e-mail.",
    "forgot.codeHint":
      "Tu peux quitter cette page pour aller chercher le code : elle t'attend.",
    "forgot.back": "← Retour à la connexion",
    "forgot.error": "Impossible d'envoyer le code pour le moment.",

    // Nouveau mot de passe
    "reset.title": "Nouveau mot de passe",
    "reset.subtitle": "Choisis un mot de passe, puis reconnecte-toi.",
    "reset.passwordLabel": "Nouveau mot de passe",
    "reset.confirmLabel": "Confirme le mot de passe",
    "reset.submit": "Enregistrer",
    "reset.submitting": "Enregistrement…",
    "reset.mismatch": "Les deux mots de passe ne sont pas identiques.",
    "reset.error": "Impossible d'enregistrer ce mot de passe.",
    "reset.expired":
      "Ce lien a expiré ou a déjà été utilisé. Demandes-en un nouveau.",

    // Page de garde publique (/) — visible sans compte
    "landing.tagline": "UN JEU DE CINÉMA PAR JOUR",
    "landing.pitch":
      "Chaque jour, une personnalité du cinéma à démasquer. Et des ligues pour organiser vos soirées ciné en compétition, entre amis.",
    "landing.ctaJouer": "Jouer maintenant",
    "landing.ctaSignUp": "Créer un compte",
    "landing.ctaSignIn": "J'ai déjà un compte",
    "landing.ctaNote": "Sans compte, sans installation. Deux minutes.",
    "landing.leaguesTitle": "Et avec vos amis : les ligues",
    "landing.leaguesText":
      "Une ligue réunit des gens qui se connaissent. On y organise des séances : un thème, des films, un vote, une cérémonie.",
    "landing.ctaMesLigues": "Mes ligues",
    "landing.compteTitle": "Envie de jouer à plusieurs ?",
    "landing.compteText":
      "Le compte ne sert qu'aux ligues — et à garder ta série de jours à La Toile. Gratuit, et il ne demande qu'un pseudo.",
    "landing.membreTitle": "Tes ligues t'attendent",
    "landing.membreText":
      "Retrouve tes séances en cours, propose un film, vote, ou lance une nouvelle ligue.",

    "landing.howTitle": "Comment ça marche",
    "landing.step1Title": "Un thème est lancé",
    "landing.step1Text":
      "« Un film qui se passe en huis clos », « le meilleur méchant »… L'admin ouvre une séance et fixe la date de la cérémonie.",
    "landing.step2Title": "Chacun propose son film",
    "landing.step2Text":
      "Personne ne voit les choix des autres avant la fin. Pas d'influence, pas de suivisme.",
    "landing.step3Title": "On vote, puis on célèbre",
    "landing.step3Text":
      "Vote par catégorie, à l'aveugle. À la cérémonie, le palmarès tombe et les scores s'ajoutent au classement.",

    "landing.modesTitle": "Deux façons de jouer",
    "landing.mode1Title": "Compétition officielle",
    "landing.mode1Text":
      "Le mode principal. Un film par personne sur le thème, un vote par catégorie, un palmarès à la clé.",
    "landing.mode2Title": "Ciné'Files",
    "landing.mode2Text":
      "Chacun cache un film. Aux autres de le deviner en vingt essais, avec des indices de plus en plus généreux.",

    "landing.toileTitle": "Pas encore d'amis sur Ciné League ?",
    "landing.toileText":
      "Joue à La Toile : chaque jour, une personnalité du cinéma à démasquer en proposant des films. Sans compte, sans amis, en cinq minutes.",
    "landing.toileCta": "Jouer à La Toile",

    "landing.footer": "Ciné League — vos soirées ciné, en compétition.",

    // Règles — La Toile
    "rules.toileTitle": "La Toile — le jeu du jour",
    "rules.toileIntro":
      "Chaque jour, une réalisatrice, un réalisateur, une actrice ou un acteur se cache. Pour le démasquer, tu proposes des films — ou des noms. Sans compte, en quelques minutes.",
    "rules.toileAmorce":
      "La partie s'ouvre sur une amorce : un film qui partage exactement une personne avec la cible. À toi de trouver laquelle.",
    "rules.toileFilm":
      "Chaque film proposé te dit qui, dans son générique, a déjà travaillé avec la cible, et sur combien de films. Un acteur à trois films est une piste bien plus chaude qu'une apparition unique.",
    "rules.toilePersonne":
      "Chaque nom proposé te dit combien de films cette personne a tournés avec la cible. Zéro film raye la piste, un film t'oriente.",
    "rules.toileBrulant":
      "Si tu proposes un film où la cible figure, on te le dit : brûlant. Mais il reste à la nommer — c'est en la nommant qu'on gagne.",
    "rules.toileIndices":
      "Pas de limite d'essais : ton score, c'est le nombre de coups. Au 10e, au 15e et au 20e essai, un indice se débloque — l'époque de son premier film, le nombre de films à son actif, puis son pays de naissance.",
    "rules.leaguesTitle": "Les ligues — jouer entre amis",
    "rules.leaguesIntro":
      "Une ligue réunit des gens qui se connaissent. On y organise des séances : un thème, des films, un vote, une cérémonie.",

    // La Toile — jeu du jour
    "toile.amorce": "AMORCE",
    "toile.amorceExplication":
      "Ce film partage exactement une personne avec la cible. À toi de trouver laquelle.",
    "toile.indiceMetier": "La cible est {metier}.",
    "toile.placeholder": "Un film ou une personne",
    "toile.dejaJoue": "déjà joué",
    "toile.brulant": "Brûlant — la cible est dans ce film. Reste à la nommer.",
    "toile.aucunePersonne": "Aucune personne en commun.",
    "toile.nFilms": "{n} film(s)",
    "toile.aucunFilm": "aucun film avec la cible",
    "toile.nEssais": "{n} essai(s)",
    "toile.demanderIndice": "Un indice",
    "toile.prochainIndice": "Prochain indice dans {n} essai(s).",
    "toile.indice.epoque": "Son premier film date de {valeur}.",
    "toile.indice.nbFilms": "Environ {valeur} films à son actif.",
    "toile.indice.pays": "Né ou née en {valeur}.",
    "toile.abandonner": "Donner sa langue au chat",
    "toile.gagne": "Trouvé en {coups} coups !",
    "toile.perdu": "C'était…",
    "toile.aucunePartie": "Pas de partie ce jour-là.",
    "toile.versLeagues": "Mes ligues →",
    "toile.statutPasJoue": "Tu n'as pas encore joué aujourd'hui",
    "toile.statutEnCours": "Partie en cours — {n} essai(s)",
    "toile.statutGagne": "Trouvé aujourd'hui en {coups} coups",
    "toile.statutAbandon": "Partie du jour terminée",

    // Catégories de vote d'une ligue
    "categories.titre": "Catégories de vote — Compétition officielle",
    "categories.aide":
      "Choisis jusqu'à {max} catégories pour les prochaines séances en Compétition officielle. Ciné'Files n'utilise pas de catégories. {n} sélectionnée(s).",
    "categories.propre": "(à vous)",
    "categories.nouvellePlaceholder": "Écrire une catégorie à vous",

    // Liste des ligues
    "leagues.toileTitle": "La Toile n° {numero}",
    "leagues.toileText":
      "Une personnalité du cinéma à démasquer en proposant des films. Nouvelle chaque jour.",
    "leagues.versRegles": "Voir les règles complètes →",
    "leagues.welcomeTitle": "Le but du jeu",
    "leagues.welcomeIntro":
      "Deux façons de jouer. Chaque jour, La Toile : retrouver une personnalité du cinéma par ses collaborations. Et quand vous êtes plusieurs, une ligue : proposez un film sur un thème, votez en aveugle, découvrez le palmarès à la cérémonie.",
    "leagues.badge": "VOS LIGUES",
    "leagues.title": "Mes ligues",
    "leagues.subtitle": "Rejoignez ou créez une ligue.",
    "leagues.empty": "Aucune ligue pour l'instant",
    "leagues.emptyHint":
      "Crée ta ligue pour jouer entre amis, ou rejoins-en une avec un code d'invitation.",
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
    "league.tabRoundsActive": "En cours",
    "league.tabRoundsArchived": "Archives",
    "league.archivesEmpty": "Aucune séance archivée pour l'instant.",
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
    "round.whereToWatch": "Où regarder ?",
    "round.hideWhereToWatch": "Masquer",
    "round.countdownPrefix": "Clôture dans",
    "round.countdownEnded": "Délai écoulé",
    "date.daysShort": "j",
    "date.hoursShort": "h",
    "date.minutesShort": "min",
    "date.secondsShort": "s",
    "league.durationPreview": "Échéance estimée : {date}",
    "notifications.title": "Notifications",
    "notifications.empty": "Aucune notification pour l'instant.",
    "notifications.markAllRead": "Tout marquer comme lu",
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
    "cinefiles.solved": "Trouvé !",
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
    "film.overlap": "{person} apparaît aussi dans {film}",
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
    "header.toile": "La Toile — daily game",
    "header.myLeagues": "My leagues",
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
    "profile.passwordTitle": "Change your password",
    "profile.passwordHint":
      "We ask for your current password to confirm it's really you.",
    "profile.currentPassword": "Current password",
    "profile.passwordSave": "Change password",
    "profile.passwordSaving": "Saving…",
    "profile.passwordSaved": "Password changed.",
    "profile.currentPasswordWrong": "Your current password is incorrect.",
    "profile.passwordSame": "The new password is the same as the old one.",

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

    // Login / sign-up (email + password)
    "login.tabSignIn": "Sign in",
    "login.tabSignUp": "Create an account",
    "login.signInTitle": "Sign in",
    "login.signInSubtitle": "Back to your leagues and ongoing screenings.",
    "login.signUpTitle": "Create an account",
    "login.signUpSubtitle":
      "Pick a nickname and you'll join the public league right away.",
    "login.emailLabel": "Email address",
    "login.emailPlaceholder": "you@email.com",
    "login.passwordLabel": "Password",
    "login.passwordPlaceholder": "••••••••",
    "login.passwordHint": "{length} characters minimum.",
    "login.showPassword": "Show password",
    "login.hidePassword": "Hide password",
    "login.pseudoLabel": "Nickname",
    "login.pseudoPlaceholder": "Your nickname",
    "login.pseudoHint": "This is what shows up in the standings.",
    "login.signIn": "Sign in",
    "login.signingIn": "Signing in…",
    "login.signUp": "Create my account",
    "login.signingUp": "Creating account…",
    "login.forgot": "Forgot your password?",
    "login.pseudoRequired": "Pick a nickname to continue.",
    "login.passwordTooShort":
      "Your password must be at least {length} characters long.",
    "login.invalidCredentials": "Wrong email or password.",
    "login.emailTaken":
      "An account already exists for this email. Try signing in.",
    "login.errorFallback": "Something went wrong, please try again.",
    "login.emailNotConfirmed":
      "Your account exists, but its address was never confirmed. Click the link you got when signing up, or request a new password — that confirms it too.",
    "login.rateLimit":
      "Too many emails sent in the last hour. Try again a little later.",
    "login.confirmTitle": "Account created",
    "login.confirmText":
      "Your account exists. One step left: confirm your address. A link was just sent to {email}. Click it, then come back and sign in.",
    "login.confirmSpam":
      "Nothing after a few minutes? Check your spam folder.",

    // Forgot password
    "forgot.title": "Forgot your password",
    "forgot.subtitle":
      "Enter your email and we'll send you a code to pick a new password.",
    "forgot.submit": "Send the code",
    "forgot.submitting": "Sending…",
    "forgot.sentTitle": "Check your inbox",
    "forgot.codeSentTo":
      "If an account exists for {email}, a {length}-digit code is on its way.",
    "forgot.codeLabel": "{length}-digit code",
    "forgot.verify": "Verify code",
    "forgot.verifying": "Verifying…",
    "forgot.verifyError": "Invalid or expired code, request a new one.",
    "forgot.resend": "Resend",
    "forgot.emailRequired": "Enter your email address first.",
    "forgot.codeHint":
      "Feel free to leave this page to fetch the code — it'll wait for you.",
    "forgot.back": "← Back to sign in",
    "forgot.error": "Couldn't send the code right now.",

    // New password
    "reset.title": "New password",
    "reset.subtitle": "Choose a password, then sign back in.",
    "reset.passwordLabel": "New password",
    "reset.confirmLabel": "Confirm password",
    "reset.submit": "Save",
    "reset.submitting": "Saving…",
    "reset.mismatch": "The two passwords don't match.",
    "reset.error": "Couldn't save this password.",
    "reset.expired": "This link has expired or was already used. Request a new one.",

    // Public landing page (/) — visible without an account
    "landing.tagline": "A FILM GAME EVERY DAY",
    "landing.pitch":
      "Every day, a film personality to unmask. Plus leagues to turn your movie nights into a competition with friends.",
    "landing.ctaJouer": "Play now",
    "landing.ctaSignUp": "Create an account",
    "landing.ctaSignIn": "I already have an account",
    "landing.ctaNote": "No account, no install. Two minutes.",
    "landing.leaguesTitle": "And with friends: leagues",
    "landing.leaguesText":
      "A league brings together people who know each other. You run screenings: a theme, films, a vote, a ceremony.",
    "landing.ctaMesLigues": "My leagues",
    "landing.compteTitle": "Want to play with others?",
    "landing.compteText":
      "The account is only for leagues — and to keep your daily streak on La Toile. Free, and all it asks for is a nickname.",
    "landing.membreTitle": "Your leagues are waiting",
    "landing.membreText":
      "Pick up your ongoing screenings, submit a film, vote, or start a new league.",

    "landing.howTitle": "How it works",
    "landing.step1Title": "A theme goes live",
    "landing.step1Text":
      "\"A film set in one room\", \"the best villain\"… The admin opens a screening and sets the ceremony date.",
    "landing.step2Title": "Everyone picks a film",
    "landing.step2Text":
      "Nobody sees anyone else's pick until the end. No influence, no bandwagon.",
    "landing.step3Title": "Vote, then celebrate",
    "landing.step3Text":
      "Blind voting, category by category. At the ceremony the results drop and scores join the standings.",

    "landing.modesTitle": "Two ways to play",
    "landing.mode1Title": "Official competition",
    "landing.mode1Text":
      "The main mode. One film each on the theme, one vote per category, a full prize list at the end.",
    "landing.mode2Title": "Ciné'Files",
    "landing.mode2Text":
      "Everyone hides a film. The others get twenty guesses to find it, with hints growing kinder as they go.",

    "landing.toileTitle": "No friends on Ciné League yet?",
    "landing.toileText":
      "Play La Toile: every day, a film personality to unmask by naming films. No account, no friends, five minutes.",
    "landing.toileCta": "Play La Toile",

    "landing.footer": "Ciné League — movie nights, made competitive.",

    // Home

    // Leagues list
    // Rules — La Toile
    "rules.toileTitle": "La Toile — the daily game",
    "rules.toileIntro":
      "Every day, a director or an actor is hiding. To unmask them, you name films — or people. No account needed, a few minutes at most.",
    "rules.toileAmorce":
      "The game opens on a clue film: it shares exactly one person with the target. Work out who.",
    "rules.toileFilm":
      "Each film you name tells you who in its credits has worked with the target, and on how many films. A three-film regular is a far hotter lead than a one-off.",
    "rules.toilePersonne":
      "Each name you try tells you how many films that person made with the target. Zero rules the lead out, one points you somewhere.",
    "rules.toileBrulant":
      "Name a film the target appears in and we'll say so: burning. But you still have to name them — naming is how you win.",
    "rules.toileIndices":
      "No guess limit: your score is the number of guesses. Hints unlock on the 10th, 15th and 20th try — the decade of their first film, how many films they've made, then their country of birth.",
    "rules.leaguesTitle": "Leagues — playing with friends",
    "rules.leaguesIntro":
      "A league brings together people who know each other. You run screenings: a theme, films, a vote, a ceremony.",

    // La Toile — daily game
    "toile.amorce": "OPENING CLUE",
    "toile.amorceExplication":
      "This film shares exactly one person with the target. Work out who.",
    "toile.indiceMetier": "The target is {metier}.",
    "toile.placeholder": "A film or a person",
    "toile.dejaJoue": "already played",
    "toile.brulant": "Burning — the target is in this film. Now name them.",
    "toile.aucunePersonne": "No one in common.",
    "toile.nFilms": "{n} film(s)",
    "toile.aucunFilm": "no film with the target",
    "toile.nEssais": "{n} guess(es)",
    "toile.demanderIndice": "A hint",
    "toile.prochainIndice": "Next hint in {n} guess(es).",
    "toile.indice.epoque": "Their first film dates from {valeur}.",
    "toile.indice.nbFilms": "Around {valeur} films to their name.",
    "toile.indice.pays": "Born in {valeur}.",
    "toile.abandonner": "Give up",
    "toile.gagne": "Found in {coups} guesses!",
    "toile.perdu": "It was…",
    "toile.aucunePartie": "No game that day.",
    "toile.versLeagues": "My leagues →",
    "toile.statutPasJoue": "You haven't played today",
    "toile.statutEnCours": "Game in progress — {n} guess(es)",
    "toile.statutGagne": "Solved today in {coups} guesses",
    "toile.statutAbandon": "Today's game is over",

    // League voting categories
    "categories.titre": "Voting categories — Official competition",
    "categories.aide":
      "Pick up to {max} categories for upcoming Official competition screenings. Ciné'Files doesn't use categories. {n} selected.",
    "categories.propre": "(yours)",
    "categories.nouvellePlaceholder": "Write your own category",

    "leagues.toileTitle": "La Toile no. {numero}",
    "leagues.toileText":
      "A film personality to unmask by naming films. A new one every day.",
    "leagues.versRegles": "See the full rules →",
    "leagues.welcomeTitle": "How it works",
    "leagues.welcomeIntro":
      "Two ways to play. Every day, La Toile: find a film personality through their collaborations. And when there are several of you, a league: submit a film on a theme, vote blind, reveal the winners at the ceremony.",
    "leagues.badge": "YOUR LEAGUES",
    "leagues.title": "My leagues",
    "leagues.subtitle": "Join or create a league.",
    "leagues.empty": "No league yet",
    "leagues.emptyHint":
      "Start your own league to play with friends, or join one with an invite code.",
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
    "league.tabRoundsActive": "Active",
    "league.tabRoundsArchived": "Archives",
    "league.archivesEmpty": "No archived screening yet.",
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
    "round.whereToWatch": "Where to watch?",
    "round.hideWhereToWatch": "Hide",
    "round.countdownPrefix": "Closes in",
    "round.countdownEnded": "Time's up",
    "date.daysShort": "d",
    "date.hoursShort": "h",
    "date.minutesShort": "min",
    "date.secondsShort": "s",
    "league.durationPreview": "Estimated deadline: {date}",
    "notifications.title": "Notifications",
    "notifications.empty": "No notification yet.",
    "notifications.markAllRead": "Mark all as read",
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
    "cinefiles.solved": "Found!",
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
    "film.overlap": "{person} also appears in {film}",
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
