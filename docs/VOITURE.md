# Voiture — installation et fonctionnement

## Ce qui est disponible

Le Hub présente désormais **six applications, deux cartes par ligne**, même sur mobile. T9dya utilise l’icône panier. Voiture s’ouvre à `/voiture` et comporte quatre sections :

1. **Tableau de bord** : compteur animé, dépenses du mois, prochains entretiens, échéances d’assurance/contrôle technique et raccourci assistance.
2. **Entretiens** : rappels personnels en kilomètres et/ou en mois, modification, suppression d’un rappel et confirmation d’une intervention réelle.
3. **Dépenses** : saisie partagée avec Budget, navigation par mois, filtre par type, carburant/litres et prix moyen des pleins renseignés.
4. **Carnet** : interventions réalisées, garage, notes, coûts liés et 50 derniers relevés du compteur.

Les deux membres du foyer peuvent consulter et modifier ces informations. L’application gère pour l’instant **une voiture partagée**, pas un véhicule par profil.

## Première installation — important

Les nouvelles collections seront bloquées tant que les règles Firebase ne sont pas déployées. À la racine du projet, dans PowerShell :

```powershell
npx firebase deploy --only firestore:rules
```

Puis :

1. Redéployez le site Vercel avec le nouveau code.
2. Ouvrez **Hub → Voiture → Configurer ma Fabia**.
3. Le formulaire propose **Škoda Fabia, 2026, automatique, gris-vert / toit noir**. Vérifiez et enregistrez. Ajoutez éventuellement la motorisation exacte, l’immatriculation, les échéances des documents et l’assistance.
4. Cliquez sur **Renseigner mon kilométrage** et saisissez la valeur réelle du tableau de bord. Il n’y a pas de kilométrage fictif à 0 ; avant la première saisie, le compteur affiche des tirets.
5. Configurez les entretiens selon votre carnet et les indications de votre garage.

Pas de clé API, pas de nouvelle dépendance, pas d’IA payante et pas de Cloud Storage. Les données sont de petits documents Firestore. La requête des dépenses Voiture utilise seulement l’égalité `category == 'car'`, sans index composite spécifique.

Pour Android :

```powershell
npm run android:update
```

Reconstruisez ensuite l’APK dans Android Studio avec la clé de signature habituelle, puis installez-le sur les deux téléphones. Aucune nouvelle permission Android n’est nécessaire.

## Kilométrage

Le compteur principal et la fenêtre de saisie disposent de boutons **− / +**. Un appui court change de 1 km ; après 0,4 seconde l’appui maintenu répète, puis passe à 10 km par cran après 1,8 seconde et 100 km après 3,5 secondes. Le relâchement, la sortie du bouton, une annulation tactile, la perte de focus ou le passage de l’application en arrière-plan arrêtent la répétition.

Sur le tableau de bord, les chiffres animent un **aperçu non enregistré**. Appuyez sur « Valider ce kilométrage » pour confirmer dans le formulaire, ou « Annuler l’ajustement ». Une diminution est une correction avec motif obligatoire. Les crans ne déclenchent pas chacun une écriture Firebase : seul l’enregistrement final écrit le relevé. Les protections contre les modifications simultanées restent actives.

- **Kilométrage actuel** : remplace le compteur par la valeur réelle, sans autoriser une diminution accidentelle.
- **Ajouter un trajet** : ajoute une distance au compteur existant, dans une transaction. Si les deux partenaires ajoutent chacun un trajet, les deux ajouts sont pris en compte.
- **Corriger une erreur** : autorise une baisse, exige une explication et garde l’ancienne valeur dans le journal.
- Si le partenaire a modifié le compteur pendant une saisie absolue/correction, la sauvegarde est refusée avec un message invitant à rouvrir le formulaire ; une ancienne valeur ne remplace pas silencieusement la nouvelle.

Le compteur est manuel. Il n’est pas connecté à la voiture, à Škoda Connect ou au GPS. Saisir un kilométrage dans une dépense ne modifie pas le compteur principal.

## Entretiens et échéances

**10 000 km est un exemple demandé, pas une préconisation constructeur.** Le kilométrage et la motorisation ne suffisent pas à déduire tous les intervalles. Škoda indique de consulter les intervalles de son véhicule et son manuel : [entretien Škoda](https://www.skoda-auto.com/services/ice-maintenance), [manuels officiels](https://www.skoda-auto.com/apps/manuals/).

Aucun rappel n’est créé automatiquement. Le bouton « Configurer ma vidange » préremplit un formulaire à confirmer/modifier. Les autres idées (pneus, freins, batterie, filtres, boîte automatique, essuie-glaces) ne présument aucun intervalle.

Chaque rappel contient un point de départ (dernier entretien connu : kilométrage et éventuellement date), puis un intervalle en km, en mois, ou les deux. La première échéance atteinte rend le rappel « À faire ». « Bientôt » signifie moins de 1 000 km ou 30 jours avant l’échéance ; ce seuil d’affichage n’est pas un conseil mécanique.

Exemple avec départ à 0 et intervalle 10 000 km :

- À 10 000 km, la vidange est à faire, mais n’est **jamais cochée automatiquement**.
- En confirmant une intervention à 10 000 km, la suivante passe à 20 000 km.
- Une intervention effectuée à 12 000 km donne une prochaine échéance à 22 000 km : le calcul repart de l’intervention réelle, pas d’une grille fictive.
- Une intervention passée peut être ajoutée. Le calcul utilise la plus récente par date puis kilométrage, pas la dernière saisie dans l’application.
- Supprimer une intervention erronée recalcule l’échéance depuis l’intervention précédente ou le point de départ. Sa dépense n’est pas supprimée automatiquement : l’utilisateur la retire séparément si elle était aussi erronée.
- Supprimer un rappel l’archive (`active: false`) ; son historique reste visible.

Assurance et contrôle technique : dates saisies par vous, sans intervalle légal supposé. Les alertes visuelles apparaissent dans le tableau de bord Voiture à 30 jours et restent visibles après l’échéance. **Pas de notification push/Android dédiée ni de rappel Voiture dans le Hub dans cette version.**

## Dépenses : une seule source de vérité

**Budget et Voiture lisent le même document**, dans `households/{id}/expenses`. Il n’existe pas de collection de coûts dupliquée, de copie automatique ni de synchronisation fragile entre deux bases.

- Depuis Budget : choisir la nouvelle catégorie **Voiture**. La dépense apparaît aussi dans Voiture.
- Depuis Voiture : la catégorie est verrouillée sur Voiture. La dépense apparaît aussi dans Budget.
- Types disponibles : carburant, entretien, réparation, assurance, parking/péage, lavage, autre.
- Source de paiement : salaire de l’un des membres ou enveloppe existante, selon le fonctionnement actuel de Budget.
- Une dépense issue d’une enveloppe utilise la transaction existante : retrait du solde + mouvement + dépense. Sa suppression recrédite l’enveloppe une seule fois.
- Suppression depuis l’un ou l’autre espace : disparition dans les deux, puisqu’il s’agit du même document.
- Après avoir confirmé un entretien, ouvrir son entrée dans le carnet et **Saisir le coût dans Budget**. Le nom, la date et le kilométrage sont préremplis et la dépense liée à cette intervention. Un entretien ne génère pas de dépense inventée si aucun coût n’est saisi.

Les anciennes dépenses **Transport** ne sont pas reclassées automatiquement : il peut s’agir de taxis, bus ou autres transports. La charge fixe historique « Voiture » n’est pas copiée non plus afin de ne pas compter une réservation de budget comme une dépense réelle supplémentaire.

Les litres sont facultatifs. Le prix moyen affiché est `somme des montants des pleins avec litres / somme de ces litres`, sur le mois/filtre affiché. **Pas de consommation L/100 km estimée**, car il faudrait un vrai protocole plein-à-plein pour éviter un chiffre trompeur.

Le journal Budget existant reste limité aux 250 dernières dépenses, toutes catégories confondues. Voiture lit l’historique de sa catégorie puis filtre le mois localement : avec un très gros historique, une vieille ligne peut donc rester visible dans Voiture sans être dans la fenêtre de 250 lignes de Budget. Ce n’est pas une copie manquante. Une pagination du journal Budget est une amélioration distincte à envisager.

## Données et reprise technique

| Emplacement dans `households/{id}` | Usage |
| --- | --- |
| `vehicles/main` | Profil, `odometer` nullable, dates et assistance |
| `vehicleMileage/{id}` | `previous`, `value`, `mode`, note, auteur, date serveur ; entrées immuables |
| `vehicleTasks/{id}` | Nom, intervalles, point de départ, note, état actif |
| `vehicleServices/{id}` | Intervention, `taskId`, nom, kilométrage, date, garage, note |
| `expenses/{id}` | Dépense Budget existante avec `category: 'car'`, `vehicleId: 'main'`, `carKind`, `carOdometer`, `carLiters`, `carServiceId` |

Fichiers :

- `src/apps/car/CarApp.jsx` : écran et navigation interne, compteur animé, abonnements affichés.
- `src/apps/car/CarSheets.jsx` : formulaires et confirmations ; pas d’autofocus sur les champs, clavier/Escape et focus gérés pour les fenêtres.
- `src/apps/car/model.js` : calculs purs, dates locales, validation des métadonnées de dépenses.
- `src/apps/car/useCarData.js` : abonnements Firestore et états chargement/erreur ; les abonnements sont retirés au démontage.
- `src/services/car.js` : transactions compteur, profil, rappels, interventions.
- `src/apps/budget/components/ExpenseSheet.jsx` et `src/services/budget.js` : formulaire/service partagés pour garder un seul calcul de solde.
- `src/apps/registry.js` / `src/components/PortalTopBar.jsx` : entrée de la sixième application.

Les nouvelles collections ont des règles explicites réservées aux membres du foyer, avec types/plages/champs validés. La règle finale de refus global est conservée. Les photos, documents et factures numérisées ne sont pas ajoutés dans cette version. Aucune donnée existante n’est migrée ou supprimée lors de l’ouverture de Voiture.

## Vérifications avant livraison

La syntaxe JS/JSX des 14 fichiers modifiés/ajoutés a été vérifiée. Build, lint, tests métier et règles via émulateur restent à exécuter par le propriétaire :

```powershell
node --test scripts/car.test.js
npm run lint
npm run build:check
```

Puis tester avec les deux comptes :

1. Ouvrir les six cartes du Hub sur petit écran, Web et APK ; pas de débordement horizontal, deux cartes par ligne, animations réduites respectées.
2. Configurer la voiture, saisir 9 500 km, puis ajouter 500 km. Vérifier le compteur et l’historique sur le second compte.
3. Ouvrir une saisie absolue sur les deux comptes, sauvegarder sur l’un, puis tenter de sauvegarder l’ancienne valeur sur l’autre : refus attendu. Tester aussi une correction avec motif.
4. Configurer une vidange de test à 10 000 km ; confirmer à 10 000 puis vérifier la prochaine échéance à 20 000. Ajouter une entrée antidatée puis supprimer une entrée erronée : les prochaines échéances doivent suivre l’historique réel.
5. Tester un rappel uniquement calendaire, une fin de mois, une échéance déjà passée et une échéance d’assurance proche.
6. Ajouter une dépense Voiture depuis Budget, puis depuis Voiture. Vérifier que chaque action crée un seul document et un seul débit.
7. Tester le paiement avec une enveloppe insuffisante (refus), puis suffisante, puis supprimer depuis l’autre espace : solde restauré une seule fois. Tester les clics rapides et deux suppressions simultanées.
8. Dans le carnet, lier le coût d’un entretien ; vérifier son total, puis supprimer la dépense depuis Budget : le lien doit disparaître du carnet.
9. Tester sans connexion, les permissions Firebase manquantes, puis les règles avec un compte extérieur : aucune lecture/écriture des nouvelles collections ne doit être autorisée hors du foyer.

Un test de calcul ne remplace pas une validation visuelle sur téléphone ni un test des règles Firebase dans l’émulateur.
