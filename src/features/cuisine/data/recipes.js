import { mealRecipes } from './recipes.meals.js'
import { dessertRecipes } from './recipes.desserts.js'
import { juiceRecipes } from './recipes.juices.js'

export const recipes = [...mealRecipes, ...dessertRecipes, ...juiceRecipes]
export { mealRecipes, dessertRecipes, juiceRecipes }
