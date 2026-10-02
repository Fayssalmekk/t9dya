import { pantryAssumptions } from '../data/ingredients.js'

const pantry = new Set(pantryAssumptions)

export function buildIngredientDeck(type, recipes, ingredients) {
  const counts = new Map()
  recipes.filter((recipe) => recipe.type === type).forEach((recipe) => {
    recipe.ingredients.forEach(({ ingredientId }) => {
      if (!pantry.has(ingredientId)) counts.set(ingredientId, (counts.get(ingredientId) || 0) + 1)
    })
  })
  return ingredients.filter((ingredient) => counts.has(ingredient.id))
    .sort((a, b) => counts.get(b.id) - counts.get(a.id) || a.name_fr.localeCompare(b.name_fr, 'fr'))
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
