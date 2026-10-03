const OUTER_WORDS = ['veste', 'manteau', 'blazer', 'gilet', 'cardigan', 'parka', 'trench', 'doudoune', 'cape', 'kimono']
const DRESS_WORDS = ['robe', 'combinaison', 'salopette', 'caftan', 'djellaba']
const BOTTOM_WORDS = ['pantalon', 'jean', 'jupe', 'short', 'legging', 'jogging']
const SHOE_WORDS = ['chaussure', 'basket', 'sneaker', 'botte', 'sandale', 'mocassin', 'talon']

function includesWord(item, words) {
  const text = `${item.category || ''} ${item.subcategory || ''} ${item.name || ''}`.toLocaleLowerCase('fr-FR')
  return words.some((word) => text.includes(word))
}

export function clothingSlot(item) {
  if (item.isComposite) return 'top'
  if (item.category === 'Robes' || includesWord(item, DRESS_WORDS)) return 'onepiece'
  if (item.category === 'Vestes' || includesWord(item, OUTER_WORDS)) return 'outer'
  if (item.category === 'Bas' || includesWord(item, BOTTOM_WORDS)) return 'bottom'
  if (item.category === 'Chaussures' || includesWord(item, SHOE_WORDS)) return 'shoes'
  if (item.category === 'Accessoires') return 'accessory'
  return 'top'
}

export function wardrobeBySlot(clothes) {
  return clothes.reduce((slots, item) => {
    slots[clothingSlot(item)].push(item)
    return slots
  }, { outer: [], top: [], bottom: [], onepiece: [], shoes: [], accessory: [] })
}

export const CLOTHING_CATEGORIES = ['Hauts', 'Bas', 'Robes', 'Vestes', 'Chaussures', 'Accessoires', 'Sport', 'Autre']

export const SUBCATEGORY_OPTIONS = {
  Hauts: ['T-shirt', 'Chemise', 'Blouse', 'Pull', 'Sweat', 'Top', 'Polo', 'Débardeur', 'Tunique', 'Body'],
  Bas: ['Pantalon', 'Jean', 'Jupe', 'Short', 'Legging', 'Jogging'],
  Robes: ['Robe', 'Combinaison', 'Salopette', 'Caftan', 'Takchita', 'Djellaba'],
  Vestes: ['Veste', 'Blazer', 'Gilet', 'Cardigan', 'Manteau', 'Trench', 'Parka', 'Doudoune', 'Cape', 'Kimono'],
  Chaussures: ['Baskets', 'Bottes', 'Bottines', 'Sandales', 'Mocassins', 'Talons', 'Escarpins', 'Babouches'],
  Accessoires: ['Sac', 'Ceinture', 'Écharpe', 'Foulard', 'Chapeau', 'Casquette', 'Bijou', 'Lunettes'],
  Sport: ['Haut de sport', 'Bas de sport', 'Veste de sport', 'Chaussures de sport', 'Ensemble de sport'],
  Autre: ['Autre'],
}
