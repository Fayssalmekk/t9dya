You are a senior full-stack engineer and product designer. I already have a working web app called "T9dya" (shared household grocery list + budget tracker, React + Vite + Firebase Auth/Firestore, deployed on Vercel from GitHub). I want to turn it into a multi-app platform and add a second app inside it: a personal AI-powered digital wardrobe called "Hwayj" (clothes). Deliver COMPLETE file contents for every file you create or change (never partial snippets, never "rest of the code here").

## 0. GOLDEN RULES
1. REUSE the existing project. Do not scaffold a new project, do not re-create Firebase init, auth, routing, layout, design tokens, i18n, or UI components that already exist. Use the same stack, libraries, folder conventions, naming style, and design language as T9dya. Only add a new dependency if it is truly needed (expected: `@imgly/background-removal`).
2. DO NOT BREAK T9dya. Keep all existing logic, data model, and behavior working exactly as before. Existing Firestore data must keep working with no migration.
3. BUGS: while working, if you find bugs or errors in the existing code that you touch or that affect the new work (broken imports, lint errors, wrong hooks deps, unhandled promises, race conditions, security-rule gaps, etc.), fix them with the smallest safe change that preserves the intended logic. Do not refactor or restyle working code for taste. List every fix in 1 line each at the end of the step (file + what + why). When I paste an error output, find the root cause and fix it with a minimal change, returning the complete changed files.
4. Match what is already there: read the existing code to learn its patterns before writing new code.

## 1. TOKEN-SAVING & WORKFLOW RULES (VERY IMPORTANT)
- Do NOT run `npm install`, `npm run build`, `npm run lint`, `npm run dev`, git, or any slow command yourself. I will run them. At the end of each step list the exact commands for me (one line each).
- My Windows machine blocks native binaries (Application Control), so local `vite build` may fail. Never try to fix that and never run builds; Vercel builds on Linux.
- Read only what you need (package.json, router/App file, auth context, firebase service, layout/nav components, tailwind config, firestore.rules, i18n files, the home/household selection flow). Do not dump or re-read the whole repo.
- Every manual or console task (OpenAI key, spending limit, env vars locally and on Vercel, allowed UIDs, publishing rules, redeploy) must NOT be simulated or explained in chat. Add them as short numbered steps (1 line each, exact menu names/URLs) in a new section "Hwayj (clothes app)" of the existing `docs/SETUP.md` (create the file if it does not exist). I will do them myself.
- Only output files that changed. No long intros, no recaps. If something is ambiguous, choose the simplest sensible default and note it in one line; ask only if truly blocked.
- ESLint 9 FLAT CONFIG: never use the `extends` key inside config objects; list shared configs directly in the exported array. Use `argsIgnorePattern: '^[A-Z_]'` and `varsIgnorePattern: '^[A-Z_]'` for `no-unused-vars`. Do not touch the existing ESLint config unless it is broken.

## 2. PLATFORM ARCHITECTURE (the new part)
Current flow: the user authenticates, then chooses/creates their home (household). NEW flow: after authentication and home selection, the user lands on an **App Hub** page that shows one card per app:
- Card "T9dya" (groceries & budget): leads to the existing app, unchanged in behavior.
- Card "Hwayj" (clothes): leads to the new clothes app.
- Future apps must be addable by only (a) creating a folder under `src/apps/<app-id>/` and (b) adding one entry to a registry.

Requirements:
- Create `src/apps/registry.js`: an array of app definitions `{ id, name (i18n key), description (i18n key), icon (lucide), accent color token, basePath, enabled, comingSoon, component (lazy) }`. The hub renders cards from this registry, so adding an app never requires editing the hub UI. Add 1-2 disabled "coming soon" placeholder entries only if it is trivial.
- Hub UI: clean, modern cards with icon, name, short description, subtle hover/press animation (Framer Motion if the project already uses it), greeting, current home name, home switcher/settings and logout accessible from the hub. Same look and feel as T9dya (reuse its tokens, fonts, dark mode).
- Routing: each app lives under its own base path (`/t9dya/*`, `/hwayj/*`) with lazy-loaded routes. Move the existing T9dya routes under `/t9dya/*` with minimal changes and add redirects from the old paths so bookmarks and the PWA keep working. After login/home selection redirect to the hub (`/`). Keep route guards (auth, home selected) in one shared place.
- Each app has its own layout and bottom navigation. T9dya keeps its existing nav, shown only inside its space. Hwayj gets its own nav. Both layouts include a clear "back to hub" button. The hub has no bottom nav.
- Shared things stay shared: auth context, Firebase init, theme/dark mode, i18n setup, toasts, UI primitives. Do not duplicate them.
- Remember the last opened app only if it is trivial; otherwise skip.

## 3. HWAYJ DATA & PRIVACY
The wardrobe is PERSONAL (per user, not shared with the other household member). Use `users/{uid}/...`. Switching home does not affect the wardrobe.
- `users/{uid}/clothes/{itemId}`: metadata + tags + `thumb` (small data URL) + counters (`wearCount`, `lastWornAt`, `status`: clean | dirty | laundry, `favorite`, `price?`, `createdAt`).
- `users/{uid}/clothesImages/{itemId}`: `{ image: <data URL> }`, loaded on demand only (detail view, outfit canvas). The closet grid reads ONLY `clothes` thumbs.
- `users/{uid}/outfits/{outfitId}`: item ids with canvas positions/scale/rotation/z-order, name, occasion, season, `createdAt`.
- `users/{uid}/outfitPlans/{yyyy-mm-dd}`: outfit assignments for the calendar.
- `firestore.rules`: MERGE into the existing rules. Do not overwrite or weaken existing T9dya rules. Add: `users/{userId}/**` readable/writable only if `request.auth.uid == userId`, with basic type/size validation. If a similar rule already exists, extend it. Show the full merged file.
- Free plan constraints: Firebase Spark, no Cloud Storage, no Cloud Functions. Images live in Firestore as WebP data URLs. A Firestore document has a hard 1 MiB limit, so compress on the client BEFORE saving. Expected scale is small (< 1000 garments), so total storage stays far below the free quota.
- Reuse the existing Firestore cache setup (`persistentLocalCache`) if present, batch writes, avoid unnecessary listeners.

## 4. IMAGE PIPELINE (core feature, near-zero cost)
Adding a garment:
1. Capture/upload a photo (camera input with `capture`, or file picker). Immediately resize on the client to max 1024px and compress to JPEG (< 1 MB) before any upload. (Vercel functions reject bodies over 4.5 MB.)
2. DEFAULT free path: remove the background in the browser with `@imgly/background-removal` (WASM, no API cost, faithful to the real garment). Show a loading state; the model downloads once and is cached.
3. OPTIONAL "Enhance with AI" button: calls the server (section 5) which uses OpenAI image edit with `gpt-image-1-mini` (low quality by default, `background: "transparent"`, `output_format: "webp"`, `output_compression: 80`) and a prompt like: "Isolate this garment and render it as a clean, professional e-commerce product photo on a transparent background, as if worn by an invisible mannequin (ghost mannequin). Preserve exact color, pattern, texture, knit/fabric details and proportions. Do not add or change anything." Show a before/after comparison and let me choose which one to keep. Slight variation is acceptable if the garment stays at least ~80% faithful.
4. Auto-tagging: sends a 512px version to a cheap vision model and returns strict JSON: `{category, subcategory, colors[], pattern, material, season[], style[], name_suggestion}`. I can edit every tag before saving. Fall back to manual tagging if the call fails.
5. Final compression on the client before saving: main image max 600px WebP quality ~0.8, thumbnail 150px WebP. Guard: if the encoded main image is over 800 KB, re-compress with lower quality. Never write a document over 1 MiB.

## 5. SERVER (Vercel serverless, same repo)
The only server-side code, needed to keep the OpenAI key secret. Use ONE function `api/ai.js` handling `action: "enhance" | "tag" | "suggest"` (keeps the function count low on the Hobby plan and shares auth code). If the project already has an `/api` folder or `vercel.json`, extend them instead of replacing; make sure SPA rewrites never swallow `/api`, and set `maxDuration` for this function.
- Auth: require `Authorization: Bearer <Firebase ID token>`. Verify it WITHOUT firebase-admin and without a service account by calling `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=FIREBASE_API_KEY` with the idToken, then require the returned uid to be in `ALLOWED_UIDS` (comma-separated env var, because two people use the platform). Reject otherwise (401/403).
- Validate body size and content type; accept only a base64 image under ~1 MB; return clean JSON errors.
- Simple per-uid rate limit / daily cap (in-memory is fine; note its limits in a comment).
- Never log images or keys.
- `suggest`: receives ONLY garment tags (text, no images) and returns 3 outfit combinations from the user's own clothes for a chosen occasion/season/weather. Keep it cheap and optional.
- Env vars (server): `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL` (default `gpt-image-1-mini`), `OPENAI_VISION_MODEL` and `OPENAI_TEXT_MODEL` (cheap models, configurable; never hardcode model names without an env override), `ALLOWED_UIDS`, `FIREBASE_API_KEY`. Update `.env.example` and the docs.

## 6. HWAYJ FEATURES
1. Closet: responsive grid of cutouts (thumbs), search, filters (category, color, season, style, status, favorite), sorting (recent, most worn, least worn).
2. Add item flow (section 4) as a smooth step-by-step sheet: photo → cutout → optional AI enhance → tags → save.
3. Item detail: large image, edit tags, "I wore it today" counter, laundry status, favorite, delete with undo.
4. Outfit builder (main creative screen): a canvas where I pick items by category from a bottom drawer and drag/scale/rotate them into an outfit layout. Save, rename, duplicate, delete. Export the outfit as a PNG (client-side canvas).
5. Outfit suggestions (the `suggest` action), selectable occasion/season/weather.
6. Outfit calendar: assign outfits to dates; marking "worn" increments item wear counters.
7. Insights: most/least worn, color distribution, items not worn in 90 days, cost-per-wear (optional price).
8. Packing list: choose days/trip type, auto-select from my closet, checklist.
9. Dark mode and i18n using the project's existing i18n setup (add Hwayj namespaces; do not create a second i18n system). PWA only if the project already has it; otherwise skip.

## 7. UI / UX
Mobile-first, one-hand friendly, large touch targets (min 44px), same design language as T9dya, clothes cutouts on soft neutral cards, smooth micro-animations, skeleton loaders, helpful empty states, toasts with undo, optimistic updates, lazy-load full images, debounced search. Reuse existing components and tokens.

## 8. CODE STRUCTURE
```
src/apps/registry.js
src/apps/hub/            (Hub page, AppCard)
src/apps/t9dya/          (move existing T9dya pages/components here ONLY if it can be done safely; otherwise keep them where they are and just mount them under /t9dya/*)
src/apps/hwayj/          (pages, components, hooks, services, i18n)
api/ai.js
docs/SETUP.md
```
Shared code stays in the existing shared folders.

## 9. DELIVERY ORDER
Work in these steps and STOP after each so I can test:
0. Audit (short): read the targeted files, then report in max 15 lines: the existing stack/conventions you will reuse, bugs or errors found (with proposed minimal fixes), and any risk to existing T9dya behavior. Do not write code yet.
1. App Hub + registry + route restructure (`/t9dya/*`, `/hwayj/*`, redirects from old paths, guards, layouts with back-to-hub), Hwayj as an empty placeholder space. Apply the safe bug fixes from step 0. T9dya must behave exactly as before.
2. Hwayj foundation: merged `firestore.rules`, services, image utilities (resize/compress/WebP/thumbnail), Add item flow with in-browser background removal, save to Firestore, closet grid. Update `docs/SETUP.md`.
3. `api/ai.js` (`tag`) + auto-tagging UI + item detail (tag edit, wear counter, laundry status).
4. `enhance` action + before/after comparison.
5. Outfit builder canvas + save/export.
6. Calendar, insights, suggestions (`suggest`), packing list.
7. i18n completion, polish, PWA if applicable.

go ahead, no commands executed by you, every manual task goes into `docs/SETUP.md`.