const categoryAliases = {
  'fruits-legumes': 'fruit fruits vegetable vegetables produce legumes khodra khodar fawakih sou9',
  'boucherie-poissons': 'meat meats butcher fish seafood viande djaj l7em hout 7out sou9',
  'laitiers-oeufs': 'dairy milk cheese eggs laitier hlib fromage bid',
  boulangerie: 'bakery bread pastry boulangerie khobz patisserie',
  epicerie: 'grocery pantry dry goods epicerie moul hanout hanout',
  boissons: 'drink drinks beverage beverages boisson chrab',
  surgeles: 'frozen freezer surgele congele mjmed',
  'hygiene-beaute': 'hygiene beauty body care toilette soin jamal',
  entretien: 'cleaning household home menage lessive tsbin',
  bebe: 'baby babies infant bebe drari sghar',
  snacks: 'snack snacks biscuit biscuits chips goutter',
  pharmacie: 'pharmacy health medicine pharmacie sante dwa'
}

const aliasRules = [
  ['tomate', 'maticha mticha matich tomato tomatoes'],
  ['pommes de terre', 'btata batata potato potatoes patate'],
  ['oignon', 'bsla onion onions'],
  ['carotte', 'khizo khizou carrot carrots'],
  ['courgette', 'ger3a gr3a zucchini courgette'],
  ['aubergine', 'denjal eggplant aubergine'],
  ['poivron', 'felfla pepper peppers bell pepper'],
  ['concombre', 'khyar cucumber cucumbers'],
  ['laitue', 'khoss khes lettuce salad'],
  ['persil', 'maadnous m3dnous parsley'],
  ['coriandre', '9zbor qzbor kosbor coriander cilantro'],
  ['menthe', 'naanaa na3na3 mint'],
  ['ail', 'touma garlic'],
  ['citron', 'hamed 7amed lemon'],
  ['orange', 'limoun orange oranges'],
  ['banane', 'banana bananas'],
  ['pomme', 'tfa7 apple apples'],
  ['poire', 'bou3wid pear pears'],
  ['avocat', 'avocado avocados'],
  ['fraise', 'friz strawberry strawberries'],
  ['datte', 'tmar dates'],
  ['poulet', 'djaj chicken'],
  ['viande', 'l7em meat beef'],
  ['boeuf', 'l7em beef meat'],
  ['agneau', 'khrof lamb'],
  ['merguez', 'saucisse sausage'],
  ['dinde', 'bibi turkey'],
  ['poisson', 'hout 7out fish'],
  ['sardine', 'srdin sardines fish hout'],
  ['crevette', '9meron qmeron shrimp prawns'],
  ['calamar', 'kalamare squid'],
  ['lait', 'hlib milk'],
  ['raib', 'rayeb yogurt fermented milk'],
  ['lben', 'leben buttermilk'],
  ['yaourt', 'yogurt yoghurt danone'],
  ['fromage', 'jben cheese'],
  ['beurre', 'zebda butter'],
  ['oeuf', 'bid eggs egg'],
  ['pain', 'khobz bread loaf'],
  ['baguette', 'komira baguette bread'],
  ['farine', 'd9i9 flour'],
  ['semoule', 'smida semolina'],
  ['couscous', 'seksou kseksou couscous'],
  ['riz', 'roz rice'],
  ['pate', 'makarona pasta spaghetti'],
  ['lentille', '3dess adess lentils'],
  ['pois chiche', 'homs chickpea chickpeas'],
  ['haricot', 'loubia beans bean'],
  ['huile', 'zit oil'],
  ['sucre', 'sokkar skar snida sugar'],
  ['the', 'atay tea'],
  ['cafe', 'qahwa 9ahwa coffee'],
  ['thon', 'ton tuna'],
  ['sel', 'ml7 melha salt'],
  ['poivre', 'ibzar pepper spice'],
  ['cumin', 'kamoun cumin spice'],
  ['paprika', 'tahmira paprika spice'],
  ['eau', 'ma water'],
  ['jus', '3asir assir juice'],
  ['soda', 'monada limonade soft drink cola'],
  ['frites', 'frite fries chips potato'],
  ['nugget', 'nuggets chicken'],
  ['pizza', 'pizza'],
  ['glace', 'ice cream gelato'],
  ['biscuit', 'biscuit cookies cookie gateau'],
  ['chocolat', 'chocolate cocoa cacao'],
  ['shampooing', 'shampoo champo hair'],
  ['savon', 'saboun soap'],
  ['dentifrice', 'toothpaste snan dents'],
  ['brosse a dents', 'toothbrush snan'],
  ['papier toilette', 'toilet paper papier wc'],
  ['lessive', 'saboun makina detergent laundry tsbin'],
  ['liquide vaisselle', 'dish soap ma3en vaisselle'],
  ['javel', 'bleach jafil'],
  ['nettoyant', 'cleaner cleaning menage'],
  ['sac poubelle', 'trash bag garbage bag mika zbel'],
  ['couche', 'diaper diapers likoch baby'],
  ['lingette', 'wipes wipe'],
  ['medicament', 'medicine medication dwa'],
  ['vitamine', 'vitamin vitamins']
]
const searchTextCache = new WeakMap()

export function normalizeCatalogSearch(value = '') {
  return String(value)
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim()
}

function editDistance(first, second) {
  if (first === second) return 0
  if (!first.length) return second.length
  if (!second.length) return first.length
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index)
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex]
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const cost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] + cost
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[second.length]
}

function identityMatchesAlias(identity, needle) {
  const normalizedNeedle = normalizeCatalogSearch(needle)
  if (normalizedNeedle.includes(' ')) return ` ${identity} `.includes(` ${normalizedNeedle} `)
  return identity.split(' ').some((word) => word === normalizedNeedle || word === `${normalizedNeedle}s` || word === `${normalizedNeedle}es`)
}

export function getProductSearchText(product) {
  if (product && typeof product === 'object' && searchTextCache.has(product)) return searchTextCache.get(product)
  const identity = normalizeCatalogSearch(`${product?.name || ''} ${product?.altName || ''}`)
  const aliases = aliasRules
    .filter(([needle]) => identityMatchesAlias(identity, needle))
    .map(([, values]) => values)
    .join(' ')
  const searchText = normalizeCatalogSearch([
    product?.name,
    product?.altName,
    product?.brand,
    product?.format,
    product?.categoryName,
    product?.searchTags,
    categoryAliases[product?.category],
    aliases
  ].filter(Boolean).join(' '))
  if (product && typeof product === 'object') searchTextCache.set(product, searchText)
  return searchText
}

export function matchesProductSearch(product, query) {
  const needle = normalizeCatalogSearch(query)
  if (!needle) return true
  const haystack = getProductSearchText(product)
  if (haystack.includes(needle)) return true
  const haystackWords = haystack.split(' ').filter(Boolean)
  return needle.split(' ').filter(Boolean).every((word) => haystackWords.some((candidate) => (
    candidate.startsWith(word)
    || word.startsWith(candidate)
    || (word.length >= 4 && candidate.length >= 4 && Math.abs(word.length - candidate.length) <= 1 && editDistance(word, candidate) <= 1)
  )))
}

export function productSearchScore(product, query) {
  const needle = normalizeCatalogSearch(query)
  if (!needle) return 0
  const name = normalizeCatalogSearch(product?.name)
  const altName = normalizeCatalogSearch(product?.altName)
  const brand = normalizeCatalogSearch(product?.brand)
  const haystack = getProductSearchText(product)
  if (name === needle) return 100
  if (name.startsWith(needle)) return 80
  if (altName.includes(needle)) return 70
  if (brand.startsWith(needle)) return 60
  if (haystack.includes(needle)) return 50
  return matchesProductSearch(product, needle) ? 20 : 0
}
