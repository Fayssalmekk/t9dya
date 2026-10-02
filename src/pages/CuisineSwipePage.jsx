import { useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { ChefHat } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import CategoryPicker from '../features/cuisine/components/CategoryPicker'
import SwipeDeck from '../features/cuisine/components/SwipeDeck'
import ResultsList from '../features/cuisine/components/ResultsList'
import RecipeDetail from '../features/cuisine/components/RecipeDetail'
import { ingredients, ingredientsById } from '../features/cuisine/data/ingredients'
import { recipes } from '../features/cuisine/data/recipes'
import { buildIngredientDeck, matchRecipes } from '../features/cuisine/utils/matchRecipes'
import { useShopping } from '../context/ShoppingContext'
import { useAuth } from '../context/AuthContext'
import { usePlatform } from '../context/PlatformContext'
import { addShoppingItem } from '../services/shopping'

const STORAGE_KEY = 't9dya-cuisine-session-v1'
const STATS_KEY = 't9dya-cuisine-availability-v1'

function readSession() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return value?.type && Array.isArray(value.decisions) ? value : null
  } catch { return null }
}

function readAvailabilityStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {} } catch { return {} }
}

export default function CuisineSwipePage() {
  const { user, household } = useAuth()
  const { lists, activeList, allItems } = useShopping()
  const { notify } = usePlatform()
  const [savedSession, setSavedSession] = useState(readSession)
  const [availabilityStats, setAvailabilityStats] = useState(readAvailabilityStats)
  const [type, setType] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [sessionCommitted, setSessionCommitted] = useState(false)
  const [step, setStep] = useState('category')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [adding, setAdding] = useState(false)

  const deck = useMemo(() => type ? buildIngredientDeck(type, recipes, ingredients, availabilityStats) : [], [availabilityStats, type])
  const ownedIds = useMemo(() => decisions.filter((item) => item.hasIt).map((item) => item.id), [decisions])
  const results = useMemo(() => type ? matchRecipes(type, ownedIds, recipes, ingredientsById) : [], [ownedIds, type])

  const persist = (nextType, nextDecisions, committed = false) => {
    const session = { type: nextType, decisions: nextDecisions, index: nextDecisions.length, committed, savedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setSavedSession(session)
  }
  const commitAnswers = (answers) => {
    const nextStats = { ...readAvailabilityStats() }
    answers.forEach(({ id, hasIt }) => {
      const previous = nextStats[id] || { yes: 0, no: 0 }
      nextStats[id] = { yes: previous.yes + (hasIt ? 1 : 0), no: previous.no + (hasIt ? 0 : 1) }
    })
    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats))
    setAvailabilityStats(nextStats)
  }
  const choose = (nextType) => { setType(nextType); setDecisions([]); setSessionCommitted(false); setStep('swipe'); persist(nextType, []) }
  const decide = (id, hasIt) => {
    const currentScroll = window.scrollY
    const next = [...decisions, { id, hasIt }]
    setDecisions(next)
    if (next.length >= deck.length) {
      commitAnswers(next)
      setSessionCommitted(true)
      persist(type, next, true)
      setStep('results')
    } else persist(type, next)
    window.requestAnimationFrame(() => window.scrollTo(0, currentScroll))
  }
  const undo = () => { const next = decisions.slice(0, -1); setDecisions(next); persist(type, next) }
  const finishSession = () => {
    if (!sessionCommitted) commitAnswers(decisions)
    setSessionCommitted(true)
    persist(type, decisions, true)
    setStep('results')
  }
  const restart = () => { setDecisions([]); setSessionCommitted(false); setStep('swipe'); persist(type, []) }
  const changeCategory = () => { setType(null); setDecisions([]); setSessionCommitted(false); setStep('category') }
  const resume = () => {
    const restoredDeck = buildIngredientDeck(savedSession.type, recipes, ingredients, availabilityStats)
    setType(savedSession.type)
    setDecisions(savedSession.decisions)
    setSessionCommitted(Boolean(savedSession.committed))
    setStep(savedSession.committed || savedSession.decisions.length >= restoredDeck.length ? 'results' : 'swipe')
  }

  const addMissing = async (recipe, listId) => {
    if (!household?.id || !user || !listId) return
    setAdding(true)
    try {
      for (const ingredient of recipe.missingIngredients) {
        const productId = `cuisine-${ingredient.id}`
        const duplicate = allItems.find((item) => item.listId === listId && item.productId === productId)
        await addShoppingItem(household.id, listId, {
          id: productId, name: ingredient.name_fr, altName: ingredient.name_darija || '', brand: '', format: '',
          category: ingredient.category, categoryName: 'Cuisine', emoji: ingredient.emoji, defaultPrice: 0, unit: 'pièce'
        }, user, { quantity: 1, unit: 'pièce', note: `Pour ${recipe.name_fr}` }, duplicate)
      }
      notify(`${recipe.missingIngredients.length} ingrédient${recipe.missingIngredients.length > 1 ? 's ajoutés' : ' ajouté'} à la liste.`)
      setSelectedRecipe(null)
    } catch {
      notify('Impossible d’ajouter les ingrédients. Vérifiez la connexion.')
    } finally { setAdding(false) }
  }

  return <main className={`cuisine-page mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 sm:px-6 ${step === 'swipe' ? 'cuisine-swipe-mode pt-3' : 'pt-6'}`}>
    <AppHeader title="Chnou nṭayab ?" subtitle={step === 'swipe' ? null : 'Des idées avec ce qu’on a déjà'} />
    {step !== 'swipe' && <div className="mb-5 flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 dark:from-orange-950 dark:to-amber-950"><ChefHat /></span><p className="text-sm text-muted"><strong className="block text-ink">Cuisine Swipe</strong>Pas de gaspillage, juste de bonnes idées.</p></div>}
    <AnimatePresence mode="wait">
      <Motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.2 }}>
        {step === 'category' && <CategoryPicker onChoose={choose} savedSession={savedSession} onResume={resume} />}
        {step === 'swipe' && <SwipeDeck deck={deck} index={decisions.length} decisions={decisions} onDecide={decide} onUndo={undo} onDone={finishSession} onChangeCategory={changeCategory} />}
        {step === 'results' && <ResultsList results={results} onOpen={setSelectedRecipe} onRestart={restart} onChangeCategory={changeCategory} />}
      </Motion.div>
    </AnimatePresence>
    {selectedRecipe && <RecipeDetail recipe={selectedRecipe} ingredientsById={ingredientsById} lists={lists} activeList={activeList} onClose={() => setSelectedRecipe(null)} onAddMissing={addMissing} adding={adding} />}
  </main>
}
