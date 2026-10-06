# Application Android privée avec Capacitor

Ce guide transforme le projet web existant en application Android sans dupliquer l’interface ni changer Firebase. La version web et l’APK utilisent le même code React, le même foyer et les mêmes données Firestore.

## Ce qui est déjà préparé dans le projet

- Capacitor 8 et uniquement la plateforme Android.
- App ID : `com.t9dya.app`.
- Build Android séparé du build web.
- `/api/ai` utilise l’adresse Vercel dans l’APK et reste relatif sur le Web.
- CORS autorise l’origine native sécurisée `https://localhost`.
- Bouton retour Android, clavier natif, barre d’état et thème sombre.
- Centre de notifications Android configurable dans le Hub : demandes de courses, nouveaux produits, rappels de listes, traitements, rendez-vous, stock faible et résumé quotidien.
- Application Carte avec zoom manuel, autorisation GPS, partage volontaire, position du partenaire et arrêt avec effacement immédiat.
- Option Android « Toujours partager si le GPS est actif » avec suivi en arrière-plan et notification persistante.
- Icône et écran de lancement générés à partir de `assets/logo.svg`.
- Firebase conserve son cache hors ligne existant.

Les traitements, rendez-vous et rappels quotidiens fonctionnent même si l’application est fermée, car ils sont programmés sur le téléphone. Les événements en direct du partenaire apparaissent dès que l’application reçoit la modification Firestore, y compris au retour dans l’application. Pour réveiller instantanément une application complètement arrêtée, Firebase Cloud Messaging reste nécessaire.

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

### Si Android Studio affiche `Unsupported class file major version 69`

Les versions récentes d’Android Studio peuvent embarquer Java 25, alors que le Gradle 8 du projet doit utiliser JDK 21. Installez **Eclipse Temurin JDK 21**, puis ouvrez **File → Settings → Build, Execution, Deployment → Build Tools → Gradle** et choisissez ce JDK dans **Gradle JDK**. Sur Windows, son chemin ressemble à :

```text
C:\Program Files\Eclipse Adoptium\jdk-21...-hotspot
```

Cliquez ensuite sur **File → Sync Project with Gradle Files**. Le bouton Run et la configuration `app` apparaissent après une synchronisation réussie.

Si PowerShell refuse `npm` parce que l’exécution des scripts est désactivée, utilisez `npm.cmd` dans les commandes de ce guide, par exemple `npm.cmd run android:update`.

## 2. Configurer l’adresse de l’API pour l’APK

Le navigateur peut appeler `/api/ai` directement. Une application installée ne connaît pas ce chemin : elle doit appeler l’URL publique Vercel.

Le Hub affiche en bas la version manuelle définie dans `src/version.js`. Modifier `APP_VERSION` avant chaque push de production, puis lancer le build Web ou `npm run android:update`.

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
- les formulaires s’ouvrent entièrement sans lancer le clavier; celui-ci apparaît seulement après avoir touché un champ, puis la feuille défile pour garder la saisie visible ;
- la caméra demande son autorisation au premier usage ;
- les barres système Android restent noires avec des icônes blanches pour garder Wi-Fi, batterie et navigation lisibles ;
- aucune page ne passe sous la barre système ou la navigation du téléphone ;
- les photos restent nettes et l’envoi d’une grande photo est compressé normalement.

## 8. Tester les notifications locales

1. Ouvrez l’APK puis **Portail → Réglages → Mes notifications Android**.
2. Touchez d’abord **Notifications** pour donner l’autorisation Android, puis utilisez **Envoyer une notification de test**. Elle doit apparaître après environ une seconde.
3. Si le test échoue, ouvrez les informations Android de T9DYA → Notifications et vérifiez que les notifications et les trois catégories sont autorisées.
4. Activez ou désactivez séparément chaque alerte, puis réglez l’heure du rappel courses et du résumé quotidien si ces options sont actives.
5. Ajoutez un traitement avec une heure située quelques minutes dans le futur, puis fermez l’application : le rappel doit sonner et ouvrir le bon profil S7a.
6. Depuis le second compte, demandez au partenaire de faire une liste ou ajoutez un produit. Le téléphone destinataire reçoit l’alerte lorsque l’application est active ou dès sa prochaine synchronisation.
7. Testez aussi un rendez-vous et un traitement dont le stock atteint son seuil minimum.

Les rappels sont volontairement programmés comme alarmes Android non exactes. Android peut les décaler légèrement pour économiser la batterie, mais l’application n’a pas besoin de l’autorisation sensible « Alarmes et rappels ».

Sur certains téléphones Xiaomi, Samsung, Oppo ou Realme, désactivez l’optimisation agressive de batterie pour T9DYA si les rappels arrivent très en retard.

### Tester la Carte et le GPS

1. Déployez d’abord les règles Firestore indiquées dans `docs/SETUP.md`, puis installez le nouvel APK sur les deux téléphones.
2. Sur chaque téléphone, ouvrez **Hub → Réglages → Localisation GPS** et acceptez l’autorisation Android.
3. Ouvrez **Carte**, puis activez **Partager ma position en direct** sur les deux comptes.
4. Vérifiez que les deux marqueurs, la distance, la précision et l’heure de mise à jour apparaissent.
5. Utilisez les boutons `+`, `−` et cadrage : le zoom choisi doit rester stable pendant les mises à jour GPS.
6. Dans **Hub → Réglages → Position du foyer**, activez **Toujours partager si le GPS est actif**, acceptez « Autoriser tout le temps » et l’autorisation de notification, puis verrouillez l’écran. Une notification T9DYA reste visible pendant le suivi.
7. Déplacez un téléphone de quelques mètres et vérifiez la nouvelle position après une quinzaine de secondes.
8. Arrêtez le partage : le marqueur correspondant doit disparaître chez le partenaire après la synchronisation Firestore.

Le mode normal continue pendant la navigation dans T9DYA. Le mode « Toujours » utilise un service Android avec notification visible afin de continuer écran verrouillé ou application en arrière-plan. Couper le GPS ou forcer l’arrêt de T9DYA depuis Android suspend le service jusqu’à la prochaine ouverture.

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

### Proposer l’APK depuis la version Web

Le Hub Web contient un bouton **Télécharger l’APK Android**. Vercel sert le fichier `public/downloads/notre-espace.apk` comme un téléchargement direct.

Après avoir généré un nouvel APK, copiez automatiquement la version signée disponible, ou à défaut l’APK de test, vers le site :

```powershell
npm run android:publish-web
```

La commande cherche d’abord un APK release signé dans les emplacements Android habituels, puis utilise `android/app/build/outputs/apk/debug/app-debug.apk` si aucun release signé n’existe. Lancez ensuite le build Web et déployez-le. Ne publiez jamais le fichier `.jks` ni ses mots de passe.

## 10. Limite actuelle : réception instantanée quand l’application est arrêtée

La demande du partenaire et les nouveaux produits génèrent maintenant une vraie notification Android dès que l’application reçoit le changement Firestore. Pour recevoir instantanément « Salma a demandé cette liste » quand l’application est complètement arrêtée par Android, il faudra ajouter :

- Firebase Cloud Messaging ;
- l’enregistrement sécurisé d’un jeton par téléphone ;
- une fonction serveur Firebase ou Vercel qui envoie le push ;
- la suppression et le renouvellement automatiques des anciens jetons.

Cette limite ne concerne pas les rappels déjà programmés sur le téléphone : traitements, rendez-vous, courses quotidiennes et résumé quotidien continuent de fonctionner après fermeture.
