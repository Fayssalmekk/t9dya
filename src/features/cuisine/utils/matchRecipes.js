import { pantryAssumptions } from '../data/ingredients.js'

const pantry = new Set(pantryAssumptions)

const commonAvailability = {
  oignon: 0.98, tomate: 0.96, ail: 0.94, 'pomme-terre': 0.92, oeuf: 0.9,
  persil: 0.84, coriandre: 0.84, lait: 0.82, farine: 0.82, sucre: 0.8,
  carotte: 0.78, citron: 0.78, beurre: 0.74, fromage: 0.72, riz: 0.72,
  pates: 0.72, pain: 0.7, cumin: 0.86, paprika: 0.82, gingembre: 0.78,
  curcuma: 0.76, poulet: 0.66, olive: 0.66, yaourt: 0.64
}

export function buildIngredientDeck(type, recipes, ingredients, availabilityStats = {}) {
  const counts = new Map()
  recipes.filter((recipe) => recipe.type === type).forEach((recipe) => {
    recipe.ingredients.forEach(({ ingredientId }) => {
      if (!pantry.has(ingredientId)) counts.set(ingredientId, (counts.get(ingredientId) || 0) + 1)
    })
  })
  const maximumPopularity = Math.max(...counts.values(), 1)
  const score = (ingredient) => {
    const prior = commonAvailability[ingredient.id] ?? 0.45
    const history = availabilityStats[ingredient.id] || { yes: 0, no: 0 }
    const total = history.yes + history.no
    const learnedAvailability = (history.yes + prior * 4) / (total + 4)
    const recipePopularity = counts.get(ingredient.id) / maximumPopularity
    return learnedAvailability * 0.62 + recipePopularity * 0.38
  }
  return ingredients.filter((ingredient) => counts.has(ingredient.id))
    .sort((a, b) => score(b) - score(a) || counts.get(b.id) - counts.get(a.id) || a.name_fr.localeCompare(b.name_fr, 'fr'))
}

export function matchRecipes(type, ownedIds, recipes, ingredientsById, threshold = 0.6) {
  const owned = new Set([...ownedIds, ...pantryAssumptions])
  return recipes.filter((recipe) => recipe.type === type).map((recipe) => {
    const requiredIds = recipe.ingredients.filter((item) => item.required).map((item) => item.ingredientId)
    const optionalIds = recipe.ingredients.filter((item) => !item.required).map((item) => item.ingredientId)
    const requiredOwned = requiredIds.filter((id) => owned.has(id))
    const missingIds = requiredIds.filter((id) => !owned.has(id))
    const ratio = requiredIds.length ? requiredOwned.length / requiredIds.length : 1
    const optionalRatio = optionalIds.length ? optionalIds.filter((id) => owned.has(id)).length / optionalIds.length : 0
    return {
      ...recipe,
      matchPercent: Math.round(ratio * 100),
      rankScore: ratio + optionalRatio * 0.05,
      readiness: missingIds.length === 0 ? 'ready' : missingIds.length <= 2 ? 'almost' : 'partial',
      ownedIngredients: requiredOwned.map((id) => ingredientsById[id]).filter(Boolean),
      missingIngredients: missingIds.map((id) => ingredientsById[id]).filter(Boolean)
    }
  }).filter((recipe) => recipe.matchPercent >= threshold * 100)
    .sort((a, b) => (a.readiness === 'ready' ? -1 : 0) - (b.readiness === 'ready' ? -1 : 0) || b.rankScore - a.rankScore || a.prepTime - b.prepTime)
}
