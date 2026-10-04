import { useEffect } from 'react'
import { Keyboard } from '@capacitor/keyboard'
import { isNativeApp } from '../native/capacitor'

const EDITABLE_CONTROL = 'input:not([type="hidden"]), textarea, select, [contenteditable="true"]'
const OVERLAY_SELECTOR = '[role="dialog"][aria-modal="true"], .fixed.inset-0'

function keepFocusedControlVisible(control) {
  if (!(control instanceof HTMLElement) || !control.matches(EDITABLE_CONTROL)) return

  const viewport = window.visualViewport
  const viewportTop = viewport?.offsetTop || 0
  const viewportBottom = viewportTop + (viewport?.height || window.innerHeight)
  const rect = control.getBoundingClientRect()
  const topGuard = viewportTop + 72
  const bottomGuard = viewportBottom - 104

  if (rect.top < topGuard || rect.bottom > bottomGuard) {
    control.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}

export default function FormKeyboardCoordinator() {
  useEffect(() => {
    const seenDialogs = new WeakSet()
    const viewport = window.visualViewport
    let revealTimer

    const syncDialogs = () => {
      const dialogs = [...document.querySelectorAll(OVERLAY_SELECTOR)].filter((dialog) => (
        dialog.matches('[role="dialog"][aria-modal="true"]') || dialog.querySelector('form')
      ))
      const newDialogOpened = dialogs.some((dialog) => {
        if (seenDialogs.has(dialog)) return false
        seenDialogs.add(dialog)
        return true
      })

      document.body.classList.toggle('dialog-open', dialogs.length > 0)

      if (!newDialogOpened) return
      const activeControl = document.activeElement
      if (activeControl instanceof HTMLElement && activeControl.matches(EDITABLE_CONTROL)) {
        activeControl.blur()
      }
      if (isNativeApp) Keyboard.hide().catch(() => {})
    }

    const revealAfterKeyboard = (control) => {
      window.clearTimeout(revealTimer)
      revealTimer = window.setTimeout(() => keepFocusedControlVisible(control), 280)
    }

    const handleFocus = (event) => {
      const control = event.target
      if (!(control instanceof HTMLElement) || !control.matches(EDITABLE_CONTROL)) return
      revealAfterKeyboard(control)
    }

    const handleViewportResize = () => {
      const control = document.activeElement
      if (control instanceof HTMLElement && control.matches(EDITABLE_CONTROL)) {
        keepFocusedControlVisible(control)
      }
    }

    const observer = new MutationObserver(syncDialogs)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('focusin', handleFocus)
    viewport?.addEventListener('resize', handleViewportResize)
    syncDialogs()

    return () => {
      window.clearTimeout(revealTimer)
      observer.disconnect()
      document.removeEventListener('focusin', handleFocus)
      viewport?.removeEventListener('resize', handleViewportResize)
      document.body.classList.remove('dialog-open')
    }
  }, [])

  return null
}
