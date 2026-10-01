# Guide Firebase pour T9dya

Ce guide explique chaque action Firebase pas à pas. Exécutez les commandes PowerShell depuis le dossier du projet.

## 1. Vérifier le fichier `.env`

Le fichier `.env` doit rester privé et ne doit jamais être envoyé sur GitHub. Il doit contenir les six valeurs données par Firebase :

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Pour retrouver ces valeurs :

1. Ouvrez [Firebase Console](https://console.firebase.google.com/).
2. Ouvrez votre projet T9dya.
3. Cliquez sur la roue dentée, puis **Paramètres du projet**.
4. Descendez jusqu’à **Vos applications** et ouvrez l’application Web `</>`.
5. Dans **Configuration du SDK**, choisissez **Config** et recopiez les six valeurs correspondantes.

Après une modification de `.env`, arrêtez `npm run dev` avec `Ctrl+C`, puis relancez-le.

## 2. Activer la connexion Email/Mot de passe

1. Dans Firebase Console, ouvrez **Build → Authentication**.
2. Cliquez sur **Commencer** si Firebase le demande.
3. Ouvrez **Sign-in method** ou **Modes de connexion**.
4. Cliquez sur **Email/Password**.
5. Activez le premier bouton **Email/Password** et laissez **Email link** désactivé.
6. Cliquez sur **Enregistrer**.

Vous ne devez pas créer les deux utilisateurs dans la console : vous et votre épouse créerez vos comptes directement dans T9dya.

## 3. Créer Cloud Firestore

1. Dans Firebase Console, ouvrez **Build → Firestore Database**.
2. Cliquez sur **Créer une base de données**.
3. Choisissez **Mode production**.
4. Choisissez une région proche du Maroc; ce choix ne pourra pas être déplacé facilement.
5. Confirmez la création.

Le mode production bloque tout au départ. C’est normal : l’étape suivante déploie les règles sécurisées de T9dya.

## 4. Relier la CLI au bon projet

Vérifiez que `.firebaserc` contient l’identifiant exact visible dans **Paramètres du projet → ID du projet** :

```json
{
  "projects": {
    "default": "votre-id-de-projet"
  }
}
```

Connectez ensuite la CLI :

```powershell
npx firebase login
npx firebase projects:list
npx firebase use
```

`projects:list` doit afficher votre projet et `firebase use` doit afficher le même identifiant.

## 5. Déployer les règles Firestore

À exécuter maintenant, puis après chaque modification de `firestore.rules` :

```powershell
npx firebase deploy --only firestore:rules,firestore:indexes
```

Le message final doit contenir `Deploy complete!`. Pour vérifier, ouvrez **Firestore Database → Règles** et confirmez que la date de publication vient de changer.

La collection `lists` utilisée pour les courses datées et archivées est autorisée par ces règles. Après une mise à jour de T9dya qui modifie `firestore.rules`, relancez toujours cette commande avant de tester la nouvelle fonctionnalité.

Attention : les règles locales remplacent celles qui se trouvent dans la console Firebase.

## 6. Tester les deux comptes

1. Lancez l’application avec `npm run dev`.
2. Créez votre compte, puis choisissez **Créer notre foyer**.
3. Copiez le code qui commence par `T9DYA-`.
4. Ouvrez une fenêtre privée, ou un deuxième téléphone, avec la même adresse.
5. Créez le compte de votre épouse.
6. Choisissez **Rejoindre mon partenaire** et collez le code.
7. Le premier écran doit passer automatiquement de `1 personne sur 2` à `2 personnes sur 2`.

## 7. Comprendre les données

Dans **Firestore Database → Données**, vous verrez :

- `users/{uid}` : profil privé et identifiant du foyer de chaque compte;
- `households/{code}` : foyer partagé, deux UID maximum et profils du couple;
- plus tard, les sous-collections `items`, `purchases`, `priceHistory`, `templates`, `pantry` et `trips`.

Évitez de modifier ces documents à la main : une faute dans un UID peut bloquer l’accès au foyer.

## 8. Problèmes fréquents

### `auth/operation-not-allowed`

Email/Password n’est pas activé. Reprenez la section 2.

### `Missing or insufficient permissions`

Les règles ne sont pas déployées ou `.firebaserc` vise un autre projet. Reprenez les sections 4 et 5.

### `Firebase: Error (auth/invalid-api-key)`

La clé dans `.env` est absente ou mal copiée. Reprenez la section 1 puis redémarrez Vite.

### Le code d’invitation est refusé

Vérifiez le format complet `T9DYA-XXXXXXXX`, puis déployez les nouvelles règles. Un foyer déjà composé de deux membres refuse automatiquement une troisième personne.

### La page reste sur le chargement

Ouvrez les outils développeur avec `F12`, puis l’onglet **Console**. Recherchez une erreur Firebase et vérifiez que Firestore a bien été créé.

## Commandes utiles

```powershell
# Démarrer T9dya
npm run dev

# Vérifier le code
npm run lint
npm run build

# Démarrer les émulateurs Firebase locaux
npm run firebase:emulators

# Redéployer les règles et index
npx firebase deploy --only firestore:rules,firestore:indexes

# Se déconnecter de la CLI
npx firebase logout
```

### Si Windows bloque le fichier natif Rollup

Sur certains PC administrés, `npm run build` termine l’application puis Windows Application Control bloque la génération du service worker PWA. Le code de l’application peut quand même être vérifié avec :

```powershell
npm run build:check
```

Ce mode désactive uniquement la génération PWA pendant la vérification locale. Le build Vercel/Linux conserve la PWA. Ne désactivez pas les protections Windows de votre PC pour contourner cette erreur.

## Sécurité importante

Ne partagez jamais votre mot de passe, votre fichier `.env`, ni un export de comptes Firebase. Envoyez le code d’invitation uniquement à votre épouse. Les clés Web Firebase identifient le projet; la protection réelle des données repose sur Authentication et `firestore.rules`.

## Limite des alertes gratuites

Le bouton « Demander à mon partenaire de l’acheter » synchronise la demande en temps réel et affiche une notification navigateur si elle a été autorisée dans **Réglages**. Avec l’architecture gratuite actuelle sans serveur ni Cloud Functions, une notification push ne peut pas être garantie lorsque T9dya est complètement fermée. Dès que l’application est ouverte ou reprise, la demande apparaît immédiatement.
