# La Toile — deviner une personnalité par ses collaborations

**Nom retenu : La Toile.** Le mot dit les deux choses à la fois — l'écran de
cinéma (« se faire une toile ») et le réseau, le maillage, la toile d'araignée,
c'est-à-dire la matière même du jeu : ce graphe de gens qui ont travaillé
ensemble. Il nomme le sujet *et* la mécanique, sans notice.

Court, partageable (« La Toile n° 42, trouvé en 6 »), et distinct de
« Ciné League », dont ce n'est qu'un mode.

*Inconvénient assumé : c'est un mot courant, qui désigne aussi le Web. Le jeu
sera plus difficile à retrouver dans un moteur de recherche qu'un nom
distinctif. Écarté au profit du gain de sens.*

---

## Les règles, telles qu'on les présente au joueur

> **Trouve la personnalité du jour.**
>
> Chaque jour, une réalisatrice, un réalisateur, une actrice ou un acteur se
> cache. Pour le démasquer, propose des films — ou des noms.
>
> **La partie s'ouvre sur une amorce :** un film qui partage exactement une
> personne avec la cible. À toi de trouver laquelle.
>
> **Chaque film proposé** te dit qui, dans son générique, a déjà travaillé avec
> la cible, et sur combien de films. Un acteur à trois films est une piste bien
> plus chaude qu'une apparition unique.
>
> **Chaque nom proposé** te dit combien de films cette personne a tournés avec
> la cible. Zéro film raye la piste. Un film t'oriente.
>
> **Si tu proposes un film où elle figure**, on te le dit : brûlant, la cible
> est dans ce film. Mais il reste à la nommer.
>
> **Tu gagnes en la nommant.**
>
> Pas de limite d'essais. Ton score, c'est le nombre de coups.

Issu de la séance de conception du 27/08/2026 et de deux parties tests jouées à
la main : Wes Anderson en 4 essais sans amorce, Ridley Scott en 6 essais avec
amorce.

**Ce que la comparaison des deux parties démontre.** Sans amorce : rien, rien,
rien, puis résolu d'un coup dès le premier essai chaud — une loterie suivie
d'une évidence. Avec amorce : six essais, mais de la progression à chaque coup.
Plus long, et bien meilleur. **L'amorce chaude convertit de la chance en
déduction** : c'est la règle qui porte le format.

**Réserve méthodologique.** Ces parties ont été arbitrées de mémoire, avec deux
erreurs factuelles sur une dizaine de réponses — un collaborateur compté 2 fois
au lieu de 3, un autre entièrement oublié. L'arbitre humain est le maillon
faible ; la base de données ne se trompera pas sur un casting. Les conclusions
de conception restent valables, les chiffres de difficulté sont indicatifs.

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

## Place dans l'application

La Toile n'est pas un produit séparé : **c'est le premier écran de Ciné League**,
celui qu'on ouvre chaque jour. Les leagues viennent ensuite, quand on veut jouer
avec des gens qu'on connaît.

Cette hiérarchie n'est pas cosmétique, elle décide de tout le reste. Le
quotidien attire et fait revenir sans rien demander à personne ; la league
retient, mais suppose déjà un groupe. Mettre la league en premier revenait à
demander à un visiteur d'avoir des amis inscrits avant de pouvoir jouer.

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

**Citer un film de la cible ne fait PAS gagner — il annonce « brûlant ».**
On ne gagne qu'en nommant la personne.

La première version faisait gagner sur le film, parce que la règle se
généralisait élégamment : le moteur cherche les personnes communes entre le film
proposé et la cible, et il trouve la cible elle-même — même code qu'elle soit
derrière ou devant la caméra. Élégant, mais faux pour le joueur, et ce sont deux
choses différentes.

Deux défauts, l'un et l'autre rédhibitoires. On pouvait **gagner par accident**,
en tentant un film au hasard qui se trouvait être le sien, sans avoir rien
déduit. Et on pouvait gagner **sans jamais prononcer le nom**, dans un jeu qui
s'appelle « trouve la personnalité ».

Le film brûlant reste donc un indice — le plus fort du jeu — et le nom reste le
moment de victoire. Le coût est d'un clic, et ce clic est la récompense.

**Pas de limite d'essais.** Avec une limite, un essai froid coûte, le joueur
devient prudent et ne tente que ce dont il est sûr — l'inverse de ce que ce jeu
veut. Sans limite, on balance des films par curiosité. Le score reste le nombre
de coups, donc la tension existe, mais elle est devenue positive.

**Un seul champ, films ET personnes.** Tranché pendant la seconde partie test.
Ce sont deux outils complémentaires qui s'équilibrent sans coût artificiel : un
film est un **filet large** (une douzaine de personnes testées d'un coup, sans
savoir lesquelles), un nom est une **sonde précise** (une question unique, une
réponse chiffrée). Au début on n'a pas d'hypothèse, donc on jette des filets ;
à la fin on en a une, donc on sonde. La partie prend naturellement la forme
large-puis-étroit. Un « 0 film » sur une sonde est bien plus satisfaisant qu'un
froid sur un film : l'échec est choisi, et il raye une piste précise.
Cas particulier : si le nom proposé **est** la cible, c'est gagné.

**L'amorce ne doit jamais contenir la cible.** Sinon l'amorce est la réponse.
Règle évidente une fois écrite, oubliée une fois sur deux.

**Distinguer les connexions nouvelles des connexions déjà connues.** Observé en
partie test : proposer deux films qui partagent le même collaborateur renvoie
deux fois le même nom, et le joueur a l'impression de tourner en rond sans
comprendre pourquoi. Un nom déjà repéré doit apparaître barré ou grisé, le
nouveau mis en avant.

**La répartition des résultats trahit le métier de la cible**, et c'est un
plaisir gratuit. Plusieurs acteurs à 1 film chacun, issus de films différents,
désigne un réalisateur ; un acteur à 3 films désigne une relation fétiche. Le
joueur apprend à lire ces motifs sans qu'on ait rien à coder — c'est ce qui
transforme le hasard en expertise.

## Points encore ouverts

**L'opacité de l'amorce.** Elle résout l'écran vide, mais donner un film sans
dire qui le connecte crée une pièce inutilisable : en partie test, la joueuse
s'est bloquée à essayer de croiser l'amorce avec un nom trouvé ailleurs, sans
savoir par quel fil l'amorce tenait. Trois sorties possibles : annoncer le
nombre de personnes partagées sans les nommer, permettre d'« ouvrir » l'amorce
comme premier indice payant, ou choisir systématiquement une amorce qui ne
partage **qu'une seule** personne, pour que le fil soit unique.

**Indice payant pour un collaborateur déjà identifié :** demander *dans quel
film* il a croisé la cible. C'est l'information qui débloque, et elle donne
presque la réponse — donc elle doit coûter cher.

**Rang par ordre d'arrivée** — repris de Cémantix, et c'est la solution au
problème du classement. « Tu es le 247ᵉ à trouver aujourd'hui » ne classe pas
par performance mais par ordre d'arrivée dans la journée : aucune égalité à
départager, aucune humiliation (être 247ᵉ n'est pas être mauvais), et une petite
urgence à jouer tôt. Un classement strict « en moins de coups » se heurterait à
l'arithmétique — sur mille joueurs, trois cents seraient à quatre essais, et
départager au chronomètre récompense les insomniaques. Le classement strict
garde tout son sens dans les leagues, où l'on connaît les gens.

**Pas de pourcentage de proximité.** La tentation vient de Cémantix, dont la
température mesure une vraie distance sémantique continue. La Toile n'a pas de
continuum : elle a des faits discrets (cette personne a fait tant de films avec
la cible). Afficher un pourcentage supposerait d'inventer une distance qui
n'existe pas — et un thermomètre qui ment est pire que pas de thermomètre.
L'intensité honnête existe déjà : le nombre de films partagés, éventuellement
exprimé en ratio (« 3 films sur les 12 de la cible »).

**« Découvre la personnalité d'hier »**, jamais « la cible d'hier était X ».
Écrire le nom tue le rejeu : on ne rejoue pas une partie dont on connaît la
réponse. Le lien doit intriguer, pas résoudre.

**Compteur de joueurs du jour :** à afficher ou non selon le volume. Décision
d'Adeline : l'afficher même bas, assumer les débuts.

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
