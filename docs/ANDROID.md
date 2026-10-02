# Application Android privée avec Capacitor

Ce guide transforme le projet web existant en application Android sans dupliquer l’interface ni changer Firebase. La version web et l’APK utilisent le même code React, le même foyer et les mêmes données Firestore.

## Ce qui est déjà préparé dans le projet

- Capacitor 8 et uniquement la plateforme Android.
- App ID : `com.t9dya.app`.
- Build Android séparé du build web.
- `/api/ai` utilise l’adresse Vercel dans l’APK et reste relatif sur le Web.
- CORS autorise l’origine native sécurisée `https://localhost`.
- Bouton retour Android, clavier natif, barre d’état et thème sombre.
- Notifications locales pour les traitements et les rendez-vous S7a ya s7a.
- Icône et écran de lancement générés à partir de `assets/logo.svg`.
- Firebase conserve son cache hors ligne existant.

Les notifications locales fonctionnent même si l’application est fermée, car elles sont programmées sur le téléphone. Elles ne permettent toutefois pas encore à un partenaire d’envoyer une notification à l’autre : cela demandera Firebase Cloud Messaging plus tard.

## 1. Installer les outils une seule fois

1. Installez Node.js 22 ou une version plus récente.
2. Installez Android Studio 2025.2.1 ou une version plus récente.
3. Au premier démarrage d’Android Studio, laissez l’assistant installer Android SDK, Platform Tools et le JDK proposé.
4. Dans Android Studio, ouvrez **Tools → SDK Manager** et vérifiez qu’Android SDK Platform 36 est installé.
5. Dans PowerShell, à la racine du projet, vérifiez Node :

```powershell
node --version
```

Le résultat doit commencer par `v22` ou une version supérieure.

## 2. Configurer l’adresse de l’API pour l’APK

Le navigateur peut appeler `/api/ai` directement. Une application installée ne connaît pas ce chemin : elle doit appeler l’URL publique Vercel.

1. Créez à la racine un fichier nommé `.env.android.local`.
2. Mettez-y l’URL du déploiement Vercel, sans `/` final :

```env
VITE_API_BASE_URL=https://VOTRE-PROJET.vercel.app
```

Exemple : `https://t9dya.vercel.app`.

Ne mettez jamais `OPENAI_API_KEY`, `FIREBASE_API_KEY` serveur ou une clé privée dans ce fichier. L’APK contient uniquement l’adresse publique du serveur. Les secrets restent dans Vercel.

## 3. Créer le projet Android

Exécutez ces commandes dans PowerShell à la racine du projet :

```powershell
npm install
npm run build:android
npm run android:add
npm run android:assets
npm run android:sync
npm run android:open
```

`android:add` ne doit être lancé qu’une seule fois. Les commandes créent le dossier `android/`, copient le build React, génèrent l’icône et ouvrent Android Studio.

Si Android Studio demande de faire une synchronisation Gradle, acceptez et attendez la fin de l’indexation avant de lancer l’application.

## 4. Lancer sur un vrai téléphone

1. Sur le téléphone, ouvrez **Paramètres → À propos du téléphone**.
2. Touchez sept fois **Numéro de build** pour activer les options développeur.
3. Activez **Débogage USB** dans les options développeur.
4. Branchez le téléphone au PC et acceptez la fenêtre d’autorisation USB.
5. Dans Android Studio, sélectionnez le téléphone dans la barre supérieure.
6. Cliquez sur le bouton vert **Run**.

Vous pouvez aussi lancer depuis PowerShell :

```powershell
npm run android:run
```

## 5. Mettre l’APK à jour après une modification React

Après chaque modification de l’application, exécutez :

```powershell
npm run android:update
```

Puis relancez l’application depuis Android Studio. Si vous changez l’icône, exécutez aussi `npm run android:assets` avant la synchronisation.

## 6. Vérifications Firebase et IA

Testez avec les deux comptes, sur les deux téléphones :

- connexion et déconnexion Firebase ;
- apparition du même foyer et des deux profils ;
- ajout, modification puis suppression d’une donnée Firestore ;
- photo depuis la caméra et depuis la galerie dans Hwayj et S7a ;
- génération IA depuis une photo ;
- synchronisation des données après fermeture et réouverture ;
- ouverture sans réseau d’une page déjà consultée, puis resynchronisation au retour du réseau.

Si l’IA affiche `NATIVE_API_URL_NOT_CONFIGURED`, vérifiez `.env.android.local`, puis relancez `npm run android:update`.

Si l’API répond `403 NOT_ALLOWED`, remplacez les valeurs fictives de `ALLOWED_UIDS` dans Vercel par les UID réels des deux comptes Firebase, puis redéployez Vercel.

Si Firebase Authentication refuse le domaine, ouvrez **Firebase Console → Authentication → Settings → Authorized domains** et vérifiez que `localhost` est présent. Capacitor utilise l’origine sécurisée `https://localhost` dans l’application.

## 7. Vérifications mobiles importantes

Sur chaque téléphone, vérifiez les cas suivants :

- le clavier ne masque pas le champ ou le bouton de validation ;
- le bouton retour ferme d’abord une page ou revient à la page précédente ;
- depuis le portail ou la connexion, le bouton retour quitte l’application ;
- les feuilles et fenêtres restent utilisables avec le clavier ouvert ;
- la caméra demande son autorisation au premier usage ;
- le thème clair/sombre colore aussi la barre d’état Android ;
- aucune page ne passe sous la barre système ou la navigation du téléphone ;
- les photos restent nettes et l’envoi d’une grande photo est compressé normalement.

## 8. Tester les notifications locales

1. Ouvrez l’APK puis **Portail → Réglages → Notifications**.
2. Autorisez les notifications Android.
3. Ajoutez un traitement avec une heure située quelques minutes dans le futur.
4. Revenez au portail au moins une fois : les rappels du foyer y sont synchronisés avec le téléphone.
5. Fermez complètement l’application et attendez le rappel.
6. Touchez la notification : elle doit ouvrir le bon profil S7a.
7. Testez également un rendez-vous avec son délai de rappel.

Les rappels sont volontairement programmés comme alarmes Android non exactes. Android peut les décaler légèrement pour économiser la batterie, mais l’application n’a pas besoin de l’autorisation sensible « Alarmes et rappels ».

Sur certains téléphones Xiaomi, Samsung, Oppo ou Realme, désactivez l’optimisation agressive de batterie pour T9DYA si les rappels arrivent très en retard.

## 9. Générer l’APK privé

### APK rapide pour tester

Dans Android Studio :

1. Ouvrez **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
2. À la fin, cliquez sur **locate**.
3. Le fichier de test se trouve normalement dans `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Envoyez ce fichier uniquement à vos deux téléphones et autorisez temporairement l’installation depuis cette source.

### APK privé signé pour vos deux téléphones

Dans Android Studio :

1. Ouvrez **Build → Generate Signed App Bundle or APK**.
2. Choisissez **APK**, puis **Next**.
3. Cliquez sur **Create new** pour créer un fichier `.jks`.
4. Choisissez un mot de passe fort, un alias et une longue durée de validité.
5. Sélectionnez la variante **release** et terminez la génération.
6. Le fichier se trouve normalement dans `android/app/release/` ou `android/app/build/outputs/apk/release/`.

Conservez le fichier `.jks`, son alias et ses mots de passe dans un emplacement privé sauvegardé. Sans cette clé, vous ne pourrez pas installer une future mise à jour par-dessus l’ancienne version. Les fichiers `.jks`, `.keystore`, `keystore.properties` et `android/local.properties` sont déjà ignorés par Git.

Pour mettre à jour les deux téléphones, générez toujours le nouvel APK avec la même clé et installez-le par-dessus l’application existante. Les données principales restent dans Firebase.

## 10. Limite actuelle : notifications entre partenaires

Cette première version inclut les notifications locales de ce téléphone. Pour recevoir instantanément « Salma a demandé cette liste » lorsque T9DYA est complètement fermée, il faudra ensuite ajouter :

- Firebase Cloud Messaging ;
- l’enregistrement sécurisé d’un jeton par téléphone ;
- une fonction serveur Firebase ou Vercel qui envoie le push ;
- la suppression et le renouvellement automatiques des anciens jetons.

Cette étape est volontairement reportée : elle ne bloque ni l’APK privé, ni Firebase, ni les rappels locaux S7a.
