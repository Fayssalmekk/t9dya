# IA : coûts, latence et réglages

Mise à jour : 5 octobre 2026. Implémentation : `api/ai.js`. Aucun changement de modèle imposé, aucun nouvel abonnement, aucune dépendance ajoutée.

## Ce qui économise réellement

- `suggest` envoie seulement les attributs utiles, avec des clés courtes. Plus de photos, URL, objets imbriqués, historique ou données inconnues. Les vrais statuts du dressing (`dirty`, `laundry`) sont filtrés avant l’appel.
- Le dressing transmis est limité à **120 vêtements / 16 000 octets UTF-8**, JSON complet. L’ancienne limite portait sur 30 000 caractères, sans plafond d’articles après validation. Les catégories sont alternées pour éviter qu’un dressing trié ne fournisse que des hauts.
- `tag` réutilise pendant **5 minutes** une analyse identique du même utilisateur sur la même instance serveur. Les requêtes identiques simultanées partagent un seul appel OpenAI. Un succès réutilisé ne consomme aucun nouvel appel OpenAI, mais Firebase vérifie toujours l’authentification.
- Le prompt `compose` ne répète plus les noms dans deux listes. Les règles de fidélité sont partagées par les trois actions image ; `combine` explicite maintenant aussi les manches roulées, fermetures, finitions et interdictions mains/cintre. Son texte peut donc être plus long qu’avant : ne pas sacrifier ces règles pour quelques tokens.
- Une seule image de sortie, explicitement `n=1`, comme le comportement précédent.

Pas de pourcentage d’économie promis sans mesures sur vos photos. Le cache n’aide que les répétitions ; `suggest` n’est actuellement pas appelé par l’interface Hwayj. Ces économies sur `suggest` profiteront à tout consommateur de cette action, mais ne réduisent pas le coût actuel de chaque génération d’image.

## Réglages conservés : pas de baisse visuelle automatique

| Action | Qualité / détail | Taille | Compression WebP | Plafond de sortie initial |
| --- | --- | --- | --- | --- |
| `enhance` | medium | 1024 × 1536 | 85 | — |
| `combine` | medium | 1024 × 1024 | 80 | — |
| `compose` | medium | 1024 × 1536 | 90 | — |
| `tag` | low | source inchangée | — | 300 tokens |
| `meal` | low | source inchangée | — | 450 tokens |
| `suggest` | — | — | — | 900 tokens |

Ces valeurs étaient déjà celles du serveur avant cette optimisation. `low` est déjà le niveau de détail vision le plus bas proposé ici ; il ne prouve pas une précision suffisante pour chaque photo. Les images source ne sont ni réduites ni recompressées davantage par ce changement. Une analyse vision en détail bas ne dégrade pas l’image affichée dans le dressing.

Réduire `output_compression` réduit principalement le poids transféré, **pas les tokens de génération de l’image**. Diminuer `quality` ou la taille peut réduire le coût image, mais peut perdre broderies, motifs, boutons, texture ou modifier le cadrage. Impossible de garantir « aucune différence visible » sans comparaison sur vos vêtements. Ces baisses sont donc uniquement des options explicites.

Toutes les références sont conservées, dans leur ordre initial : 1 pour `enhance`, 2–3 pour `combine`, 2–4 pour `compose`. Même deux images identiques peuvent représenter deux couches choisies : aucune référence n’est supprimée automatiquement.

## Variables facultatives

Configurer côté serveur uniquement dans `.env.local` et/ou Vercel. Ne jamais ajouter le préfixe `VITE_`. Aucun renommage des variables existantes.

### Images

Pour chacun des préfixes `OPENAI_ENHANCE`, `OPENAI_COMBINE`, `OPENAI_COMPOSE` :

- `_QUALITY` : défaut `medium`. Choisir une qualité prise en charge par le modèle, par exemple `low`, `medium`, `high`. `OPENAI_COMPOSE_QUALITY` existait déjà et reste prioritaire pour compose.
- `_SIZE` : `1024x1024`, `1024x1536` ou `1536x1024`. Défauts dans le tableau. Une autre valeur revient au défaut ; pas de `auto` afin de garder le coût/cadrage prévisible.
- `_COMPRESSION` : entier 0–100. Défauts 85 / 80 / 90. Une valeur faible peut rendre le fichier visiblement plus dégradé sans diminuer les tokens image.

Exemple d’essai volontaire : `OPENAI_ENHANCE_QUALITY=low`. Comparer visuellement, puis revenir à `medium` si les détails changent. Ne pas changer simultanément modèle, taille et qualité : impossible sinon d’identifier la cause.

### Vision, raisonnement et sortie JSON

- `OPENAI_TAG_DETAIL` et `OPENAI_MEAL_DETAIL` : `low` par défaut, ou `high` / `auto`. `high` peut aider pour les petits détails/portions mais coûte généralement plus cher. La facturation exacte dépend du modèle ; « low = toujours 85 tokens » n’est pas une règle universelle.
- `OPENAI_VISION_REASONING_EFFORT` et `OPENAI_TEXT_REASONING_EFFORT` : facultatifs, `none`, `minimal`, `low`, `medium`, `high`, ou `default` pour ne pas envoyer ce paramètre. N’utiliser qu’une valeur acceptée par votre modèle. Sans configuration, `gpt-5.4-nano` et ses snapshots datés utilisent explicitement `none`, qui est déjà son défaut documenté. Pour un autre modèle, le serveur n’invente pas une compatibilité et n’envoie rien. Passer de ce défaut `none` à `low` ajouterait du raisonnement, ce n’est pas une économie.
- `OPENAI_TAG_MAX_OUTPUT_TOKENS` : 300 par défaut, plage 300–4096.
- `OPENAI_MEAL_MAX_OUTPUT_TOKENS` : 450 par défaut, plage 450–4096.
- `OPENAI_SUGGEST_MAX_OUTPUT_TOKENS` : 900 par défaut, plage 900–8192.

Les plafonds ne sont pas des tokens facturés d’avance. Ils incluent la sortie visible **et** le raisonnement. Un plafond trop petit peut empêcher de produire le JSON. Les valeurs initiales existantes sont conservées : une réponse `incomplete` pour `max_output_tokens` déclenche au maximum **une** seconde tentative avec le double du plafond, dans un budget de 55 secondes partagé entre les deux appels OpenAI. Cette récupération coûte un appel supplémentaire quand elle se produit ; il vaut mieux augmenter le plafond initial si elle devient fréquente. Pas de retry automatique sur refus, quota, réseau ou erreur serveur.

Il est impossible de garantir que le fournisseur ne tronquera jamais une génération. Le serveur garantit plutôt de **ne jamais retourner un succès avec du JSON partiel ou hors schéma**. Si la seconde tentative échoue, une erreur existante (`OPENAI_ERROR` ou `AI_TIMEOUT`, notamment) est renvoyée. Les schémas et enums eux-mêmes sont inchangés. Un refus structuré utilise `CONTENT_BLOCKED`. Les codes des erreurs HTTP OpenAI restent traités comme avant.

### Dressing envoyé à `suggest`

| Clé courte | Champ source réel |
| --- | --- |
| id | id, conservé exactement |
| n | name |
| c | category |
| t | subcategory |
| co | colors |
| p | pattern |
| m | material |
| se | season |
| st | style |

Les textes sont limités à 80 caractères, les valeurs de listes à 40. Maximum 3 couleurs, 4 saisons et 6 styles, conformes aux limites des tags actuels. Valeurs vides, doublons dans ces listes, valeurs non textuelles et textes contenant une URL/Data URL sont supprimés. Les IDs ne sont jamais tronqués. Les doublons d’ID sont ignorés après le premier élément admissible.

`status` doit être `clean` ou absent pour les anciens documents. `dirty`, `laundry` et les statuts inconnus ne sont pas proposés. Les drapeaux explicites `clean:false`, `isClean:false`, `available:false`, `isAvailable:false`, `archived:true`, `deleted:true` sont aussi exclus si un consommateur les transmet. Ne pas déduire une indisponibilité de `lastWornAt` ou d’un calendrier. Aucune requête Firestore supplémentaire n’est ajoutée : le filtrage porte sur le payload reçu.

- `OPENAI_SUGGEST_MAX_ITEMS` : défaut 120, plage 3–1000.
- `OPENAI_SUGGEST_MAX_BYTES` : défaut 16000, plage 1024–100000. Compte les octets UTF-8 du tableau JSON, crochets et virgules inclus ; pas le prompt ni le schéma. On ajoute ou saute des objets entiers, jamais une tranche de JSON.

Le modèle ne peut choisir que les IDs du sous-ensemble envoyé ; une référence à un autre ID échoue avec `OPENAI_ERROR`. Si aucun vêtement admissible ne reste, `INVALID_WARDROBE` est renvoyé sans facturer OpenAI. Les trois propositions gardent les mêmes clés et IDs Firestore en sortie.

### Cache de tags

`OPENAI_TAG_CACHE_TTL_SECONDS` : défaut 300, plage 0–3600. `0` désactive à la fois le cache et la déduplication simultanée.

- Clé SHA-256 : UID authentifié, espace de clé API, TTL et requête OpenAI complète (image exacte, modèle, prompt, schéma, détail, raisonnement, plafond).
- Maximum 64 résultats de 16 Kio chacun et 64 requêtes en cours suivies. Éviction des résultats expirés puis du plus ancien si nécessaire.
- Seuls les résultats réussis et validés sont conservés. Les photos et clés API ne sont pas conservées dans les entrées terminées : uniquement le hash, le JSON des tags et l’expiration. Pas de journalisation des données santé, photos, jetons ou secrets.
- Aucun cache de repas, de compositions, de préparations d’image ou de suggestions. « Régénérer » continue à demander une nouvelle image.
- Aucun cache d’authentification ; un utilisateur révoqué/non autorisé ne peut pas obtenir un résultat mis en cache.
- Cache local à une instance Vercel : pas de persistance ni de partage entre instances, pas de Redis/Firestore payant. Un redéploiement/redémarrage repart à zéro. Pas une garantie contre tous les doubles appels à travers plusieurs instances.

## Changements pouvant influencer les résultats — liste explicite

1. **Reformulation des prompts image**, même avec toutes les règles conservées : un modèle génératif peut produire une variante différente. `combine` reçoit des consignes de fidélité plus complètes et décrit désormais la troisième couche lorsqu’elle existe. Comparaison visuelle nécessaire.
2. **Sous-ensemble de dressing, clés courtes et champs limités** : certains vêtements ou détails longs sont omis, donc les propositions peuvent changer. Augmenter les plafonds pour élargir le choix. `suggest` demande aussi des noms et raisons courts en français.
3. **Filtrage effectif des pièces sales/indisponibles** : change volontairement les candidats par rapport à l’ancien filtre qui ignorait `status`. Un dressing vide/admissible vide échoue sans appel payant au lieu d’inventer des tenues.
4. **Cache exact de tags** : répéter la même analyse pendant le TTL rend le même résultat, pas une nouvelle variante aléatoire. Ce cache ne peut pas détecter une erreur d’interprétation visuelle du modèle ; il évite de mélanger des photos/options/utilisateurs différents. Désactiver le TTL si une nouvelle analyse du même fichier est souhaitée à chaque clic.
5. **Validation des sorties et reprise de troncature** : des sorties auparavant acceptées malgré un mauvais schéma/ID sont rejetées ; une génération répétée après troncature peut produire un autre texte et coûte plus sur cette requête.
6. **Uniquement si vous changez les options** : baisser qualité/taille/compression peut perdre des détails ; réduire le raisonnement d’un autre modèle peut réduire sa justesse ; augmenter le détail vision peut changer les tags/estimations. Aucun de ces abaissements n’est activé par défaut. `none` pour le modèle nano configuré ne change pas son défaut documenté.

L’exception de présentation des chaussures dans `enhance` est conservée : une seule chaussure entière de profil extérieur, pointe à gauche. Les vêtements restent de face ; `combine` et `compose` restent strictement de face. La règle « jamais calculer ou recommander une dose d’insuline » reste dans `meal`.

## Validation à exécuter vous-même

Aucun appel réel OpenAI payant n’a été lancé pour cette optimisation. Les tests ci-dessous remplacent tous les accès réseau et ne nécessitent pas de vrais secrets :

```powershell
node --test scripts/ai.test.js
npm run lint
npm run build:check
```

Les tests couvrent schémas/enums/limites inchangés, gardes HTTP/auth, isolation/déduplication du cache, absence de cache sur erreur, reprise bornée, réponses JSON, filtrage et plafonds UTF-8 du dressing, options image, fidélité des références, refus de nouveaux IDs et absence de cache de repas/génération.

Puis comparer quelques vraies images **si vous acceptez leur coût** : vêtement uni, imprimé fin, broderie, manches roulées, veste ouverte, chaussure, tenue complète de 4 pièces ; repas avec petites portions ou ingrédients peu visibles. Vérifier intégralité, proportions, motifs et tags. Ne pas remplacer une validation visuelle par les seuls tests mockés.

## Autres pistes (non activées)

- Conserver/réutiliser les tags déjà enregistrés dans Firestore quand seule une information manuelle change ; ne relancer l’analyse qu’après un changement réel d’image.
- Éviter les clics multiples côté interface pendant une génération. Une idempotence persistante pour les images serait utile, mais nécessite un identifiant de demande et doit distinguer « réessayer un appel perdu » de « régénérer une variante » : ne pas la simuler avec un hash d’image seul.
- Comparer un preset image `low` sur des vêtements simples ; garder `medium` pour motifs, broderies et superpositions. Pas de bascule automatique sans critères et validation.
- Réduire les bordures vides des références avant vision peut aider la lisibilité, mais uniquement avec une détection fiable qui ne coupe aucun vêtement. Ne pas ajouter une recompression aveugle.
- Mesurer à terme `usage` OpenAI et la durée par action, sans journaliser les photos/prompts/secrets, afin de mesurer le vrai gain et les retries. Aucune télémétrie supplémentaire n’est activée ici.
- Pour une migration vers un autre modèle, comparer les tarifs actuels et quelques exemples avant de changer `OPENAI_IMAGE_MODEL` / `OPENAI_VISION_MODEL` / `OPENAI_TEXT_MODEL`. Pas de changement automatique vers un modèle moins précis.
- Une limite budgétaire affichée dans un tableau de bord ne doit pas être présumée être un coupe-circuit. Le handler n’ajoute pas de quota interne et ne modifie pas votre politique d’accès.

Références officielles : [images et compression](https://developers.openai.com/api/docs/guides/image-generation), [raisonnement et troncature](https://developers.openai.com/api/docs/guides/reasoning), [efforts supportés par GPT-5.4 nano](https://developers.openai.com/api/docs/models/gpt-5.4-nano).
