const photos = {
  meal: ['1504674900247-0877df9cc836', '1547592180-85f173990554', '1551183053-bf91a1d81141', '1565958011703-44f9829ba187', '1473093295043-cdd812d0e601'],
  dessert: ['1578985545062-69928b1d9587', '1551024506-0bccd828d307', '1488477181946-6428a0291777', '1495474472287-4d71bcdd2085'],
  juice: ['1553530666-ba11a7da3888', '1600271886742-f049cd451bba', '1497534446932-c925b458314e']
}

const methods = {
  meal: (name) => [`Préparer et découper tous les ingrédients de ${name}.`, 'Cuire doucement en respectant l’ordre des ingrédients.', 'Rectifier l’assaisonnement puis servir bien chaud.'],
  dessert: (name) => [`Peser puis mélanger les ingrédients de ${name}.`, 'Cuire ou laisser prendre jusqu’à obtenir la bonne texture.', 'Laisser tiédir, décorer et servir.'],
  juice: (name) => [`Laver, éplucher et couper les fruits de ${name}.`, 'Mixer finement avec le liquide indiqué.', 'Goûter, ajuster la texture et servir très frais.']
}

export function makeRecipes(type, rows) {
  return rows.map(([id, name_fr, name_darija, origin, required, optional = '', prepTime = 30, difficulty = 'Facile', customSteps], index) => ({
    id, type, name_fr, name_darija, origin: origin === 'moroccan-street-food' ? 'moroccan' : origin,
    imageUrl: `https://images.unsplash.com/photo-${photos[type][index % photos[type].length]}?auto=format&fit=crop&w=900&q=82`,
    prepTime, difficulty,
    ingredients: [
      ...required.split(' ').filter(Boolean).map((ingredientId) => ({ ingredientId, required: true })),
      ...optional.split(' ').filter(Boolean).map((ingredientId) => ({ ingredientId, required: false }))
    ],
    steps: customSteps || methods[type](name_fr)
  }))
}
