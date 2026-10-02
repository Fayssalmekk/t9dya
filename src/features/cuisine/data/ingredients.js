const mealDbImage = (name) => `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name.replaceAll(' ', '_'))}-Small.png`

const rows = [
  ['tomate', 'Tomate', 'Maticha', 'vegetable', 'Tomato', '🍅'], ['oignon', 'Oignon', 'Besla', 'vegetable', 'Onion', '🧅'],
  ['ail', 'Ail', 'Touma', 'vegetable', 'Garlic', '🧄'], ['pomme-terre', 'Pomme de terre', 'Btata', 'vegetable', 'Potatoes', '🥔'],
  ['carotte', 'Carotte', 'Khizou', 'vegetable', 'Carrots', '🥕'], ['courgette', 'Courgette', 'Graa khdra', 'vegetable', 'Zucchini', '🥒'],
  ['aubergine', 'Aubergine', 'Danjal', 'vegetable', 'Aubergine', '🍆'], ['poivron', 'Poivron', 'Felfla', 'vegetable', 'Red Pepper', '🫑'],
  ['chou-fleur', 'Chou-fleur', 'Chiflor', 'vegetable', 'Cauliflower', '🥦'], ['petit-pois', 'Petits pois', 'Jelbana', 'vegetable', 'Peas', '🫛'],
  ['navet', 'Navet', 'Left', 'vegetable', 'Turnips', '🥬'], ['courge', 'Courge', 'Graa hamra', 'vegetable', 'Pumpkin', '🎃'],
  ['epinard', 'Épinards', 'Salk', 'vegetable', 'Spinach', '🥬'], ['champignon', 'Champignons', 'Fetr', 'vegetable', 'Mushrooms', '🍄'],
  ['salade', 'Salade verte', 'Khess', 'vegetable', 'Lettuce', '🥬'], ['concombre', 'Concombre', 'Khiyar', 'vegetable', 'Cucumber', '🥒'],
  ['betterave', 'Betterave', 'Barba', 'vegetable', 'Beetroot', '🟣'], ['mais', 'Maïs', 'Dra', 'vegetable', 'Sweetcorn', '🌽'],
  ['persil', 'Persil', 'Maadnous', 'herb', 'Parsley', '🌿'], ['coriandre', 'Coriandre', 'Kezbour', 'herb', 'Coriander', '🌿'],
  ['menthe', 'Menthe', 'Naanaa', 'herb', 'Mint', '🌿'], ['basilic', 'Basilic', 'Hbaq', 'herb', 'Basil', '🌿'],
  ['poulet', 'Poulet', 'Djej', 'meat', 'Chicken', '🍗'], ['boeuf', 'Bœuf', 'Lhem lbeqri', 'meat', 'Beef', '🥩'],
  ['viande-hachee', 'Viande hachée', 'Kefta', 'meat', 'Minced Beef', '🥩'], ['agneau', 'Agneau', 'Lhem lghenmi', 'meat', 'Lamb', '🍖'],
  ['thon', 'Thon', 'Ton', 'fish', 'Tuna', '🐟'], ['poisson', 'Poisson', 'Hout', 'fish', 'White Fish', '🐟'],
  ['crevette', 'Crevettes', 'Krevet', 'fish', 'Prawns', '🦐'], ['sardine', 'Sardines', 'Sardine', 'fish', 'Sardines', '🐟'],
  ['calamar', 'Calamars', 'Kalamar', 'fish', 'Squid', '🦑'], ['foie', 'Foie', 'Kebda', 'meat', 'Beef Liver', '🥩'],
  ['khlii', 'Khlii', 'Khlii', 'meat', 'Beef', '🥓'], ['oeuf', 'Œufs', 'Bayd', 'dairy', 'Eggs', '🥚'],
  ['lait', 'Lait', 'Hlib', 'dairy', 'Milk', '🥛'], ['yaourt', 'Yaourt', 'Danone', 'dairy', 'Yoghurt', '🥣'],
  ['beurre', 'Beurre', 'Zebda', 'dairy', 'Butter', '🧈'], ['fromage', 'Fromage', 'Fromaj', 'dairy', 'Cheese', '🧀'],
  ['creme', 'Crème fraîche', 'Crème', 'dairy', 'Single Cream', '🥛'], ['riz', 'Riz', 'Roz', 'grain', 'Rice', '🍚'],
  ['pates', 'Pâtes', 'Pasta', 'grain', 'Spaghetti', '🍝'], ['semoule', 'Semoule', 'Smida', 'grain', 'Semolina', '🌾'],
  ['farine', 'Farine', 'Dqiq', 'grain', 'Flour', '🌾'], ['pain', 'Pain', 'Khobz', 'grain', 'Bread', '🥖'],
  ['vermicelle', 'Vermicelles', 'Chaaria', 'grain', 'Vermicelli', '🍜'], ['orge', 'Orge', 'Chaaïr', 'grain', 'Pearl Barley', '🌾'],
  ['lentille', 'Lentilles', 'Aadess', 'legume', 'Lentils', '🫘'], ['pois-chiche', 'Pois chiches', 'Hommess', 'legume', 'Chickpeas', '🫘'],
  ['haricot-blanc', 'Haricots blancs', 'Loubia', 'legume', 'White Beans', '🫘'], ['haricot-vert', 'Haricots verts', 'Loubia khadra', 'vegetable', 'Green Beans', '🫛'],
  ['artichaut', 'Artichauts', 'Qoq', 'vegetable', 'Artichoke', '🌿'],
  ['olive', 'Olives', 'Zitoune', 'other', 'Olives', '🫒'], ['pruneau', 'Pruneaux', 'Barqouq', 'fruit', 'Prunes', '🟤'],
  ['raisin-sec', 'Raisins secs', 'Zbib', 'fruit', 'Raisins', '🍇'], ['amande', 'Amandes', 'Louze', 'nut', 'Almonds', '🌰'],
  ['cacahuete', 'Cacahuètes', 'Kawkaw', 'nut', 'Peanuts', '🥜'], ['noix', 'Noix', 'Gargaa', 'nut', 'Walnuts', '🌰'],
  ['orange', 'Orange', 'Limoun', 'fruit', 'Orange', '🍊'], ['citron', 'Citron', 'Hamed', 'fruit', 'Lemon', '🍋'],
  ['banane', 'Banane', 'Banane', 'fruit', 'Banana', '🍌'], ['pomme', 'Pomme', 'Teffah', 'fruit', 'Apple', '🍎'],
  ['fraise', 'Fraise', 'Fraise', 'fruit', 'Strawberries', '🍓'], ['avocat', 'Avocat', 'Avocat', 'fruit', 'Avocado', '🥑'],
  ['pasteque', 'Pastèque', 'Dellah', 'fruit', 'Watermelon', '🍉'], ['melon', 'Melon', 'Bettikh', 'fruit', 'Melon', '🍈'],
  ['mangue', 'Mangue', 'Manga', 'fruit', 'Mango', '🥭'], ['ananas', 'Ananas', 'Ananas', 'fruit', 'Pineapple', '🍍'],
  ['kiwi', 'Kiwi', 'Kiwi', 'fruit', 'Kiwi', '🥝'], ['datte', 'Dattes', 'Tmer', 'fruit', 'Dates', '🌴'],
  ['peche', 'Pêche', 'Khokh', 'fruit', 'Peaches', '🍑'], ['poire', 'Poire', 'Njas', 'fruit', 'Pears', '🍐'],
  ['cafe', 'Café', 'Qahwa', 'drink', 'Coffee', '☕'], ['chocolat', 'Chocolat', 'Chokola', 'dessert', 'Dark Chocolate', '🍫'],
  ['caramel', 'Caramel', 'Caramel', 'dessert', 'Caramel Sauce', '🍮'],
  ['cacao', 'Cacao', 'Kakao', 'dessert', 'Cocoa', '🍫'], ['sucre', 'Sucre', 'Sokkar', 'pantry', 'Sugar', '🧂'],
  ['miel', 'Miel', 'Aassel', 'dessert', 'Honey', '🍯'], ['levure', 'Levure', 'Khmira', 'baking', 'Yeast', '🧁'],
  ['vanille', 'Vanille', 'Vanille', 'baking', 'Vanilla', '🌼'], ['cannelle', 'Cannelle', 'Qerfa', 'spice', 'Cinnamon', '🟤'],
  ['gingembre', 'Gingembre', 'Skinjbir', 'spice', 'Ginger', '🫚'], ['cumin', 'Cumin', 'Kamoun', 'spice', 'Cumin', '🟤'],
  ['paprika', 'Paprika', 'Tahmira', 'spice', 'Paprika', '🌶️'], ['curcuma', 'Curcuma', 'Kharkoum', 'spice', 'Turmeric', '🟡'],
  ['sel', 'Sel', 'Melha', 'pantry', 'Salt', '🧂'], ['poivre', 'Poivre', 'Ibzar', 'pantry', 'Black Pepper', '⚫'],
  ['huile', 'Huile', 'Zit', 'pantry', 'Olive Oil', '🫒'], ['eau', 'Eau', 'Ma', 'pantry', 'Water', '💧']
]

export const ingredients = rows.map(([id, name_fr, name_darija, category, imageName, emoji]) => ({
  id, name_fr, name_darija, category, imageUrl: mealDbImage(imageName), emoji
}))

export const ingredientsById = Object.fromEntries(ingredients.map((ingredient) => [ingredient.id, ingredient]))
export const pantryAssumptions = ['sel', 'poivre', 'huile', 'eau']
