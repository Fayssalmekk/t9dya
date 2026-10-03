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

Le quota journalier dans `api/ai.js` est une protection simple en mémoire : il peut être remis à zéro lors d’un redémarrage serverless et ne remplace pas la limite de dépense OpenAI.

Hwayj demande une seule image `1024x1024` en qualité `low` par ajout et analyse les tags en détail bas. Le bouton « Relancer la préparation GPT » déclenche un nouvel appel image payant; utilisez-le seulement si le premier résultat ne convient pas.

## S7a ya s7a (suivi santé)

1. PowerShell à la racine du projet : `npx firebase deploy --only firestore:rules` pour autoriser les données santé privées par utilisateur, notamment le suivi quotidien de l’eau dans `healthWater`.
2. Après déploiement Vercel, ouvrez `/s7a/today` avec chacun des deux comptes : chaque profil garde son dossier séparé, mais les deux membres du foyer peuvent le consulter et le modifier.
3. Hub → Réglages → Mes notifications Android : autorisez Android, puis activez séparément demandes de courses, produits ajoutés, rappel courses, traitements, rendez-vous, stock faible et résumé quotidien. Les rappels planifiés sonnent après fermeture; les événements du partenaire sont reçus quand l’APK est active ou à sa prochaine synchronisation.
4. Les estimations IA de glucides sont indicatives et ne remplacent jamais le calcul validé par le diabétologue; aucune dose d’insuline n’est générée automatiquement.
5. Dans Hub → Réglages → Mon profil, cochez « Je suis diabétique » uniquement pour le membre concerné. Les deux membres du même foyer peuvent ensuite consulter et gérer ses rendez-vous, traitements et données diabète depuis le sélecteur de profil S7a.
6. Le nombre d’unités restantes affiché sur un stylo est une estimation de confort (`300 unités × stylos en stock`, moins les doses enregistrées depuis le dernier ajustement du stock). Il ne faut pas l’utiliser pour décider une dose ou remplacer la vérification du stylo réel.

## Budget et journal des dépenses

1. Déployez les règles après cette mise à jour : `npx firebase deploy --only firestore:rules`. La nouvelle collection partagée `households/{id}/expenses` restera inaccessible tant que les règles distantes ne sont pas actualisées.
2. Ouvrez `/budget/expenses` avec chacun des deux comptes et vérifiez qu’une dépense apparaît en temps réel chez les deux membres.
3. Pour une dépense payée depuis une enveloppe, vérifiez que le solde diminue. En supprimant la dépense, le solde doit être recrédité et le mouvement d’annulation doit apparaître.
4. Après le déploiement Web, exécutez `npm run android:update` avant de générer un nouvel APK afin d’inclure la quatrième application.

## Commandes de vérification

1. `npm run lint`
2. `npm run build:check`
3. `npm run dev`
4. Pour livrer les notifications dans l’APK, exécutez `npm run android:update`, relancez Android Studio puis régénérez l’APK signé avec la clé habituelle. Aucun déploiement Firestore ou Vercel supplémentaire n’est requis pour ce changement.
