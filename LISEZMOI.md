# Site du Racing Nanterre Rugby

## Comment c'est organisé

| Dossier / fichier | Contenu | Qui y touche ? |
|---|---|---|
| `content/` | Tous les textes du site : actus, catégories, coachs, matchs, comité… | L'équipe, via l'administration |
| `photos/` | Toutes les photos (et le logo) | L'équipe, via l'administration |
| `index.html` | La mise en page et le design | Personne (sauf grosse évolution) |
| `.pages.yml` | Les formulaires de l'administration | Personne (sauf ajout d'un champ) |

## Mise en ligne (à faire une seule fois)

1. **Créer un dépôt GitHub** (gratuit) et y mettre tout le contenu de ce dossier.
   Idéalement sur un compte « club » plutôt qu'un compte perso, pour que le site ne dépende pas d'une seule personne.
2. **Activer GitHub Pages** : dans le dépôt → *Settings* → *Pages* → *Source : **GitHub Actions***.
   Puis *Actions* → « Mise en ligne du site » → *Run workflow*. Le site est en ligne en 1 à 2 minutes,
   et se remet à jour tout seul à chaque modification.
3. **Nom de domaine** : dans *Settings* → *Pages* → *Custom domain*, saisir `www.racing-nanterre-rugby.com`,
   puis chez le gestionnaire du nom de domaine, faire pointer le domaine vers GitHub Pages (la page d'aide GitHub indique les réglages DNS).
4. **Brancher l'administration** : aller sur https://app.pagescms.org, se connecter avec le compte GitHub, choisir le dépôt.
   Les menus (Actualités, Compétitions, Catégories…) apparaissent automatiquement.

## Donner l'accès aux bénévoles

Dans Pages CMS, ouvrir le dépôt → *Collaborateurs* → inviter la personne **par e-mail**.
Elle n'a **pas besoin de compte GitHub** : elle reçoit un lien, se connecte, et peut modifier les contenus et les photos.
Elle ne peut pas casser le design ni gérer les autres accès.

## Au quotidien

- **Publier une actu** : *Actualités* → *Ajouter* → titre, date, photo, texte → *Enregistrer*.
- **Saisir un résultat** : *Compétitions* → l'équipe → le match → remplir les deux scores → *Enregistrer*.
- **Changer un coach ou sa photo** : *Catégories* → la catégorie → *Encadrement*.
- **Ajouter un album** : *Photothèque* → *Ajouter* → glisser les photos.

Chaque enregistrement met le site à jour tout seul en 1 à 2 minutes.
Tout est historisé : une erreur peut toujours être annulée en revenant à une version précédente.

## Conseils photos

- Format paysage de préférence, environ 1920 px de large maximum (au-delà, le site devient lent).
- Noms de fichiers simples, sans espace ni accent : `m10-tournoi-dec.jpg`.
- Pour les mineurs, s'assurer d'avoir l'autorisation de diffusion des parents.

## Matchs et classements : mise à jour automatique depuis la FFR

Chaque compétition a un lien vers sa page sur le site de la FFR (Mon Club House).
Un robot (fichier `scripts/maj-ffr.mjs`) va y lire les matchs, scores et classements, puis met le site à jour :

- **automatiquement chaque lundi et jeudi matin** ;
- **à la demande** : dans l'administration, menu *Compétitions* → bouton **🔄 Mettre à jour depuis la FFR**
  (ou sur GitHub : *Actions* → « Mise à jour FFR » → *Run workflow*).

La date de la dernière mise à jour s'affiche sur la page Compétitions.
Si le robot n'arrive pas à lire une compétition (site FFR modifié, panne…), il ne touche à rien :
les données précédentes restent affichées, et le journal d'erreur est visible dans l'onglet *Actions* de GitHub.

Nouvelle saison : remplacer les liens FFR de chaque compétition (menu *Compétitions*, champ « Lien de la compétition sur le site FFR »),
la page de l'équipe se trouve sur monclubhouse.ffr.fr → club → *Équipes*.
