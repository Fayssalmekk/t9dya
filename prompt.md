You are a senior full-stack engineer and product designer. Build a complete, production-ready web app called "T9dya" (shared household grocery list + budget tracker) for a couple (exactly 2 users). Deliver COMPLETE file contents for every file (never partial snippets, never "rest of the code here").

## 0. TOKEN-SAVING RULES (IMPORTANT)
- Before doing any operation, ask yourself: "Can the user do this faster by themselves?" If a step is manual or purely config (creating the Firebase project, enabling Auth/Firestore in the console, copying keys, creating the GitHub repo, setting Vercel env vars, running `npm install`), DO NOT simulate it or write long explanations. Give me a short numbered checklist (max 1 line per step) and let me do it.
- Do not repeat files that did not change. When I ask for a modification, give only the full content of the files that changed.
- No long intros, no recaps, no unnecessary explanations. Be concise.
- Generate big static data (product catalog) once, in a single dedicated file.

## 1. TECH STACK (fixed, do not change)
- Frontend: React + Vite (JavaScript), React Router, Tailwind CSS, Framer Motion (animations/swipe), lucide-react (icons), Recharts (charts), vite-plugin-pwa (installable PWA).
- NO separate backend. Everything lives in ONE codebase/repo; the React app talks directly to Firebase (Firestore + Firebase Authentication with email/password) using the Firebase JS SDK v9+ modular API.
- Firestore security rules must restrict access to the 2 household members only (household document with `members` array of UIDs). Provide the `firestore.rules` file.
- 100% free: stay within Firebase Spark plan and Vercel Hobby. Do NOT use Cloud Functions, Storage, or any paid feature. Minimize reads/writes (use listeners wisely, batch writes, local cache with `persistentLocalCache` for offline support).
- Config via env vars (`VITE_FIREBASE_*`) with a `.env.example`. 
- Deployment: GitHub -> Vercel (auto deploy). Include `vercel.json` with SPA rewrite so React Router works on refresh. Provide a short README with deployment steps.

## 2. CORE FEATURES
1. **Auth & Household**: Login with email/password. The first user creates a household; the second joins with an invite code. Both see the same real-time data.
2. **Predefined product catalog**: A rich built-in catalog of grocery products typical of Moroccan supermarkets (inspired by Marjane, Carrefour, Aswak Assalam, BIM, Label'Vie): categories such as Fruits & Légumes, Boucherie & Poissons, Produits laitiers & Oeufs, Boulangerie, Épicerie (huile, sucre, farine, thé, café, semoule, légumineuses, conserves, épices...), Boissons, Surgelés, Hygiène & Beauté, Entretien & Ménage, Bébé, Snacks & Biscuits. Each product: id, name (French + Darija/Arabic alt name), category, emoji/icon, default unit (kg, g, L, pack, pièce), and an approximate default price in MAD. At least 250 products. Users mostly SELECT from the catalog (fast search + category chips), but can also add a custom product.
3. **Shopping list (the main screen)**:
   - Add products from the catalog with quantity (+/- stepper) and unit.
   - Each member can add items; show who added each item (avatar/initial).
   - **Validation flow**: when one partner adds items, the other can "validate" them (or comment/modify). Status per item: `proposed` -> `validated`. Show a clear visual state and a "Validate all" button.
   - Real-time sync between both phones.
   - Items grouped by category, collapsible, with progress bar (X/Y bought).
   - Swipe right = mark as bought, swipe left = delete (Framer Motion), plus visible checkbox for accessibility.
4. **"Bought" price pop-up (key feature)**: When an item is checked as bought, open a fast bottom-sheet pop-up that:
   - Pre-fills the last known price (or the catalog default) for that product.
   - Lets me adjust the price with quick buttons: -1, -5, +1, +5, +10 MAD, a numeric input, and quick "approximate price" chips (e.g., the 3 most recent prices paid for this product).
   - Lets me pick the store (Marjane, Carrefour, Aswak Assalam, BIM, Label'Vie, Marché, Hanout, Other) — remembered as the last-used default.
   - Confirm with one tap; optional "skip price" option.
   - Saves a purchase record and updates the product's price history so prices get smarter over time.
5. **Budget tracking**:
   - Set a monthly budget (and optional per-category budgets).
   - Dashboard: spent this month vs budget (progress ring), remaining, daily average, projection to end of month, warning colors at 75% / 100%.
   - Charts: spending by category (donut), by week (bar), by store (bar), monthly trend (line).
   - History of all purchases with filters (date, category, store, who bought).
   - Price history per product (small sparkline) + "cheapest store" hint based on my own data.
6. **Smart helpers**:
   - "Frequently bought" and "Buy again" suggestions based on history.
   - Recurring/staple lists (templates) like "Monthly basics", "Weekend BBQ", "Ramadan list" -> add all in one tap.
   - Duplicate detection when adding an item already in the list.
   - Estimated total of the current list before shopping (using last known prices).
   - Shopping mode: big-text, high-contrast, one-hand-friendly view to use inside the store.
   - Notes per item (e.g., "brand: Centrale", "sans sucre").
   - Archive finished trips: "Finish shopping" creates a trip summary (date, store, total, items) and starts a fresh list while keeping unbought items optionally.
   - Share list via WhatsApp (formatted text) and export history to CSV.
7. **Extra nice-to-have (implement if it fits cleanly)**: dark mode, multilingual UI (FR / AR / EN with RTL support for Arabic), undo snackbar after delete/check, low-stock "pantry" tracker (mark items as "running low" to auto-add them to the list), expense notes, haptic feedback on mobile.

## 3. UI / UX REQUIREMENTS (top priority)
- Mobile-first (it will be used on phones in the supermarket), responsive on desktop.
- Clean, modern, simple, very easy to understand: large touch targets (min 44px), generous spacing, clear hierarchy, friendly rounded cards, soft shadows, one accent color + neutral palette. Support light/dark.
- Bottom tab navigation: List | Catalog | Budget | History | Settings. A floating "+" button for quick add.
- Smooth micro-animations (list item enter/exit, swipe, bottom-sheet, progress), skeleton loaders, empty states with helpful illustrations/emojis, toasts for feedback.
- Fast: instant search with debounce, optimistic UI updates, no unnecessary re-renders.
- Accessible: labels, contrast, keyboard support.
- Keep the design easy for me to customize: centralize colors/tokens in `tailwind.config.js` and CSS variables.

## 4. CODE STRUCTURE
- Clear folder structure: `src/components`, `src/pages`, `src/hooks`, `src/services` (firebase, firestore helpers), `src/data/catalog.js`, `src/context`, `src/utils`, `src/i18n`.
- Firestore data model (document it briefly): `households/{id}` (members, budget, invite code), `households/{id}/items`, `households/{id}/purchases`, `households/{id}/priceHistory`, `households/{id}/templates`.
- Clean, commented-where-needed, reusable components, error handling and loading states everywhere.

## 5. DELIVERY ORDER
Work progressively, in this order, and stop after each step so I can test and customize:
1. Project setup (package.json, configs, folder structure, firebase init, `firestore.rules`, `vercel.json`, `.env.example`) + my manual checklist (Firebase console, GitHub, Vercel).
2. Auth + household creation/join.
3. Catalog data + catalog browsing/search.
4. Shopping list + validation flow + swipe.
5. Bought-price pop-up + purchase records + price history.
6. Budget dashboard + charts + history.
7. Smart helpers, templates, shopping mode, share/export, i18n, dark mode, PWA.

Start with step 1 now. Remember: complete file contents only, and tell me which tasks I should do manually to save tokens.