# Site Web — Pastorale Étudiante de Louvain-la-Neuve (`@pastoralelln`)

Site officiel de **La Paroisse Étudiante de Louvain-la-Neuve (Pastorale Étudiante LLN)**, inspiré par l'ergonomie de la Paroisse Étudiante de Toulouse et construit avec la charte graphique officielle d'Instagram [`@pastoralelln`](https://www.instagram.com/pastoralelln/).

---

## 📁 Structure du projet (Zéro outil de build requis)

Le site est conçu pour être **100 % autonome, rapide et maintenable sans dépendance complexe** (ni Node.js, ni framework lourd susceptible de casser dans 2 ans) :

- [`index.html`](index.html) : Structure HTML5 sémantique avec les 4 vues hybrides (**Accueil**, **Agenda & Horaires**, **Galerie Photos**, **Les 11 Kots**) et les modales interactives (**Parcours "Je veux..."**, **Lightbox Photos**, **Espace ComKot Studio**).
- [`styles.css`](styles.css) : Charte graphique complète `@pastoralelln` :
  - Rouge Cramoisi (`#D61C31`) & Bordeaux ombre portée (`#940531`)
  - Dégradé chaud Jaune-Orange (`#FFE169` → `#FF8C42`) des visuels *Messe des Étudiants*
  - Filigrane du clocher de l'Église Saint-François (`U` + croix blanche)
  - Cartes blanches festonnées de *L'Agenda de la Semaine*
  - Typographies : `Montserrat` (titres uppercase), `Cormorant Garamond` (accents serif), `Caveat` (accents manuscrits jaunes), `Plus Jakarta Sans` (texte).
- [`data.js`](data.js) : Toutes les données par défaut du site (Messe du mercredi, Agenda de la semaine, Événements, Albums Photos, les 11 Kots chrétiens de LLN, et l'Équipe « La Pastèque » & CPE).
- [`app.js`](app.js) : Routeur de vues, filtres dynamiques, export calendrier `.ics`, Lightbox plein écran, compresseur d'images HTML5 Canvas (WebP/JPEG) et synchronisation Cloud Supabase + sauvegarde locale.
- [`assets/`](assets/) : Logo vectoriel [`logo-pasto-lln.svg`](assets/logo-pasto-lln.svg) et vraies photos de la Pastorale Étudiante LLN.

---

## 🔒 Comment utiliser l'Espace ComKot (Ajouter des photos & événements)

1. Cliquez sur le bouton **`🔒 Espace ComKot`** en haut à droite (ou dans le pied de page).
2. Entrez le code d'accès ComKot (par défaut : **`pasto1348`**).
3. Choisissez l'un des 5 onglets :
   - **1. Messe & Agenda de la Semaine** : Changez en 10 secondes quel Kot prépare la Messe du mercredi (ex. *Le Calleg*, *La Ribambelle*, *Foyer St-Paul*) et mettez à jour les créneaux du lundi au dimanche.
   - **2. Prochains Événements** : Ajoutez un événement avec affiche/image (compressée automatiquement par le navigateur).
   - **3. Albums Photos** : Sélectionnez plusieurs photos d'un coup depuis un téléphone ou un ordinateur. Elles sont automatiquement redimensionnées et compressées en WebP léger.
   - **4. Kots & Équipe** : Mettez à jour la liste des kots ou des membres du CPE en début d'année académique.
   - **5. Cloud Sync & Sauvegarde** :
     - **Option A (Cloud temps réel gratuit avec Supabase)** : Créez un projet gratuit sur [supabase.com](https://supabase.com), exécutez le petit script SQL affiché dans l'onglet 5, puis collez l'URL et l'`anon key`. Toutes les modifications du ComKot seront immédiatement visibles par tous les visiteurs !
     - **Option B (Statique 100 % gratuit sur GitHub Pages / Netlify)** : Cliquez sur **« Télécharger le fichier `data.js` mis à jour »** et remplacez [`data.js`](data.js) dans le dossier du site.
