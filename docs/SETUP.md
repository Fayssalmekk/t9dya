# Configuration de la plateforme

Pour installer la même plateforme comme application privée sur vos téléphones Android, suivez le guide détaillé [ANDROID.md](./ANDROID.md).

Les secrets serveur ne doivent jamais être ajoutés à Git ni préfixés par `VITE_`.

## Sécurité avant chaque déploiement

1. Firebase Console → Authentication → Sign-in method : gardez uniquement Email/Password et désactivez tous les fournisseurs inutilisés.
2. Firebase Console → Authentication → Users : vérifiez qu’il existe uniquement les deux comptes attendus; l’application ne contient aucun écran d’inscription.
3. Vercel → Project → Settings → Environment Variables : mettez les deux UID exacts, séparés par une virgule, dans `ALLOWED_UIDS` et ne laissez jamais les valeurs fictives.
4. Vercel → Project → Settings → Environment Variables : mettez l’origine web exacte dans `APP_ORIGIN`, par exemple `https://t9dya.vercel.app`, sans barre oblique finale.
5. Vercel → Project → Settings → Environment Variables : gardez `OPENAI_API_KEY` et `FIREBASE_API_KEY` sans préfixe `VITE_`; seule la configuration Web Firebase `VITE_FIREBASE_*` est publique par conception.
6. OpenAI Platform → API keys : révoquez immédiatement toute clé déjà copiée dans le navigateur, une capture ou Git, puis créez une nouvelle clé de projet.
7. PowerShell à la racine : `npx firebase deploy --only firestore:rules` après chaque modification de `firestore.rules`.
8. Après le déploiement, testez sans jeton avec `curl.exe -i -X POST https://VOTRE-PROJET.vercel.app/api/ai -H "Content-Type: application/json" -d "{\"action\":\"tag\"}"`; la réponse attendue est `401 UNAUTHORIZED` et aucun appel OpenAI ne doit être exécuté.
9. Testez ensuite l’IA avec chacun des deux comptes autorisés, puis avec tout autre compte de test : le troisième compte doit recevoir `403 NOT_ALLOWED` et ne doit lire aucune donnée Firestore.
10. Vercel → Project → Settings → Deployment Protection : activez la protection des Preview Deployments si ces aperçus ne doivent pas être publics.

## Hwayj (clothes app)

1. Firebase Console → Project settings → General : copiez `apiKey` dans `FIREBASE_API_KEY` et gardez les variables `VITE_FIREBASE_*` existantes.
2. Firebase Console → Authentication → Users : copiez les UID exacts de Fayssal et Salma dans `ALLOWED_UIDS=uid1,uid2`.
3. OpenAI Platform → API keys : créez une clé de projet et placez-la uniquement dans `OPENAI_API_KEY`.
4. OpenAI Platform → Settings → Limits : définissez une limite mensuelle adaptée avant d’activer les options IA.
5. Utilisez `OPENAI_IMAGE_MODEL=gpt-image-2.5-flare`, `OPENAI_VISION_MODEL=gpt-5.4-nano` et `OPENAI_TEXT_MODEL=gpt-5.4-nano`; ces valeurs sont déjà prêtes dans `.env.example`.
6. Créez `.env.local` depuis `.env.example` et remplissez les valeurs locales sans le committer.
7. Vercel → Project → Settings → Environment Variables : ajoutez `OPENAI_API_KEY`, les trois variables de modèles, `ALLOWED_UIDS` et `FIREBASE_API_KEY` pour Production, Preview et Development.
8. OpenAI Platform → Settings → Organization → General : terminez la vérification de l’organisation si l’API Images la demande.
9. PowerShell à la racine du projet : `npx firebase deploy --only firestore:rules`. Cette étape autorise aussi `outfitImages`, où sont stockés les aperçus haute définition des looks générés.
10. GitHub : committez le code et les règles, puis poussez pour déclencher le redéploiement Vercel.
11. Vercel → Deployments : ouvrez le dernier déploiement et vérifiez `/`, `/t9dya/list`, `/hwayj/closet` et `/api/ai`.

Après toute modification de `.env.local`, arrêtez puis relancez `npm run dev`. Le serveur Vite charge localement la même fonction `api/ai.js` que Vercel; un ancien serveur déjà ouvert continuera sinon à retourner `404` ou `AI_NOT_CONFIGURED`.

La préparation du vêtement et le détourage utilisent uniquement l’API OpenAI côté serveur. Les images sont compressées avant l’appel puis à nouveau en WebP avant Firestore; elles restent privées dans `users/{uid}`.

Il n’existe pas de quota journalier interne dans `api/ai.js`. L’authentification reste obligatoire et les limites du compte OpenAI continuent de s’appliquer.

Hwayj demande une seule image `1024x1536` en qualité `medium` par ajout et analyse les tags en détail bas. `combine` reste en `1024x1024`, et `compose` en `1024x1536`, qualité `medium` par défaut. Le bouton « Relancer la préparation GPT » déclenche un nouvel appel image payant; utilisez-le seulement si le premier résultat ne convient pas.

### Optimisation IA (5 octobre 2026)

1. Consultez [AI_COSTS.md](./AI_COSTS.md) pour les valeurs, compromis de qualité, cache et plafonds de tokens. Les nouveaux réglages sont facultatifs : aucun changement de secret ni de modèle n’est nécessaire.
2. Pour un réglage local, décommentez seulement la variable souhaitée dans votre `.env.local` à partir des exemples de `.env.example`, puis redémarrez `npm run dev`. Pour la production, ajoutez cette variable dans Vercel → Settings → Environment Variables et redéployez.
3. Vérification hors réseau : `node --test scripts/ai.test.js`, puis `npm run lint` et `npm run build:check`. Les tests remplacent Firebase et OpenAI : aucun crédit consommé.
4. Le cache de tags peut être désactivé avec `OPENAI_TAG_CACHE_TTL_SECONDS=0`. L’authentification reste vérifiée même lors d’un cache hit.
5. Cette modification concerne le serveur et sa configuration locale : pas de nouvelles règles Firestore, pas de nouvelle permission Android. Redéployez le serveur Vercel pour que le Web et l’APK utilisant cette API en bénéficient.

## S7a ya s7a (suivi santé)

1. PowerShell à la racine du projet : `npx firebase deploy --only firestore:rules` pour autoriser les données santé privées par utilisateur, notamment le suivi quotidien de l’eau dans `healthWater` et les compteurs d’habitudes dans `healthBadHabits`.
2. Après déploiement Vercel, ouvrez `/s7a/today` avec chacun des deux comptes : chaque profil garde son dossier séparé, mais les deux membres du foyer peuvent le consulter et le modifier.
3. Hub → Réglages → Mes notifications Android : autorisez Android, puis activez séparément demandes de courses, produits ajoutés, rappel courses, traitements, rendez-vous, stock faible et résumé quotidien. Les rappels planifiés sonnent après fermeture; les événements du partenaire sont reçus quand l’APK est active ou à sa prochaine synchronisation.
4. Les estimations IA de glucides sont indicatives et ne remplacent jamais le calcul validé par le diabétologue; aucune dose d’insuline n’est générée automatiquement.
5. Dans Hub → Réglages → Mon profil, cochez « Je suis diabétique » uniquement pour le membre concerné. Les deux membres du même foyer peuvent ensuite consulter et gérer ses rendez-vous, traitements et données diabète depuis le sélecteur de profil S7a.
6. Le nombre d’unités restantes affiché sur un stylo est une estimation de confort (`300 unités × stylos en stock`, moins les doses enregistrées depuis le dernier ajustement du stock). Il ne faut pas l’utiliser pour décider une dose ou remplacer la vérification du stylo réel.

## Budget et journal des dépenses

1. Déployez les règles après cette mise à jour : `npx firebase deploy --only firestore:rules`. Les collections partagées `households/{id}/expenses` et `households/{id}/salaryMonths` resteront inaccessibles tant que les règles distantes ne sont pas actualisées.
2. Ouvrez `/budget/expenses` avec chacun des deux comptes et vérifiez qu’une dépense apparaît en temps réel chez les deux membres.
3. Pour une dépense payée depuis une enveloppe, vérifiez que le solde diminue. En supprimant la dépense, le solde doit être recrédité et le mouvement d’annulation doit apparaître.
4. Dans la vue globale, saisissez les deux salaires pour le mois, puis vérifiez qu’une dépense, une charge payée, les achats T9dya et un versement vers une enveloppe diminuent le bon salaire.
5. Vérifiez que changer de mois affiche les salaires et dépenses de ce mois tout en conservant exactement le même solde cumulé des enveloppes.
6. Après le déploiement Web, exécutez `npm run android:update` avant de générer un nouvel APK afin d’inclure toutes les applications.

## Commandes de vérification

### Nouvelle application Voiture

Guide complet : [VOITURE.md](./VOITURE.md). **Déployez les nouvelles règles** avec `npx firebase deploy --only firestore:rules` avant d’utiliser Voiture, puis redéployez le Web. Pour Android, exécutez `npm run android:update` et reconstruisez/réinstallez l’APK signé. Aucun index composite, clé API ou permission supplémentaire n’est nécessaire.

Dans Hub → Voiture, configurez la Fabia puis son kilométrage réel. Dans Budget, sélectionnez **Voiture** pour qu’une dépense apparaisse automatiquement dans les deux espaces, sans double comptage. Les intervalles d’entretien sont à confirmer depuis votre carnet constructeur ; 10 000 km n’est qu’un exemple modifiable.

Tests métier hors réseau : `node --test scripts/car.test.js`. Les étapes de validation à deux comptes, des transactions d’enveloppes et de la sécurité sont dans le guide.

### Vérifications générales

#### Compteur et messages flottants

Les confirmations flottantes communes à T9dya, Budget, Hwayj, S7a et Voiture sont maintenant en haut, sous la zone sûre du téléphone, avec un fond à 85 % d’opacité. Elles sont rendues directement dans `document.body` pour ne pas être déplacées/coupées par un conteneur animé. Le fond laisse passer les interactions ; seuls Fermer et une éventuelle action sont cliquables. Les confirmations de suppression et erreurs dans les formulaires restent en place : elles ne sont pas des notifications temporaires.

La célébration des traitements est centrée dans l’écran, translucide et non bloquante. L’animation de rebond qui remplaçait la translation de centrage a été retirée. Les effets décoratifs respectent le mode animations réduites.

Vérifier sur Web et APK : appui court/long sur −/+, relâchement hors du bouton, passage en arrière-plan, valeurs 0 et 2 000 000 km, annulation d’un aperçu, diminution avec motif et mise à jour concurrente du partenaire. Vérifier aussi les notifications pendant l’ouverture d’une fenêtre et les clics derrière leur texte, ainsi que la célébration S7a sur écran étroit.

Pour livrer : redéployer le Web ; `npm run android:update` puis reconstruire l’APK. Aucun changement de règle Firebase pour ces ajustements. Syntaxe JS/JSX vérifiée ; validation tactile, lint et build à exécuter avant livraison.

1. `npm run lint`
2. `npm run build:check`
3. `npm run dev`
4. Pour livrer les notifications dans l’APK, exécutez `npm run android:update`, relancez Android Studio puis régénérez l’APK signé avec la clé habituelle. Aucun déploiement Firestore ou Vercel supplémentaire n’est requis pour ce changement.

## Carte et partage GPS

### Gestes de la carte (Web et Android)

La carte accepte le déplacement avec un doigt ou un glisser à la souris et le zoom progressif avec deux doigts, centré sous les doigts. Le geste reste dans la carte, sans faire défiler ni zoomer toute la page ; le défilement reste normal en dehors de la carte. Les boutons +/− et recentrage restent disponibles. Au clavier : flèches, +/− et touche Origine/Home. Après un déplacement manuel, les nouvelles positions GPS actualisent les marqueurs sans déplacer la vue ; le bouton de recentrage réactive le suivi automatique.

Pour cette mise à jour d’interface uniquement : redéployer le Web ; pour l’APK, exécuter `npm run android:update`, reconstruire et installer l’APK signé habituel. Aucune nouvelle dépendance, permission ou règle Firebase requise.

Vérifications à lancer : `node --test scripts/mapViewport.test.js`, `npm run lint`, `npm run build:check`. Sur navigateur mobile et APK, tester : glisser, pincer hors du centre, lever un doigt puis continuer à glisser, sortir du cadre pendant un geste, tourner le téléphone, recentrer, recevoir une position GPS pendant une exploration et faire défiler la page hors de la carte. Vérifier aussi la souris et les boutons sur ordinateur. Les tests mathématiques ne remplacent pas ces essais tactiles sur appareil.

Implémentation commune dans `LiveMap.jsx`, basée sur les [Pointer Events et gestes de pincement](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures), sans bloquer les gestes du reste de l’application.

### Configuration initiale du partage GPS

1. Déployez obligatoirement les nouvelles règles : `npx firebase deploy --only firestore:rules`. Sans cette étape, l’application affichera « Impossible d’envoyer votre position ».
2. Redéployez le site Vercel afin d’appliquer `Permissions-Policy: geolocation=(self)` à la version Web.
3. Exécutez `npm run android:update`, puis reconstruisez l’APK signé. Le manifeste Android contient `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` et `ACCESS_BACKGROUND_LOCATION`.
4. Installez l’APK sur les deux téléphones. Pour le mode **Toujours**, acceptez la localisation « tout le temps » et les notifications : Android garde une notification visible pendant le service GPS.
5. Testez l’arrêt du partage. Il doit arrêter le service et supprimer le document `households/{householdId}/locations/{uid}`.

## Carnet de recettes maison

1. Déployez les règles Firestore pour autoriser `households/{householdId}/customRecipes` aux deux membres du foyer.
2. Dans **T9dya → Cuisine → Mes recettes**, créez une recette avec plusieurs quantités et vérifiez qu’elle apparaît sur le second compte.
3. Marquez quelques ingrédients manquants et ajoutez-les à une liste active. Les noms, quantités, unités et la note « Pour … » doivent être conservés.
