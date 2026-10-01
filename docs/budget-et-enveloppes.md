# Budget et enveloppes du foyer

Les pages **Charges** et **Enveloppes** ont chacune leur propre icône dans la barre de navigation. Toutes les modifications sont partagées en temps réel entre les deux comptes du foyer.

## Première utilisation

Lors de la première ouverture, T9dya prépare une seule fois :

- Crédit : 2 400 DH;
- Loyer : 2 800 DH;
- Eau + Wi-Fi : 1 000 DH;
- Home Fayssal : 2 000 DH;
- Home Salma : 3 500 DH;
- Voiture : montant à définir;
- les enveloppes Épargne, Laser et Assurance avec un solde initial de 0 DH.

Chaque élément reste modifiable ou supprimable. Les nouvelles charges et enveloppes se créent avec le bouton **Ajouter** ou **Créer**.

## Budget T9dya automatique

La ligne **T9dya · Courses** reprend automatiquement le budget mensuel des courses déjà défini dans l’application. Les dépenses viennent des produits marqués comme achetés avec un prix confirmé. Il ne faut donc pas les saisir une deuxième fois.

## Charges mensuelles

1. Ouvrez directement **Charges** depuis la barre du bas.
2. Appuyez sur le crayon pour modifier le montant ou le jour prévu.
3. Cochez une charge lorsqu’elle est réglée.
4. Utilisez les flèches du mois pour consulter ou corriger un autre mois.

Le statut payé est propre à chaque mois. Décocher une charge annule seulement son règlement pour le mois affiché.

## Enveloppes

1. Appuyez sur **Alimenter** pour ajouter de l’argent.
2. Appuyez sur **Retirer** pour enregistrer une utilisation.
3. Ajoutez une note pour garder la raison du mouvement.
4. Utilisez le crayon pour changer le nom, l’icône, la couleur ou l’objectif.

Une enveloppe contenant encore de l’argent ne peut pas être supprimée. Retirez d’abord son solde; l’historique de ses anciens mouvements restera conservé.

## Mise à jour Firebase obligatoire

Cette fonctionnalité utilise de nouvelles collections Firestore. Depuis PowerShell, à la racine du projet, exécutez :

```powershell
npx firebase deploy --only firestore:rules,firestore:indexes
```

Attendez le message `Deploy complete!`, puis rechargez T9dya. Si la page affiche **permissions insuffisantes**, vérifiez le projet actif avec :

```powershell
npx firebase use
```
