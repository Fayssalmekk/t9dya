import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/index.css'
import { initializeNativeShell, isNativeApp } from './native/capacitor'
import { initializeInstallPrompt } from './pwa/installPrompt'

document.documentElement.classList.toggle('dark', localStorage.getItem('t9dya-theme') === 'dark')
initializeNativeShell().catch(() => {})
if (!isNativeApp) initializeInstallPrompt()

const repairApplication = () => window.__t9dyaRepairApp?.()
const dynamicImportError = /dynamically imported module|loading chunk|chunkloaderror|importing a module script failed/i
const controlledAtStartup = !isNativeApp && 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)
let controllerReloadStarted = false

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  repairApplication()
})
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason || '')
  if (dynamicImportError.test(message)) {
    event.preventDefault()
    repairApplication()
  }
})

if (!isNativeApp && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!controlledAtStartup || controllerReloadStarted) return
    controllerReloadStarted = true
    window.location.reload()
  })
}

let updateSW = () => {}
if (!isNativeApp) {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => updateSW(true),
    onRegisteredSW: (_scriptUrl, registration) => {
      if (!registration) return
      const checkForUpdate = () => {
        if (navigator.onLine) registration.update().catch(() => {})
      }
      checkForUpdate()
      window.setInterval(checkForUpdate, 5 * 60 * 1000)
      window.addEventListener('focus', checkForUpdate)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

window.setTimeout(() => {
  sessionStorage.removeItem('t9dya-pwa-repair-at')
  const currentUrl = new URL(window.location.href)
  if (currentUrl.searchParams.has('__t9dya_refresh')) {
    currentUrl.searchParams.delete('__t9dya_refresh')
    window.history.replaceState(window.history.state, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
  }
}, 10000)
