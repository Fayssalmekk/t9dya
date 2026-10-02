# T9dya

Plateforme mobile-first privée pour un foyer de deux personnes : courses et repas T9dya, budget, dressing Hwayj et santé S7a.

Une IA ou un développeur qui reprend le projet doit commencer par lire [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md), puis `prompt.md` et `docs/SETUP.md`.

## Prerequis

- Node.js 22.12 ou plus recent
- Un projet Firebase sur le plan Spark
- Un compte GitHub et un compte Vercel Hobby pour le deploiement

## Installation locale

1. Executez `npm install`.
2. Copiez `.env.example` vers `.env` et remplacez les valeurs par la configuration Web Firebase.
3. Executez `npm run dev`.

## Configuration Firebase

Suivez le guide détaillé pour débutants dans [`docs/firebase-setup.md`](docs/firebase-setup.md). Il couvre la console Firebase, les commandes PowerShell, le déploiement des règles, le test avec deux comptes et les erreurs fréquentes.

Le fonctionnement du journal des dépenses, des charges et des enveloppes est expliqué dans la section Budget de [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md#9-application-budget).

## Deploiement GitHub vers Vercel

1. Creez un depot GitHub, validez les fichiers puis poussez la branche principale.
2. Importez le depot dans Vercel avec le preset Vite.
3. Ajoutez chaque variable `VITE_FIREBASE_*` de `.env.example` dans les variables Vercel.
4. Deployez; `vercel.json` redirige les routes de l'application vers `index.html`.

## Scripts

- `npm run dev` : serveur de developpement
- `npm run build` : build de production
- `npm run build:check` : vérification locale sans PWA si Windows bloque Rollup
- `npm run preview` : apercu du build
- `npm run lint` : verification ESLint
- `npm run firebase:emulators` : emulateurs Auth et Firestore

## Modele Firestore prevu

- `users/{uid}` : profil privé et identifiant du foyer de l'utilisateur
- `households/{inviteCode}` : membres (maximum deux), budget et parametres du foyer
- `households/{id}/items` : liste de courses active
- `households/{id}/purchases` : achats confirmes
- `households/{id}/priceHistory` : historique de prix par produit
- `households/{id}/customProducts` : produits personnels permanents et partages par le foyer
- `households/{id}/charges` et `chargePayments` : charges récurrentes et règlements mensuels
- `households/{id}/envelopes` et `envelopeTransactions` : enveloppes, soldes et mouvements
- `households/{id}/expenses` : journal des dépenses et source de l’argent
- `households/{id}/templates` : listes recurrentes
- `households/{id}/pantry` : produits a surveiller
- `households/{id}/trips` : sorties de courses archivees

Le code d'invitation sert d'identifiant au document du foyer. Le second membre peut donc rejoindre le foyer sans lire ses donnees au prealable. Apres l'ajout, seules les deux personnes inscrites dans `members` peuvent lire ou modifier les donnees du foyer.
