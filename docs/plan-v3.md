# Ciné League — plan v3 : ouverture, vitrine, pop

Décidé le 21/08/2026. Trois arbitrages validés en amont :

- **Auth** : email + mot de passe uniquement. L'OTP à 8 chiffres est supprimé.
- **League publique** : une seule league officielle, rejointe automatiquement à l'inscription.
- **Ordre** : la logique d'abord (auth, league), le décor ensuite (page de garde, pop).

---

## Étape 1 — Auth par mot de passe

**Pourquoi d'abord.** Tout le reste en dépend : la page de garde doit savoir quels
boutons proposer, et la league publique doit se brancher sur l'événement
« nouvel inscrit ».

**Ce qui change.**

| Fichier | Nature du changement |
| --- | --- |
| `src/app/login/LoginForm.tsx` | Réécrit. Deux onglets : Connexion / Créer un compte. Plus d'écran de code. |
| `src/app/mot-de-passe-oublie/page.tsx` | Nouveau. Demande l'email, envoie le lien de réinitialisation. |
| `src/app/reset-password/page.tsx` | Nouveau. Formulaire de nouveau mot de passe, atteint via le lien reçu. |
| `src/app/auth/callback/route.ts` | Adapté pour le flux `recovery` en plus du flux existant. |
| `src/lib/i18n.ts` | Nouvelles clés FR/EN ; suppression des clés OTP devenues mortes. |

**Côté Supabase (console, pas de terminal).** Authentication → Providers → Email :
activer « Enable email provider » avec mot de passe, décider si la confirmation
d'email est requise. Point à trancher au moment de faire : confirmation d'email
obligatoire = plus propre, mais ajoute un aller-retour boîte mail à l'inscription.

**Règle de sécurité tenue.** Longueur minimale imposée côté Supabase, pas
seulement dans le formulaire — un contrôle uniquement client-side ne protège rien.

---

## Étape 2 — League publique officielle

**Le principe.** Le code d'invitation ne disparaît pas : il reste le mécanisme des
leagues entre amis. On ajoute à côté une league dont l'adhésion ne demande rien.

**Migration `supabase/028_public_league.sql`.**

1. `alter table leagues add column is_public boolean not null default false`
2. Insertion de la league « Ciné League Officielle » avec `is_public = true`.
3. Trigger sur `auth.users` (ou sur `profiles`) qui insère une ligne
   `league_members` vers la league publique à chaque création de compte.
4. Policies RLS : lecture de la league publique ouverte à tout utilisateur
   authentifié ; l'admin reste seul à créer des séances.

**Question ouverte à trancher à l'étape 2.** Qui anime les séances de la league
publique ? Si personne ne crée de séance, la league est vide et l'ouverture ne
sert à rien. Deux options : administration manuelle par toi, ou une tâche
planifiée qui ouvre une séance par semaine sur un thème pioché dans une liste.

---

## Étape 3 — Vraie page de garde

**Aujourd'hui.** `src/app/page.tsx` ne fait qu'un `redirect()` : personne ne voit
jamais de page d'accueil sans compte.

**Demain.** `/` devient une vitrine publique — pitch, les deux modes de jeu
expliqués en trois vignettes, CTA « Créer un compte » et lien « J'ai déjà un
compte ». Un visiteur déjà connecté est redirigé vers `/leagues` comme avant.
`/accueil` reste la page post-connexion.

**Attention.** Le `matcher` du middleware couvre déjà `/` : rien à changer là,
mais la page doit fonctionner sans session, donc pas de `getUser()` bloquant.

**Deux sens du mot « public », à ne pas confondre.** La page de garde est
lisible sans compte ; la league publique, elle, s'ouvre sans code d'invitation
mais exige un compte. C'est structurel : toutes les policies RLS reposent sur
`auth.role() = 'authenticated'` et `is_league_member()`, et un vote a besoin
d'un `voter_id`. Décision prise : **l'aperçu sur la page de garde est fictif**
(palmarès d'exemple en dur), pour n'ouvrir aucune policy en lecture anonyme.

---

## Étape 4 — Habillage pop & naïf

**Direction.** Le référentiel (planches DearMonday et back-to-school) repose sur
trois ingrédients : formes organiques pleines, contour noir fin dessiné à la
main, petits yeux. À croiser avec la palette v2 déjà en place — bleu `#0e2396`,
corail, sage, jaune — plutôt que d'importer de nouvelles couleurs.

**Méthode.** SVG inline dans un composant `src/components/pop/`, pas d'images
bitmap : ça garde le poids bas, ça suit le thème clair/sombre via les variables
CSS, et ça reste modifiable. Un fichier de formes + un composant `<PopBlob>`
paramétrable (forme, couleur, taille, rotation).

**Où en poser.** Page de garde (fond), écran de login (marges), états vides
(« aucune league », « aucune séance ») — les endroits où l'écran est nu
aujourd'hui. Pas dans les tableaux de scores : le contenu y est déjà dense.

---

## Étape 5 — Backlog : vote en swipe

**Le diagnostic.** Le problème de fond du vote Compétition officielle n'est pas
le CSS, c'est le format : une grille films × catégories affichée d'un bloc ne
peut pas être rendue proprement responsive sur mobile, quoi qu'on bricole. La
page de vote dédiée allait dans le bon sens, mais pas assez loin.

**La direction.** Une catégorie à la fois, plein écran, façon Tinder / carrousel :
on vote, on swipe (ou on tape « suivant »). C'est le pattern le plus fiable sur
mobile pour une série de choix successifs.

**Habillage.** Cartes-tickets swipables, référence visuelle : les tickets
circulus (bandeau perforé, pastille de couleur, code-barres).

Volontairement repoussé après les étapes 1-4 : ça touche la mécanique de vote,
qui est le cœur du jeu, et ça mérite sa propre session.
