# Ciné League — spec de refonte visuelle (v2)

Direction validée : fond clair minimal, bleu `#0E2396`, accents corail / sage / periwinkle / jaune, typo Oswald + Poppins, icônes au trait (zéro emoji), motif de ticket perforé conservé mais épuré.

Ce document traduit les mockups en valeurs exploitables directement dans `globals.css`, `layout.tsx` et les composants (`TicketStub`, badges, boutons, tabs...).

## 1. Tokens couleur

À remplacer dans `src/app/globals.css`. Cette direction est pensée pour un fond clair : on bascule le thème clair en défaut et on garde le sombre en option secondaire (voir note en fin de section).

```css
:root {
  color-scheme: light;

  --color-bg: #EDEBE9;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F5F4F2;
  --color-border: #D8D5D1;
  --color-muted: #6B6B74;
  --color-text: #1C1C22;       /* remplace --color-cream */

  --color-primary: #0E2396;        /* remplace --color-gold */
  --color-primary-tint: #7294F4;   /* remplace --color-gold-bright — periwinkle, hover/tint */

  --color-coral: #F5566E;
  --color-coral-ink: #A32C45;
  --color-sage: #AACE89;
  --color-sage-ink: #4C7A34;
  --color-yellow: #F2D366;
  --color-yellow-ink: #8A6A10;

  --color-flesh: #7294F4;      /* hover des boutons "Créer" — periwinkle plutôt que chair */
  --color-flesh-ink: #0E2396;

  --background: var(--color-bg);
  --foreground: var(--color-text);
}
```

Rôles d'usage :

| Rôle | Token | Usage |
|---|---|---|
| Marque / actions principales | `--color-primary` | Titres Oswald, boutons primaires, tabs actifs |
| Hover / tint clair | `--color-primary-tint` | Hover boutons, badge "en cours" |
| Urgence / vote | `--color-coral` + `--color-coral-ink` | Statut "vote", erreurs restent en rouge système séparé |
| Terminé / validé | `--color-sage` + `--color-sage-ink` | Statut "clôturé", indices confirmés, succès |
| Ciné'Files / découverte | `--color-yellow` + `--color-yellow-ink` | Badge mode Ciné'Files, indices partiels |

Le clair est désormais le thème par défaut ; le sombre passe en option via `data-theme="dark"` (voir section 7).

## 2. Typographie

`layout.tsx` — remplacer Bebas Neue et Inter :

```ts
import { Oswald, Poppins } from "next/font/google";

const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["600", "700"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600"] });
```

`globals.css` :

```css
body { font-family: var(--font-poppins), ui-sans-serif, sans-serif; }
.font-display { font-family: var(--font-oswald), ui-sans-serif, sans-serif; text-transform: uppercase; letter-spacing: 0.02em; }
```

IBM Plex Mono est retiré : les codes d'invitation et libellés de languette passent en Poppins 600, majuscules, `letter-spacing: 0.04em` — plus doux, cohérent avec le reste.

Échelle :

| Usage | Style |
|---|---|
| Titre héro (accueil) | Oswald 700, 40px, `--color-primary` |
| Titre de page (ligue, round) | Oswald 700, 28px |
| Titre de section | Oswald 600, 18–20px |
| Corps de texte | Poppins 400, 14px, `--color-text` |
| Texte secondaire | Poppins 400, 13px, `--color-muted` |
| Bouton / label | Poppins 600, 14px |
| Code / languette ticket | Poppins 600, 11px, uppercase, tracking 0.04em |

## 3. Composants

**Bouton primaire** — `bg: var(--color-primary)`, texte blanc, `border-radius: 10px`, padding `10px 16px`, hover → `background: var(--color-primary-tint)`.

**Bouton secondaire/ghost** — fond blanc, `border: 1px solid var(--color-border)`, texte `--color-text`.

**TicketStub** — conserver la structure actuelle (zone principale + languette séparée par un trait pointillé avec 2 encoches rondes couleur du fond), mais :
- fond `--color-surface` (blanc), bordure `1px solid var(--color-border)`, radius `10px` (au lieu du fond sombre/bordure `--color-border` actuelle)
- la couleur de la languette (`border-left` + texte) porte le code couleur de statut : periwinkle = en cours, corail = vote, sage = clôturé/trouvé, jaune = mode Ciné'Files — c'est la réponse directe au retour produit sur le manque de code couleur entre "délai écoulé" et "clôture dans"
- texte de la languette en Poppins 600 11px uppercase, plus les deux encoches inchangées

**Badge/chip** — `border-radius: 6px`, padding `4px 8px`, fond = teinte accent à 15–18% d'opacité, texte = variante "ink" foncée du même accent (jamais le texte en noir brut sur fond coloré).

**Tabs** (Séances/Membres/Classement) — soulignement 2px `--color-primary` sur l'onglet actif, texte muted sinon. Sous-onglets (En cours/Archives) en pilule pleine `--color-primary` sur fond blanc.

**Champ de formulaire** — fond blanc, `border: 1px solid var(--color-border)`, `border-radius: 8px`, placeholder en `--color-muted`.

**Avatar** — cercle 28px, initiales blanches 11px 600, fond tourné parmi periwinkle/corail/sage/jaune (hash déterministe sur l'id utilisateur pour la constance d'un écran à l'autre).

## 4. Icônes — remplacement des emojis

`lucide-react` est déjà une dépendance (`Ticket` est utilisé dans `LoginForm`). On l'utilise pour tout remplacer, taille 14–16px, couleur héritée (`--color-primary` en général, `--color-muted` en secondaire) :

| Emoji actuel | Icône lucide-react | Contexte |
|---|---|---|
| 🎟️ | `Ticket` | Marque, écran de connexion |
| 🏆 | `Trophy` | Badge mode "Compétition officielle" |
| 🔎 | `Search` | Badge mode "Ciné'Files", devinette |
| 🎬 | `Clapperboard` (ou `Film`) | Ligne de film soumis/proposé |
| ✅ | `Check` | Soumission/vote/indice confirmé |
| ⏳ | `Clock` | En attente, compte à rebours |
| ⭐ / ★ | `Star` | Classement, gagnant |
| ✗ | `X` | Critère non validé (feedback Ciné'Files) |

Les indicateurs "qui a soumis / qui a voté" passent d'emoji à une simple coche (`Check`, sage) ou un texte muted "en attente" — plus de ⏳ répété partout, plus discret.

## 5. Notes par écran

- **Connexion / code** : remplacer le cadre sombre par le champ blanc bordé ; le bouton reste `--color-primary` plein.
- **Mes ligues** : chaque ticket de ligue garde une languette periwinkle par défaut (pas de sens fonctionnel au choix de couleur ici, juste variation visuelle) — au contraire, sur la page d'une ligue, la couleur de languette DOIT porter le statut du round (cf. composant TicketStub ci-dessus).
- **Vote** : le film sélectionné passe en bordure `--color-primary` 1.5px (au lieu du fond `--color-gold`/10 actuel) pour rester sobre sur fond clair.
- **Ciné'Files, feedback** : les chips indice reprennent exactement le code sage/jaune/gris déjà utilisé dans les mockups — correspond à la demande produit d'afficher toutes les contradictions (décennie ET année) avec un code couleur cohérent, pas juste un statut binaire.
- **Résultats** : distinguer visuellement gagnant (bordure/fond sage) d'ex-aequo (texte muted "ex-aequo") sans effet de médaille ou de confettis — rester minimal.

## 6. Décisions ouvertes

- Nom définitif du token `--color-flesh` — gardé pour compatibilité avec le code existant mais sa valeur change de sens (chair → periwinkle) ; à renommer en `--color-primary-tint` si un refactor plus large est fait en même temps.

## 7. Mode sombre

Même palette d'accents (corail/sage/periwinkle/jaune), fond et surfaces assombris, primaire éclairci pour rester lisible sur fond sombre. À activer via `data-theme="dark"` sur `<html>` (logique déjà en place dans `layout.tsx`, à inverser puisque le clair devient le défaut) :

```css
:root[data-theme="dark"] {
  color-scheme: dark;

  --color-bg: #0B0D18;
  --color-surface: #14172B;
  --color-surface-alt: #1C2038;
  --color-border: #2B2F4A;
  --color-muted: #8890A8;
  --color-text: #ECEDF3;

  --color-primary: #7294F4;         /* périwinkle : le bleu #0E2396 devient trop sombre sur fond noir */
  --color-primary-tint: #0E2396;    /* le bleu profond passe en variante tint/hover */

  --color-coral: #F5566E;
  --color-coral-ink: #FBC3CC;       /* ink s'éclaircit sur badge foncé au lieu de s'assombrir */
  --color-sage: #AACE89;
  --color-sage-ink: #DCEBC9;
  --color-yellow: #F2D366;
  --color-yellow-ink: #F7E6B0;

  --color-flesh: #0E2396;
  --color-flesh-ink: #ECEDF3;
}
```

Règle de contraste : en clair, le texte sur badge coloré utilise la teinte "ink" foncée (ex. `--color-sage-ink` `#4C7A34`) ; en sombre, les mêmes badges gardent leur fond `--color-*` mais le texte passe sur une variante claire (ex. `#DCEBC9`) — sinon le texte foncé devient illisible sur fond sombre. Prévoir ces deux jeux de valeurs "ink" plutôt qu'un seul.

Le composant `ThemeToggle` existant peut rester tel quel, seule la valeur par défaut change (clair au premier chargement, sombre en opt-in via `localStorage`).
