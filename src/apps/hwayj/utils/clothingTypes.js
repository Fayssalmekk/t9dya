const SPORT_SLOTS = {
  'Haut de sport': 'top',
  'Bas de sport': 'bottom',
  'Veste de sport': 'outer',
  'Chaussures de sport': 'shoes',
  'Ensemble de sport': 'onepiece',
}

export function clothingSlot(item) {
  if (item.isComposite) return 'top'
  if (item.category === 'Hauts') return 'top'
  if (item.category === 'Robes') return 'onepiece'
  if (item.category === 'Vestes') return 'outer'
  if (item.category === 'Bas') return 'bottom'
  if (item.category === 'Chaussures') return 'shoes'
  if (item.category === 'Accessoires') return 'accessory'
  if (item.category === 'Sport') return SPORT_SLOTS[item.subcategory] || 'unclassified'
  return 'unclassified'
}

export function wardrobeBySlot(clothes) {
  return clothes.reduce((slots, item) => {
    slots[clothingSlot(item)].push(item)
    return slots
  }, { outer: [], top: [], bottom: [], onepiece: [], shoes: [], accessory: [], unclassified: [] })
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
