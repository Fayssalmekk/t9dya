# Voiture — installation et fonctionnement

## Ce qui est disponible

Le Hub présente désormais **six applications, deux cartes par ligne**, même sur mobile. T9dya utilise l’icône panier. Voiture s’ouvre à `/voiture` et comporte quatre sections :

1. **Tableau de bord** : compteur animé, dépenses du mois, checklist d’entretien actualisable par IA, échéances d’assurance/contrôle technique et raccourci assistance.
2. **Plan entretien** : page pédagogique séparant les priorités IA, les intervalles confirmés par le foyer et le carnet réel ; rappels regroupés en « à traiter » et « à venir ».
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
3. Touchez le pictogramme de voiture dans la grande carte. Complétez le nom, la marque, le modèle, la finition, l’année, le moteur, le carburant, le type et la référence exacte de boîte, le marché et la première mise en circulation. La plaque, la couleur, les échéances de documents et l’assistance restent privées et ne servent pas à l’analyse IA.
4. Cliquez sur **Renseigner mon kilométrage** et saisissez la valeur réelle du tableau de bord. Il n’y a pas de kilométrage fictif à 0 ; avant la première saisie, le compteur affiche des tirets.
5. Configurez les intervalles connus selon votre carnet et les indications du garage. Ils permettent d’afficher des kilomètres/jours restants fiables dans la checklist IA.
6. Sous le compteur, cliquez sur **Rechercher mon plan sur le Web**. Cette action est volontaire et n’est jamais lancée automatiquement.

La checklist utilise la configuration OpenAI serveur déjà employée par Hwayj et S7a : `OPENAI_TEXT_MODEL` et `OPENAI_API_KEY`. Aucune clé n’est incluse dans le navigateur ou l’APK. Il n’y a ni nouvelle dépendance ni Cloud Storage. La requête des dépenses Voiture utilise seulement l’égalité `category == 'car'`, sans index composite spécifique.

### Checklist IA et consommation

- La première analyse, ou une modification de marque/modèle/finition/année/moteur/carburant/boîte/marché, effectue une recherche Web OpenAI avec un contexte de recherche `low`. Les références techniques et leurs liens cliquables sont stockés dans `vehicleAiPlans/current`.
- Une simple évolution du kilométrage, de la date ou du carnet réutilise cette recherche stockée : un petit appel texte recalcule seulement les priorités. Si rien n’a changé, aucun appel OpenAI n’est fait.
- La requête est bornée : fiche technique, première mise en circulation, kilométrage, maximum 20 échéances et la dernière intervention de maximum 28 tâches/catégories. Plaque, couleur, photos, dépenses, noms des membres et longues notes ne sont jamais envoyés.
- La checklist affiche de 1 à 6 éléments pertinents, sans carte de remplissage. Par défaut, une opération kilométrique située à plus de 15 000 km est conservée dans la recherche mais masquée. Ainsi, une intervention à 60 000 km n’apparaît pas quand le compteur affiche 5 000 km. Une échéance calendaire reste toutefois visible si elle arrive dans les 90 jours.
- `OPENAI_CAR_HORIZON_KM` règle cette fenêtre (15 000 par défaut, 3 000–50 000). La réduire économise peu de tokens mais masque plus tôt des opérations ; l’augmenter rend la liste plus préventive mais plus chargée.
- `OPENAI_CAR_MAX_OUTPUT_TOKENS=1400` couvre les priorités réutilisant la recherche. `OPENAI_CAR_RESEARCH_MAX_OUTPUT_TOKENS=2400` couvre la première recherche structurée.
- La recherche Web utilise `OPENAI_CAR_WEB_MODEL` si présent, sinon `OPENAI_TEXT_MODEL`. `OPENAI_CAR_REASONING_EFFORT=low` est le défaut pour mieux interpréter les sources ; `none` peut réduire le raisonnement mais dégrader la sélection et l’interprétation des intervalles.
- L’IA classe et explique les checks. Une règle saisie dans **Plan entretien** et l’historique réel priment. Pneus et freins restent des contrôles d’état sauf source autoritaire explicite ; aucune usure ni intervention effectuée n’est inventée.
- Si l’IA renvoie un lien de rappel inconnu ou réutilise le même rappel pour deux checks, le serveur retire uniquement ce lien douteux ; le check reste visible en mode « à confirmer » au lieu de provoquer un nouvel appel payant.
- Cocher ouvre toujours une confirmation date/kilométrage. La validation est ajoutée au carnet et à l’historique de la prochaine analyse. Toucher une case déjà cochée propose de retirer l’entrée.
- Après un changement de compteur, d’intervalle ou d’historique, l’ancien plan reste visible avec la mention **à actualiser**. Après un changement technique de voiture, l’ancien plan est masqué et une nouvelle recherche Web est demandée.

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
| `vehicleAiPlans/current` | Entrée compacte, priorités, recherche technique réutilisable, sources Web cliquables, empreinte de la voiture et version partagée |
| `vehicleAiServices/{version-catégorie}` | Check IA réellement confirmé, date/km, lien éventuel vers un rappel et auteur |
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

La syntaxe JS/JSX des fichiers modifiés/ajoutés a été vérifiée. Build, lint, tests métier et règles via émulateur restent à exécuter par le propriétaire :

```powershell
node --test scripts/car.test.js
npm run lint
npm run build:check
```

Puis tester avec les deux comptes :

1. Ouvrir les six cartes du Hub sur petit écran, Web et APK ; pas de débordement horizontal, deux cartes par ligne, animations réduites respectées.
2. Configurer la voiture, saisir 9 500 km, puis ajouter 500 km. Vérifier le compteur et l’historique sur le second compte.
3. Ouvrir une saisie absolue sur les deux comptes, sauvegarder sur l’un, puis tenter de sauvegarder l’ancienne valeur sur l’autre : refus attendu. Tester aussi une correction avec motif.
4. Sous le compteur, lancer la recherche Web. Vérifier 1 à 6 priorités, les liens de sources et l’absence d’une opération lointaine à 60 000 km avec un compteur à 5 000 km. Recliquez sans modifier les données : le message doit confirmer qu’aucun token n’a été consommé.
5. Confirmer un check avec date/km : la case devient verte, l’entrée apparaît dans le carnet et le plan indique qu’il doit être actualisé. Toucher de nouveau la case puis confirmer la suppression doit l’enlever sans supprimer une éventuelle dépense Budget.
6. Sur les deux comptes, actualiser presque simultanément puis essayer de confirmer un ancien plan : la sauvegarde obsolète doit être refusée. Vérifier ensuite que le plan courant est identique sur les deux téléphones.
7. Configurer une vidange de test à 10 000 km ; confirmer à 10 000 puis vérifier la prochaine échéance à 20 000. Ajouter une entrée antidatée puis supprimer une entrée erronée : les prochaines échéances doivent suivre l’historique réel.
8. Tester un rappel uniquement calendaire, une fin de mois, une échéance déjà passée et une échéance d’assurance proche.
9. Ajouter une dépense Voiture depuis Budget, puis depuis Voiture. Vérifier que chaque action crée un seul document et un seul débit.
10. Tester le paiement avec une enveloppe insuffisante (refus), puis suffisante, puis supprimer depuis l’autre espace : solde restauré une seule fois. Tester les clics rapides et deux suppressions simultanées.
11. Dans le carnet, lier le coût d’un entretien ; vérifier son total, puis supprimer la dépense depuis Budget : le lien doit disparaître du carnet.
12. Tester sans connexion, les permissions Firebase manquantes, puis les règles avec un compte extérieur : aucune lecture/écriture des nouvelles collections ne doit être autorisée hors du foyer.

Un test de calcul ne remplace pas une validation visuelle sur téléphone ni un test des règles Firebase dans l’émulateur.
