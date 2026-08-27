# Le jeu du jour — deviner une personnalité par ses collaborations

Issu de la séance de conception du 27/08/2026, et d'une partie test jouée à la
main (cible : Wes Anderson, trouvée en 4 essais).

Ce document remplace l'idée de « league publique officielle » du plan v3.

---

## Pourquoi on abandonne la league officielle

Une league et un jeu quotidien ne tiennent pas debout pour les mêmes raisons.

Une league est **sociale** : sa valeur vient de qui joue avec toi. « Marc a gagné
meilleur réalisateur » est drôle parce que tu connais Marc. Une league publique
d'inconnus perd exactement ça, et elle impose un coût récurrent — quelqu'un doit
ouvrir une séance, choisir un thème, fixer des dates, toutes les semaines, pour
toujours. Deux semaines de silence et la vitrine a l'air abandonnée.

Un jeu quotidien est **solitaire mais comparatif** : aucun groupe à animer, la
rétention vient de l'habitude. Une fois la réserve constituée, le coût récurrent
est nul.

Donc : **le quotidien va au public, la league va au privé.** Le jeu du jour
devient la porte d'entrée, la league privée reste l'engagement profond.

---

## Le principe

On doit deviner **une personnalité du cinéma** — réalisateur, réalisatrice,
acteur, actrice — en proposant **des films**.

Chaque film proposé renvoie les personnes que ce film partage avec la cible, et
le nombre de films faits avec elle. Proposer *Pulp Fiction* face à une cible
Wes Anderson renvoie « Harvey Keitel — 3 films, Bruce Willis — 1 film ».

L'intérêt du format est là : une mauvaise réponse ne renvoie pas « décennie :
plus récent », elle renvoie **un nom**. Quelque chose dont on a envie de parler,
et qui apprend un bout de cinéma au passage. On exploite le **graphe** des
collaborations, que TMDB possède et que presque personne ne transforme en jeu,
plutôt que des attributs plats que tout le monde a.

## Règles retenues

**Amorce chaude.** La partie s'ouvre en offrant un film déjà connecté à la
cible, **sans dire par qui**. C'est la décision la plus importante du format.
Sans elle, le joueur affronte un écran vide devant un million de films, et la
partie test a montré la courbe qui en résulte : rien, rien, rien, puis résolu
d'un coup dès le premier essai chaud. Une falaise, pas une montée. L'amorce
transforme une loterie suivie d'une évidence en déduction continue.

**Périmètre serré.** Ne comptent comme collaboration que le casting principal
(une dizaine de noms), la réalisation, le scénario et la musique. Au-delà, le
graphe du cinéma est si dense que tout est connecté à tout, et un indice
toujours positif ne vaut rien. La partie test a confirmé qu'avec ce périmètre,
de vrais « froids » existent — *Gladiator* et *Les Affranchis* n'ont renvoyé
personne.

**Les noms sont affichés**, avec le nombre de films en commun. Un acteur fétiche
à 3 films est bien plus chaud qu'une apparition unique : c'est le nombre de
collaborations qui fait le thermomètre, pas les degrés de séparation — dans un
graphe aussi dense, tout le monde est à deux degrés de tout le monde.

**Citer un film de la cible fait gagner.** La règle se généralise seule : le
moteur cherche les personnes communes entre le film proposé et la cible, et il
trouve la cible elle-même. Même code que la cible soit derrière ou devant la
caméra. Un seul champ de saisie, une seule mécanique.

**Pas de limite d'essais.** Avec une limite, un essai froid coûte, le joueur
devient prudent et ne tente que ce dont il est sûr — l'inverse de ce que ce jeu
veut. Sans limite, on balance des films par curiosité. Le score reste le nombre
de coups, donc la tension existe, mais elle est devenue positive.

## Points encore ouverts

**Autoriser aussi les noms de personnes dans le champ ?** Adeline penche pour
les films seuls. Argument contraire : quand on a *déduit* la réponse, on veut la
dire — obliger à retrouver un titre ajoute une épreuve de mémoire à un jeu de
déduction. La recherche TMDB peut renvoyer films et personnes dans le même
appel, donc le coût technique est nul.

**Classement ou distribution ?** Un classement strict « en moins de coups »
se heurte à l'arithmétique : sur mille joueurs, trois cents seront à quatre
essais, et départager au chronomètre récompense les insomniaques. Une
distribution — « trouvé en 4 coups, comme 23 % des joueurs » — plus une série
de jours consécutifs colle mieux au format. Le classement strict garde tout son
sens dans les leagues, où l'on connaît les gens.

**Jouer sans compte ?** Proposition : partie anonyme mémorisée dans le
navigateur, compte demandé seulement pour conserver sa série. C'est ce qui
sépare un jeu qu'on essaie d'un jeu qu'on abandonne à l'inscription.

**Calibrage.** Quelles personnalités sont admissibles ? La difficulté dépend de
la taille de la filmographie autant que de la notoriété.

**Fuseau horaire de référence** pour définir « le jour ».

---

## Architecture

Le piège serait d'interroger TMDB à chaque proposition pour reconstruire le
réseau — trop d'appels, trop lent. Il faut faire l'inverse.

**Une fois par jour**, on calcule l'ensemble des collaborateurs de la cible :
sa filmographie via `/person/{id}/movie_credits`, puis les castings et équipes
de ces films. On stocke cet ensemble.

**À chaque proposition**, on récupère le casting du film proposé et on croise
avec cet ensemble. Un seul appel TMDB par film *distinct* jamais proposé, mis en
cache définitivement : au bout d'une semaine, les films populaires sont tous en
base et l'on n'appelle presque plus rien.

Pour des indices progressifs, TMDB fournit le lieu de naissance (il n'y a pas de
champ « nationalité » à proprement parler), le métier principal, la date de
naissance, la filmographie complète.

**La réponse ne doit jamais partir vers le navigateur.** C'est déjà
l'architecture de Ciné'Files : la migration 018 calcule le feedback entièrement
en base et ne renvoie que lui. Si le client connaissait la cible pour afficher
les indices, n'importe qui l'ouvrirait dans les outils de développement.

## Ce qu'il reste à construire

Peu de choses, et c'est le point encourageant : `submit_cine_guess` fait déjà le
travail difficile. Il manque une table de cibles du jour (date, identifiant
TMDB, film d'amorce), une série de tentatives par joueur et par jour, la
distribution et la série de jours consécutifs.

## Ce qu'il faut défaire

La league publique officielle et son déclencheur d'adhésion automatique
(migration 028, sections 1, 2, 5, 6, 7). **Le durcissement RLS des leagues
privées — sections 3 et 4 — reste acquis** : c'était le vrai gain de la
migration, et il est indépendant de la league publique.
