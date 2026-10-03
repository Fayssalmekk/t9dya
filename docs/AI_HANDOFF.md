# Passation complète du projet T9DYA

Dernière mise à jour : 2 octobre 2026.

Ce document est le point d’entrée pour toute IA ou tout développeur qui reprend le projet. Il décrit l’état réel du dépôt, ses cinq applications, les règles métier, les données, la sécurité, Android et les décisions déjà prises.

## 1. Ordre de lecture obligatoire

Avant toute modification :

1. Lire entièrement `prompt.md`. Il contient les règles de travail demandées par le propriétaire.
2. Lire ce document jusqu’à la fin.
3. Lire `docs/SETUP.md` pour les opérations manuelles Firebase, Vercel et OpenAI.
4. Lire `docs/ANDROID.md` si le changement concerne Capacitor ou l’APK.
5. Lire uniquement les fichiers de l’application concernée avant d’écrire du code.

Règles importantes héritées de `prompt.md` : ne pas recréer le projet, ne pas casser les données existantes, préserver l’UI actuelle, utiliser `apply_patch` pour les modifications, et ne pas lancer `npm install`, build, lint, serveur, Git ou commandes lentes. Le propriétaire exécute les commandes de validation lui-même. Toute opération manuelle de console doit être ajoutée dans `docs/SETUP.md` ou `docs/ANDROID.md`.

## 2. Vision du produit

T9DYA est un portail privé pour un foyer de deux personnes. Après connexion et sélection/création du foyer, le Hub présente cinq applications :

1. **T9dya** : listes de courses, catalogue, cuisine et historique d’achats.
2. **Budget** : vue financière, dépenses quotidiennes, charges fixes et enveloppes.
3. **Hwayj** : dressing, vêtements et composition de tenues.
4. **S7a ya s7a** : suivi santé, diabète, traitements, stocks et rendez-vous.
5. **Carte** : partage GPS volontaire et position du partenaire sur une carte privée.

Il n’y a plus d’application “Dar/Maison” ni de carte “bientôt disponible” dans le Hub. Ne réintroduire aucun placeholder sans demande explicite.

Le produit est en français. Des traductions historiques existent encore dans `src/i18n/translations.js`, mais le Hub ne propose plus de sélecteur de langue. Ne reconstruire aucun système i18n sans demande.

## 3. Stack et contraintes

- React 19 avec JSX.
- Vite 8.
- React Router 7.
- Tailwind CSS 3 et styles partagés dans `src/styles/index.css`.
- Firebase Authentication Email/Password.
- Cloud Firestore avec cache persistant multi-onglets.
- Vercel pour le site et la fonction serverless `api/ai.js`.
- OpenAI uniquement derrière la fonction serveur.
- Framer Motion pour les transitions.
- Lucide React pour les icônes d’interface.
- Recharts est installé pour les visualisations.
- Vite PWA pour le Web.
- Capacitor 8 pour Android uniquement.
- Node.js minimum : 22.12.
- Firebase Spark : pas de Cloud Functions et pas de Cloud Storage.

Les photos Hwayj et repas sont compressées dans le navigateur puis enregistrées comme Data URLs dans Firestore. Respecter strictement la limite Firestore de 1 MiB par document.

## 4. Entrées principales

- `src/main.jsx` : thème initial, initialisation Capacitor, PWA et montage React.
- `src/native/NotificationCoordinator.jsx` : écoute globale Firestore et synchronisation des notifications Android, quel que soit l’écran ouvert.
- `src/App.jsx` : garde globale Auth/Profil/Foyer et routes des applications.
- `src/apps/registry.js` : registre des cinq applications du Hub.
- `src/context/AuthContext.jsx` : session Firebase, profil `users/{uid}` et foyer.
- `src/services/firebase.js` : initialisation Firebase et cache Firestore persistant.
- `firestore.rules` : véritable barrière d’autorisation des données.
- `api/ai.js` : seule API IA et seul emplacement autorisé pour la clé OpenAI.
- `vercel.json` : fonction, réécriture SPA, cache et en-têtes de sécurité.
- `capacitor.config.json` : conteneur Android.

## 5. Flux d’authentification et de navigation

`AppRoutes` applique les gardes dans cet ordre :

1. Pendant le chargement Auth/Firestore : `LoadingScreen`.
2. Sans utilisateur Firebase : uniquement `/auth`; toute autre URL redirige vers `/auth`.
3. Avec un compte sans document `users/{uid}` : page “Accès privé”.
4. Avec un profil sans foyer : la racine affiche `HouseholdPage`; les autres URL retournent à `/`.
5. Avec profil et foyer : Hub `/`, réglages `/settings`, puis routes `/t9dya/*`, `/budget/*`, `/hwayj/*`, `/s7a/*`.

Les anciens chemins `/list`, `/catalog` et `/history` redirigent vers T9dya. `/charges`, `/envelopes`, `/t9dya/charges`, `/t9dya/envelopes` et `/t9dya/budget` redirigent vers l’application Budget. `/budget` ouvre sa vue globale.

L’application n’a aucun écran d’inscription. Les deux comptes Firebase sont créés manuellement. Un compte Firebase supplémentaire ne peut ni obtenir de profil Firestore, ni appeler l’API IA, car les règles et `ALLOWED_UIDS` fonctionnent en fail-closed.

## 6. Hub et foyer

Fichiers :

- `src/apps/hub/HubPage.jsx`
- `src/apps/hub/AppCard.jsx`
- `src/apps/hub/HubSettingsPage.jsx`
- `src/apps/hub/HealthHubAlerts.jsx`
- `src/services/household.js`

Le Hub affiche le foyer, ses deux membres, les alertes santé et les cinq cartes du registre. Pour ajouter un jour une vraie application, créer son dossier, son composant racine et une entrée activée dans `src/apps/registry.js`.

Les réglages du Hub gèrent :

- nom du foyer ;
- code d’invitation ;
- liste des deux membres ;
- nom affiché, date de naissance et sexe du membre connecté ;
- indicateur diabétique ;
- thème sombre ;
- autorisation des notifications ;
- autorisation GPS, distincte de l’activation du partage ;
- choix détaillé, appareil par appareil, des alertes Android, avec heure configurable pour les rappels quotidiens ;
- déconnexion.

Chaque membre modifie uniquement son propre profil. Les informations du foyer restent visibles aux deux partenaires.

Création d’un foyer : l’identifiant du document est un code `T9DYA-XXXXXXXX`. Le premier membre est écrit dans `members` et `memberProfiles`; le profil utilisateur reçoit `householdId` dans le même batch.

Rejoindre un foyer : le second utilisateur connaît directement le code/document. Les règles permettent seulement le passage de 1 à 2 membres, sans lister les foyers et sans dépasser deux personnes.

## 7. Modèle Firestore global

### Profil utilisateur

Chemin : `users/{uid}`.

Champs attendus :

- `uid`
- `displayName`
- `email`
- `birthDate` au format texte `YYYY-MM-DD` ou vide
- `sex`: `male`, `female` ou vide
- `diabetic`: booléen
- `householdId`
- `updatedAt`

Lecture : propriétaire uniquement. Mise à jour : propriétaire uniquement et uniquement les champs explicitement autorisés par les règles.

### Foyer

Chemin : `households/{householdId}`.

Champs importants :

- `name`
- `inviteCode`
- `members`: 1 ou 2 UID uniques
- `memberProfiles`: map indexée par UID
- `budget`
- `activeListId`
- `lastUsedStore`
- `createdAt`, `updatedAt`

Le document n’est lisible que par un UID présent dans `members`. Les listes de foyers sont interdites. Un membre existant ne peut pas modifier la liste des membres, le code d’invitation ou le profil de son partenaire.

### Sous-collections partagées du foyer

Toutes sont accessibles uniquement aux deux membres du foyer :

- `items`
- `lists`
- `customProducts`
- `charges`
- `chargePayments`
- `envelopes`
- `envelopeTransactions`
- `expenses`
- `purchases`
- `priceHistory`
- `templates`
- `pantry`
- `trips`

Les noms `templates`, `pantry` et `trips` sont réservés dans les règles mais peuvent ne pas avoir d’interface active.

`households/{householdId}/locations/{uid}` contient uniquement la dernière position volontairement partagée par chaque membre : latitude, longitude, précision, cap, vitesse et date de mise à jour. Seul le propriétaire de l’UID écrit ou supprime sa position; les deux membres peuvent la lire.

## 8. Application T9dya

Racine : `src/apps/t9dya/T9dyaApp.jsx`.

Le composant monte `ShoppingProvider`, puis `PlatformShell`. Les pages historiques restent volontairement dans `src/pages` pour éviter une migration risquée.

### Routes

- `/t9dya/list` : accueil des listes et détail d’une liste.
- `/t9dya/catalog` : catalogue et ajout de produits.
- `/t9dya/cuisine` : suggestions de recettes par swipe.
- `/t9dya/history` : historique des achats.
- `/t9dya/settings` : redirection vers les réglages du Hub.

La navigation inférieure contient uniquement Liste, Catalogue, Cuisine et Historique. Toute la gestion financière se trouve dans l’application Budget.

### Logique des listes

Les listes ne sont jamais créées automatiquement. La page principale sépare :

- listes actives en premier ;
- listes terminées grisées, groupées par mois.

Ouvrir une liste affiche ses produits, estimation et mode d’achat. Une liste peut être supprimée. Supprimer une liste active supprime ses items; les achats déjà archivés restent conservés.

Lors d’un ajout depuis le catalogue :

- zéro liste active : demander d’abord de créer une liste ;
- une seule liste active : ajouter automatiquement à celle-ci ;
- deux listes actives ou plus : demander quelle liste utiliser.

Un item peut être proposé, validé, modifié, supprimé, marqué acheté puis démarqué. Marquer acheté crée un achat, met à jour l’historique de prix et conserve le magasin. Terminer une course archive un résumé dans la liste et supprime les items opérationnels; aucune nouvelle liste n’est créée.

Les principales écritures sont dans `src/services/shopping.js`. `ShoppingContext` écoute en temps réel items, listes, produits personnalisés et les 250 derniers achats.

### Catalogue

`src/data/catalog.js` contient catégories, produits génériques, marques et icônes emoji réelles. Les produits personnels créés depuis le catalogue sont persistés dans `customProducts` et partagés entre les deux membres.

### Cuisine Swipe

Fichiers dans `src/features/cuisine` et page `src/pages/CuisineSwipePage.jsx`.

Types : repas, desserts et jus. L’utilisateur swipe les ingrédients disponibles. Le système calcule les recettes compatibles et les ingrédients manquants. Les réponses et statistiques de disponibilité sont dans `localStorage` :

- `t9dya-cuisine-session-v2`
- `t9dya-cuisine-availability-v1`

Les ingrédients souvent disponibles remontent en priorité grâce aux scores locaux. Les bases nécessitant normalement de la farine sont représentées comme produits prêts à l’emploi : pâte à pizza, pain tacos, supports panini, etc. Les ingrédients manquants d’une recette peuvent être ajoutés à une liste existante.

Le catalogue Cuisine couvre aussi les produits pratiques courants au Maroc : préparation pour flan, crème pâtissière et béchamel prêtes, boudoirs, spéculoos, frites, nuggets, chicken rings et légumes surgelés. Les desserts proposent notamment tiramisus, mouhalabias fruitées, kika à la crème, Jawhara express, ghribas, flans froids et douceurs à la fleur d’oranger. Plusieurs recettes possèdent leurs propres étapes détaillées via le neuvième champ facultatif de `makeRecipes`.

## 9. Application Budget

Racine : `src/apps/budget/BudgetApp.jsx`. Elle monte `PlatformProvider` et `ShoppingProvider`, car la vue financière lit aussi les achats enregistrés automatiquement par T9dya. Les pages historiques `ChargesPage` et `EnvelopesPage` restent dans `src/pages`, mais elles ne sont routées que dans Budget.

### Routes Budget

- `/budget/overview` : synthèse du mois, budget restant, catégories et derniers mouvements.
- `/budget/expenses` : journal des dépenses quotidiennes.
- `/budget/charges` : charges fixes et budget courses.
- `/budget/envelopes` : enveloppes et mouvements.

### Dépenses

Les documents `households/{householdId}/expenses/{expenseId}` contiennent montant, motif, note, catégorie, date `spentOn`, source et auteur. Une source peut être le budget T9dya, un compte/carte, des espèces ou une enveloppe.

Quand la source est une enveloppe, `createExpense` débite son solde et écrit simultanément la dépense et un `envelopeTransaction` dans une transaction Firestore. Le solde ne peut pas devenir négatif. Supprimer cette dépense recrédite l’enveloppe et écrit un mouvement d’annulation.

La vue globale additionne séparément les achats T9dya automatiques, les charges marquées payées et les dépenses du journal. Les fonds des enveloppes sont affichés comme argent réservé.

### Charges

`src/services/budget.js` initialise une seule fois des charges par défaut lorsque `budget.plannerVersion < 1`. Chaque charge possède nom, montant, icône, jour d’échéance et statut actif. Les paiements sont enregistrés par mois dans `chargePayments` avec l’ID `${chargeId}_${month}` et peuvent être décochés.

### Enveloppes

Une enveloppe contient nom, icône, couleur, solde, objectif et statut. Alimenter ou retirer utilise une transaction Firestore, empêche un solde négatif et écrit un mouvement avec `balanceAfter`. Une enveloppe ne peut être archivée que si son solde est nul.

## 10. Application Hwayj

Racine : `src/apps/hwayj`.

Hwayj propose trois onglets seulement :

- Dressing : `/hwayj/closet`
- Tenue manuelle/IA : `/hwayj/outfits/new`
- Outfits enregistrés : `/hwayj/outfits`

Routes secondaires : `/hwayj/add`, `/hwayj/item/:itemId`, `/hwayj/outfits/:outfitId`.

Les anciens écrans Calendrier, Stats et Valise existent encore comme fichiers, mais ne sont plus routés ni affichés. Ne pas les remettre dans la navigation sans demande explicite.

### Propriété et changement de profil

`WardrobeContext` gère `ownerId`, `ownerProfile` et `isOwnWardrobe`. Chaque partenaire peut voir le dressing et les outfits de l’autre. Seul le propriétaire peut créer, modifier ou supprimer ses vêtements et tenues. Le bouton flottant d’ajout n’apparaît que sur son propre dressing.

Le sexe provient en priorité du profil de foyer via `getWardrobeGender`. Les noms historiques Fayssal/Salma ne servent que de fallback. L’IA reçoit `male`, `female` ou `neutral` et doit préserver la silhouette correspondante.

### Collections Hwayj

`users/{uid}/clothes/{itemId}` :

- nom, catégorie, sous-catégorie/type précis ;
- couleurs, motif, matière, saisons, styles ;
- prix facultatif ;
- `thumb` ;
- `wearCount`, `lastWornAt` ;
- `status`: `clean`, `dirty` ou `laundry` ;
- `favorite` ;
- timestamps.

`users/{uid}/clothesImages/{itemId}` : image principale Data URL uniquement, chargée à la demande.

`users/{uid}/outfitImages/{outfitId}` : aperçu haute définition d’un look IA, séparé du document `outfits` pour rester sous la limite Firestore. La carte conserve aussi un `previewThumb` léger comme fallback.

`users/{uid}/outfits/{outfitId}` : nom, occasion, saison, mode `manual` ou `ai`, références `items`, aperçu IA éventuel et timestamps.

`users/{uid}/outfitPlans/{YYYY-MM-DD}` : ancien support du calendrier, non exposé dans la navigation actuelle.

Les règles autorisent le partenaire à lire vêtements/images/outfits, mais seul le propriétaire écrit. Les outfit plans restent strictement personnels.

### Ajout d’un vêtement

`AddItemPage` suit trois étapes :

1. photo caméra ou galerie, sans lancer automatiquement GPT ;
2. aperçu de la photo, consignes facultatives, génération puis corrections successives sans perdre la photo ni le résultat précédent ;
3. vérification et édition de tous les tags.

`prepareUpload` réduit immédiatement la photo. L’action IA `enhance` reçoit jusqu’à 600 caractères de consignes facultatives et génère en qualité `high` une image détourée `1024x1536`. Le prompt impose un vêtement complet, droit et strictement de face, reconstruit les parties déjà coupées dans la source et préserve motifs, couleurs, coutures, boutons, poches, col et proportions. `tag` analyse ensuite une image réduite. L’écran montre explicitement la génération en cours puis uniquement le résultat GPT; la photo originale reste en mémoire pour une nouvelle tentative mais ne peut pas être enregistrée comme image finale.

Après `enhance`, `hasSafeTransparentMargins` contrôle les quatre bords. Si le vêtement touche le cadre, une seconde génération demande automatiquement de dézoomer et de reconstruire les extrémités manquantes. En cas d’échec, l’utilisateur peut changer de photo ou relancer GPT.

Le tagging utilise des enums partagés conceptuellement avec les formulaires : 8 catégories fixes, types précis cohérents et palette réelle étendue. GPT retourne 1 à 3 couleurs maximum : exactement une pour une pièce unie, exactement deux quand deux couleurs importantes sont visibles, et trois seulement quand elles sont réellement nécessaires. Les ombres, reflets et petits détails ne comptent pas comme couleurs. `ColorPicker` n’accepte plus de texte libre, limite la sélection à trois couleurs et propose notamment blanc cassé, écru, ivoire, beige clair, taupe, rose poudré, vert sauge, bleu ciel, lilas et terracotta. Catégorie et type précis sont des listes dans l’ajout comme dans la modification.

Les saisons GPT sont normalisées vers exactement `Printemps`, `Été`, `Automne`, `Hiver` avant affichage puis filtrées une seconde fois dans `createClothingItem`. Cela empêche des valeurs invisibles comme `été` ou `Toutes saisons` de s’ajouter aux quatre boutons et de dépasser la limite Firestore. `finalizeImages` garantit aussi une miniature strictement sous la taille autorisée par les règles.

Avant Firestore, `finalizeImages` produit l’image principale et le thumbnail. Le service bloque une image au-dessus de 900 000 caractères et un thumbnail au-dessus de 250 000 caractères.

Les types précis dans `utils/clothingTypes.js` déterminent le placement top, outer, bottom, dress, shoes ou accessory. Cette classification est essentielle pour la composition.

### Dressing et vêtement

Le dressing utilise uniquement les thumbnails afin d’éviter de charger toutes les grandes images. Il propose recherche, filtres et favoris. Le détail charge l’image principale à la demande, permet d’éditer, de changer le statut, de marquer porté, d’ajouter aux favoris et de supprimer avec restauration/undo.

### Composition des tenues

Mode manuel : un haut et un bas, avec swipe horizontal et flèches. Les vestes/manteaux sont inclus dans les hauts. Avant affichage, le navigateur détecte les limites opaques du vêtement, retire visuellement les marges transparentes variables puis le replace dans un canevas fixe propre à son slot. Ce canevas utilise une résolution interne 2x à 3x selon la densité de l’écran et un export WebP haute qualité afin que les vêtements restent nets sur Android. La prochaine pièce est normalisée et décodée avant de démarrer son animation; l’image brute n’est jamais brièvement affichée dans le slot, ce qui évite le saut visuel pendant un swipe. Tous les hauts utilisent ainsi la même échelle et le même point d’ancrage inférieur; tous les bas utilisent la même largeur de référence et le même point d’ancrage supérieur. La jonction et l’espace restent constants pendant les transitions et dans l’aperçu d’enregistrement.

Mode IA : l’utilisateur ajoute de 2 à 4 pièces dans des cases successives. Avant la génération, il peut écrire jusqu’à 600 caractères de consignes facultatives; elles sont enregistrées dans `generationNotes`. Après un résultat, modifier ces consignes conserve l’image et toutes les pièces sélectionnées; le bouton devient « Corriger / régénérer ce look » afin d’itérer sans recommencer. L’action `compose` charge des références jusqu’à 768 px et transmet le nom, type précis, couleurs, motif, matière, genre et consignes. Le prompt impose une vue strictement de face, une marge transparente, la reproduction fidèle des détails et la reconstruction prudente des parties déjà coupées dans la photo source. Il interdit de couper col, manches, ourlets, jambes ou chaussures. Le résultat est généré en `1024x1536`, qualité `high`.

Après chaque génération, `hasSafeTransparentMargins` analyse le canal alpha dans le navigateur. Si la silhouette touche un bord, Hwayj effectue automatiquement une seconde génération avec une instruction de recadrage renforcée. Le résultat haute définition est enregistré dans `outfitImages` et toujours affiché avec `object-contain` dans un cadre portrait. Cette seconde tentative consomme un appel image supplémentaire uniquement quand le contrôle détecte un cadrage insuffisant.

Pour les looks de 2 à 4 pièces, le poids disponible est partagé entre les images avant l’envoi afin qu’une composition de 4 références reste sous la limite JSON de l’API. Les erreurs IA sont traduites en causes lisibles et restent affichées sous le générateur : images trop lourdes ou invalides, crédits/quota, modèle ou clé mal configurés, refus de contenu, délai dépassé, réseau et panne temporaire OpenAI. Le code technique inconnu reste visible sans exposer le message brut du fournisseur.

Les compositions manuelles chargent les images principales avec `ClothingImage` au lieu d’agrandir les miniatures. Les nouveaux vêtements utilisent une image principale jusqu’à 900 px et une miniature de 320 px. Les anciens looks IA qui ne possèdent que leur ancienne miniature de 150 px doivent être régénérés une fois pour obtenir une vraie version haute définition.

Enregistrer ouvre la configuration nom/occasion/saison. Les outfits restent au-dessus de la page Outfits. La duplication d’outfit a été retirée. Les favoris sont possibles sur vêtements et outfits.

## 11. Application S7a ya s7a

Racine : `src/apps/s7a`.

Routes :

- `/s7a/today`
- `/s7a/diabetes`
- `/s7a/medications`
- `/s7a/appointments`

Le profil actif est sélectionné entre les deux membres. Les deux partenaires peuvent consulter et gérer les données santé de l’autre : cette collaboration est volontaire. L’onglet Diabète est masqué lorsque le profil actif n’est pas diabétique.

### Collections santé

- `users/{uid}/healthReadings` : glycémie, unité, tendance, source, note et date.
- `users/{uid}/insulinDoses` : type d’insuline, unités réellement prises, repas, note et date.
- `users/{uid}/healthMedications` : insulines ou compléments, stock, seuil, unité, rappels.
- `users/{uid}/medicationChecks` : prise quotidienne cochée par date.
- `users/{uid}/healthAppointments` : médecin, spécialité, lieu, date, heure, récurrence et rappel.
- `users/{uid}/mealAnalyses` : repas, description, glucides confirmés/plage/confiance, thumbnail et date.

Dans le formulaire repas S7a, la photo et l’estimation GPT sont facultatives. Les champs du nom, des glucides confirmés et de la date restent montés même lorsque la valeur des glucides est temporairement vide, afin de permettre de l’effacer puis de la ressaisir sans fermer la feuille ni perdre la photo. Sans nom, l’enregistrement utilise la description puis « Repas ».
- `users/{uid}/healthWater/{YYYY-MM-DD}` : quantité d’eau quotidienne en millilitres, plafonnée à l’objectif de 2 000 ml.

Les règles Firestore permettent lecture et écriture au propriétaire ou à son partenaire du même foyer. Les valeurs critiques ont des bornes simples : glycémie positive sous 700, insuline de 0 à 200 unités, glucides de 0 à 1000.

### Aujourd’hui

La page résume dernière glycémie, unités de NovoRapid prises aujourd’hui, glucides consommés, hydratation sur un objectif de 2 L, traitements du jour et alertes de stock. La jauge d’eau affiche un liquide animé qui monte avec la quantité enregistrée. Tresiba n’est pas utilisée comme statistique principale quotidienne si elle n’apporte pas d’information utile.

Les traitements peuvent être cochés directement. La progression s’anime comme une récompense et repart vide chaque nouveau jour grâce à une clé de date locale.

### Diabète

NovoRapid et Tresiba sont créées automatiquement pour un profil diabétique. Les images réelles sans fond se trouvent dans :

- `public/novorapid.png`
- `public/tresiba.png`

Le stock estime les unités restantes à partir de 300 unités par stylo, du nombre de stylos et de l’historique des injections. C’est une approximation visuelle, jamais une décision médicale.

L’application enregistre uniquement la dose réellement décidée et prise. Elle ne recommande jamais une dose. Cette règle de sécurité ne doit jamais être supprimée.

La glycémie accepte mg/dL ou mmol/L. Le journal réunit glycémies, doses et repas et permet de supprimer une entrée. L’action Eau ouvre un curseur de 0 à 2 000 ml par pas de 100 ml, avec raccourcis de 250 ml; un document unique par date est mis à jour pour éviter les doublons.

### Repas avec IA

La photo est compressée dans le navigateur. L’action serveur `meal` estime une valeur centrale de glucides, une plage, une confiance et des hypothèses. L’utilisateur confirme/modifie les glucides avant sauvegarde. Le nombre de glucides est visuellement prioritaire sur le titre du repas.

L’IA ne doit jamais calculer ou suggérer une dose d’insuline. Le prompt serveur et l’interface le rappellent.

### Traitements et pharmacie

Un traitement possède un stock, une heure de rappel et une fréquence en jours (quotidienne, tous les 2, 3, 7, 15 ou 30 jours). La date de création sert de premier jour de prise. Seuls les traitements prévus pour la date courante apparaissent dans la routine du jour et déclenchent les rappels; les anciens traitements sans fréquence restent quotidiens. Les prises prévues sont cochables/décochables. Si un stock atteint son seuil et qu’il existe exactement une liste de courses active, S7a ajoute automatiquement le médicament à cette liste avec une catégorie pharmacie. Avec zéro ou plusieurs listes, aucune liste n’est choisie arbitrairement.

### Rendez-vous

Les rendez-vous peuvent être ponctuels ou récurrents tous les 1, 3, 6 ou 12 mois. Terminer un rendez-vous récurrent avance sa date; terminer un rendez-vous non récurrent le supprime. Le délai de rappel est configurable.

## 11 bis. Application Carte

Racine : `src/apps/map`. Route : `/map`.

Chaque téléphone demande l’autorisation GPS séparément. L’autorisation seule ne publie rien : le membre doit activer explicitement « Partager ma position en direct ». `LocationCoordinator` conserve ensuite le suivi pendant la navigation dans les autres applications tant que le processus WebView reste actif. Il limite les écritures Firestore à une mise à jour toutes les douze secondes.

La carte utilise les tuiles OpenStreetMap et affiche les deux marqueurs, la précision, la distance et la date de dernière mise à jour. Une position de plus de 90 secondes est marquée comme ancienne. Arrêter le partage supprime immédiatement `households/{householdId}/locations/{uid}` et le partenaire ne peut ni écrire ni supprimer la position de l’autre.

Cette version ne demande volontairement pas l’autorisation Android de localisation permanente en arrière-plan et ne lance pas de service natif continu. Android peut donc suspendre les mises à jour quand l’application reste en arrière-plan ou est arrêtée; la carte le signale grâce à l’âge de la position.

## 12. API IA et sécurité

Fichier unique : `api/ai.js`.

Actions autorisées :

- `enhance`
- `combine`
- `compose`
- `tag`
- `suggest`
- `meal`

### Ordre de protection d’une requête

1. En-têtes de sécurité et `Cache-Control: no-store`.
2. Origine autorisée : même origine Vercel, `APP_ORIGIN` ou Capacitor `https://localhost`.
3. Méthode `POST` et préflight `OPTIONS` uniquement.
4. `Content-Type: application/json`.
5. Corps objet et taille réelle sous 1 600 000 octets, sans faire confiance uniquement à `Content-Length`.
6. Header `Authorization: Bearer <Firebase ID token>` obligatoire.
7. Vérification du token par Firebase Auth REST `accounts:lookup`.
8. Refus des comptes désactivés et des sessions antérieures à `validSince`.
9. UID obligatoirement présent dans `ALLOWED_UIDS`.
10. Action dans la liste blanche.
11. Validation des images et entrées propres à l’action.

Le préflight `OPTIONS` reste volontairement accessible sans authentification : c’est nécessaire au navigateur et ne déclenche aucun appel OpenAI. Toutes les actions réelles exigent le token Firebase.

Il n’existe aucun quota interne quotidien ou par UID sur les actions IA. Les appels restent soumis uniquement aux limites techniques de taille, aux protections d’authentification et aux éventuelles limites du compte OpenAI.

Le serveur ne journalise jamais les images, tokens ou clés. La clé OpenAI n’est jamais importée dans React.

### Variables serveur privées

- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_VISION_MODEL`
- `OPENAI_TEXT_MODEL`
- `ALLOWED_UIDS`
- `FIREBASE_API_KEY`
- `APP_ORIGIN`

Elles vivent dans Vercel et dans `.env.local` pour le middleware local. Elles ne doivent jamais porter le préfixe `VITE_`.

### Variables client Firebase

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

La configuration Web Firebase est publique par conception; la sécurité repose sur Auth et les règles Firestore, jamais sur le secret de cette configuration.

### Appel client

Les services Hwayj et S7a récupèrent `auth.currentUser.getIdToken()` puis envoient le Bearer token. `src/services/api.js` utilise `/api/ai` sur le Web et l’origine Vercel configurée dans `.env.android.local` dans l’APK.

Le Hub affiche `APP_VERSION` depuis `src/version.js`. Cette valeur est volontairement manuelle et doit être modifiée avant chaque push de production.

## 13. Règles Firestore et confidentialité

Principes :

- refus global par défaut en fin de fichier ;
- aucun accès anonyme ;
- utilisateur limité à son propre profil ;
- foyer limité aux UID membres ;
- maximum deux membres ;
- aucune requête listant tous les foyers ;
- garde-robe lisible par partenaire, modifiable par propriétaire ;
- santé volontairement collaborative entre partenaires ;
- champs principaux et tailles d’images validés ;
- aucun document utilisateur créé depuis le client ; les deux profils autorisés doivent exister.

Après toute modification, ajouter les instructions de déploiement dans `docs/SETUP.md`. Ne jamais assouplir le catch-all `allow read, write: if false`.

## 14. Android/Capacitor

Le Web reste la source de vérité. Android emballe exactement le build React du même dépôt.

Fichiers :

- `capacitor.config.json`
- `src/native/capacitor.js`
- `src/native/notifications.js`
- `src/native/NotificationCoordinator.jsx`
- `assets/logo.svg`
- `docs/ANDROID.md`

Fonctions natives déjà branchées :

- barre d’état et thème ;
- redimensionnement natif du clavier ;
- bouton retour ;
- ouverture de la bonne route après toucher une notification ;
- rappels locaux traitements/rendez-vous, stocks faibles, courses et résumé quotidien ;
- alertes de demandes de courses et de nouveaux produits reçues depuis Firestore ;
- désactivation de l’enregistrement PWA dans le conteneur natif.

Les rappels Android sont non exacts afin de ne pas demander la permission sensible d’alarmes exactes. Ils peuvent être légèrement décalés par le système. Le coordinateur global synchronise les rappels des deux profils dès qu’il reçoit les données Firestore, même si l’utilisateur n’ouvre pas le Hub.

Firebase Cloud Messaging n’est pas encore installé. Les événements du partenaire produisent une notification dès que l’APK reçoit la mise à jour Firestore, ou à sa prochaine ouverture. FCM restera nécessaire pour réveiller instantanément une application complètement arrêtée.

Le dossier `android/` n’est créé qu’après la commande manuelle `npm run android:add`. Toutes les étapes sont dans `docs/ANDROID.md`.

## 15. Design system et UX

Le design est mobile-first et utilise :

- fond `bg-canvas` ;
- cartes `bg-surface` ;
- texte `text-ink`, secondaire `text-muted` ;
- rayons généreux `rounded-2xl`, `rounded-[1.75rem]`, `rounded-[2rem]` ;
- ombre partagée `shadow-card` ;
- cibles tactiles de 44 px minimum ;
- navigation fixe tenant compte de `env(safe-area-inset-bottom)` ;
- `min-h-dvh` pour les écrans mobiles ;
- scrollbars fines définies globalement ;
- contraste sombre via la classe `.dark` sur `<html>`.

Couleurs par application :

- T9dya : teal/emerald.
- Hwayj : violet/fuchsia.
- S7a : rose, avec orange pour NovoRapid, vert pour Tresiba et bleu pour glycémie.

Ne pas remplacer les icônes de produits ou les images réelles des stylos par des pictogrammes génériques. Préserver les transitions, `object-contain` pour les vêtements détourés et les proportions mobiles.

## 16. PWA, cache et page blanche

`vite-plugin-pwa` utilise `autoUpdate`. `src/main.jsx` :

- enregistre le service worker uniquement sur le Web ;
- vérifie les mises à jour régulièrement ;
- recharge après changement de contrôleur ;
- intercepte les erreurs de chunks dynamiques pour réparer l’application ;
- évite toute logique service worker dans Capacitor.

Ne pas retirer ce mécanisme : il résout les pages blanches dues à un ancien bundle mobile sans forcer l’utilisateur à vider son cache.

## 17. Fichiers à ne jamais committer

- `.env`
- `.env.local`
- `.env.*.local`
- clés OpenAI
- tokens Firebase
- fichiers `.jks` ou `.keystore`
- `keystore.properties`
- `android/local.properties`
- répertoires de build Android

Le `.gitignore` contient déjà ces protections. Vérifier malgré tout avant chaque commit.

## 18. Validation demandée au propriétaire

L’IA ne doit pas exécuter ces commandes à sa place. Après un changement, indiquer uniquement celles qui sont pertinentes :

```powershell
npm run lint
npm run build:check
npx firebase deploy --only firestore:rules
```

Pour Android, suivre uniquement `docs/ANDROID.md`.

Scénarios de régression minimaux :

1. Les deux comptes peuvent se connecter et voir le même foyer.
2. Un troisième compte reste bloqué.
3. Un appel IA sans Bearer token retourne 401 et ne consomme aucun crédit OpenAI.
4. Un UID connecté mais absent de `ALLOWED_UIDS` retourne 403.
5. Chaque partenaire voit les données partagées T9dya.
6. Hwayj affiche le dressing du partenaire mais interdit ses modifications.
7. S7a autorise la gestion du partenaire et masque Diabète pour un profil non diabétique.
8. Ajouter/acheter/démarquer/supprimer un produit fonctionne.
9. Deux listes actives déclenchent le choix de liste; une seule est automatique.
10. Images Hwayj et repas restent sous les limites Firestore.
11. La version web se met à jour sans page blanche.
12. L’APK appelle l’API Vercel, gère le clavier, le retour et les rappels locaux.
13. La Carte refuse toute écriture sur la position du partenaire, distingue une position ancienne du direct et supprime le document du membre quand il arrête le partage.

## 19. Pièges connus

- PowerShell peut afficher les accents UTF-8 sous forme de caractères incorrects alors que le fichier est valide. Ne jamais lancer une réécriture globale d’encodage sans vérifier dans l’éditeur ou le navigateur.
- Le build Vite local peut être bloqué par Windows Application Control. Ne pas tenter de contourner la politique de la machine.
- `package-lock.json` doit être mis à jour par le propriétaire après l’ajout récent de Capacitor via `npm install`.
- Le rate limit IA en mémoire n’est pas distribué entre instances Vercel.
- Les Data URLs augmentent la taille d’environ 33 %; conserver les gardes actuelles.
- Les notifications Web ouvertes ne remplacent pas FCM.
- Les règles Firestore ne sont actives qu’après déploiement explicite.
- Ne jamais faire confiance à une garde React pour la sécurité : toute autorisation réelle doit être répétée dans Firestore ou l’API serveur.

## 20. Priorités futures déjà identifiées

À faire seulement sur demande :

1. Firebase Cloud Messaging pour notifications entre les deux téléphones.
2. Test automatisé des règles Firestore avec l’émulateur et comptes propriétaire/partenaire/intrus.
3. Rate limit persistant côté serveur si le coût IA augmente.
4. Firebase App Check pour réduire l’abus direct de Firestore/API, après étude du flux Capacitor.
5. Génération et distribution du premier APK signé selon `docs/ANDROID.md`.

Ne pas créer de nouvelle application, restaurer Moments/Dar, ajouter Calendrier/Valise/Stats dans Hwayj ou élargir les données santé sans une demande explicite du propriétaire.
