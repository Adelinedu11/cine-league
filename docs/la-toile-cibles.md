# La Toile — première réserve de cibles

Trente personnalités pour démarrer, registre **grand public assumé**. On vérifie
que le jeu est jouable avant de le rendre pointu ; on corsera ensuite.

Trente cibles = un mois. C'est le bon horizon : si personne ne revient au bout
d'un mois, on aura économisé les trois cent trente-cinq suivantes.

**Les identifiants TMDB ne sont pas remplis ici volontairement.** Les inventer
serait la meilleure façon d'injecter des erreurs invisibles dans la base : ils
seront résolus par script via `/search/person`, puis vérifiés à l'œil.

---

## Critères de validation automatique

Avant d'admettre une cible dans la réserve, le script doit vérifier :

1. **Au moins 8 films** au générique, sinon le graphe est trop maigre pour que
   les essais mordent.
2. **Au moins 30 collaborateurs distincts** dans le périmètre retenu (casting
   principal, réalisation, scénario, musique) — c'est ce qui garantit qu'un
   joueur qui tâtonne finira par toucher quelque chose.
3. **Une amorce disponible** : au moins un film ne contenant pas la cible et ne
   partageant avec elle **qu'une seule** personne. Sans amorce valide, la cible
   est écartée.
4. **Métier renseigné** dans TMDB (`known_for_department`), pour l'indice de
   départ.

Une cible qui échoue à l'un de ces tests ne doit pas être programmée. Mieux vaut
une réserve de vingt-quatre cibles solides que trente dont six cassent la partie
du jour.

---

## Réalisatrices et réalisateurs

| Nom | Note |
| --- | --- |
| Steven Spielberg | Filmographie immense, collaborateurs très identifiables. Cible d'ouverture idéale. |
| Quentin Tarantino | Acteurs fétiches nombreux et reconnaissables. Très jouable. |
| Martin Scorsese | De Niro et DiCaprio le trahissent vite — plutôt facile. |
| Tim Burton | Depp et Bonham Carter : sans doute la cible la plus facile de la liste. |
| Christopher Nolan | Michael Caine, Cillian Murphy, Tom Hardy. Facile. |
| Wes Anderson | Testé à la main : trouvé en 4 essais sans amorce. |
| Ridley Scott | Testé à la main : trouvé en 6 essais avec amorce. |
| James Cameron | Peu de films mais très connus. Attention au critère des 8 films. |
| Pedro Almodóvar | Cruz et Banderas. Facile pour qui connaît, opaque sinon. |
| Luc Besson | Bon ancrage français, casting très reconnaissable. |
| Jean-Pierre Jeunet | Tautou, Kassovitz, Pinon. Excellente cible française. |
| Sofia Coppola | Filmographie plus courte — vérifier le seuil de collaborateurs. |
| Céline Sciamma | Haenel et Merlant. Plus cinéphile que grand public : à surveiller. |
| Alfred Hitchcock | Graphe ancien, collaborateurs peu connus des jeunes joueurs. **Difficile.** |
| Agnès Varda | Beaucoup de documentaire, casting peu identifiable. **À tester avant d'admettre.** |

## Actrices et acteurs

| Nom | Note |
| --- | --- |
| Meryl Streep | Carrière très longue, énormément de portes d'entrée. |
| Tom Hanks | Idem, et très grand public. |
| Leonardo DiCaprio | Scorsese et Nolan le rendent rapide à cerner. |
| Denzel Washington | Solide, filmographie lisible. |
| Samuel L. Jackson | Attention : Marvel le connecte à énormément de monde, ce qui peut brouiller. |
| Scarlett Johansson | Même réserve Marvel. |
| Cate Blanchett | Très bonne cible, registre varié. |
| Marion Cotillard | Ancrage français et international. Excellente cible. |
| Jean Dujardin | Très grand public en France. |
| Audrey Tautou | Filmographie plus courte — vérifier le seuil. |
| Omar Sy | Grand public, filmographie récente. |
| Vincent Cassel | Français et international, beaucoup de ponts. |
| Isabelle Huppert | Filmographie énorme mais plus cinéphile. |
| Catherine Deneuve | Idem : immense, mais le graphe penche vers le cinéma d'auteur. |
| Juliette Binoche | Bon équilibre entre les deux mondes. |

---

## Réserves à garder en tête

**L'effet Marvel.** Samuel L. Jackson et Scarlett Johansson sont connectés à des
dizaines d'acteurs par un seul univers de films. Le risque n'est pas qu'ils
soient trop faciles, c'est que **presque tout essai renvoie une connexion**, ce
qui rend le thermomètre inutile. À observer sur les premières parties : si le
symptôme se confirme, il faudra soit les écarter, soit plafonner le nombre de
personnes renvoyées par essai.

**Le biais de génération.** Hitchcock et Varda ont des collaborateurs que les
joueurs de moins de trente ans ne reconnaîtront pas. Ce n'est pas une raison de
les exclure — c'est une raison de ne pas les programmer en première semaine.

**Ordre de programmation.** Commencer par les plus faciles : Tim Burton,
Christopher Nolan, Tom Hanks. Un joueur qui échoue le premier jour ne revient
pas le deuxième.
