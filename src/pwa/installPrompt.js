let deferredPrompt = null
let initialized = false
const listeners = new Set()

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

let snapshot = {
  canPrompt: false,
  installed: isStandalone(),
}

function publish(changes) {
  snapshot = { ...snapshot, ...changes }
  listeners.forEach((listener) => listener())
}

export function initializeInstallPrompt() {
  if (initialized) return
  initialized = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    publish({ canPrompt: true, installed: false })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    publish({ canPrompt: false, installed: true })
  })

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', () => {
    publish({ installed: isStandalone() })
  })
}

export function subscribeInstallState(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstallState() {
  return snapshot
}

export async function requestAppInstall() {
  if (!deferredPrompt) return { outcome: 'unavailable' }
  const prompt = deferredPrompt
  deferredPrompt = null
  publish({ canPrompt: false })

  try {
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice?.outcome === 'accepted') publish({ installed: true })
    return { outcome: choice?.outcome || 'dismissed' }
  } catch {
    return { outcome: 'unavailable' }
  }
}
