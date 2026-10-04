import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import { LocalNotifications } from '@capacitor/local-notifications'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNativeApp = Capacitor.isNativePlatform()

export async function syncNativeTheme(dark = document.documentElement.classList.contains('dark')) {
  if (!isNativeApp) return
  await Promise.allSettled([
    SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }),
    StatusBar.setBackgroundColor({ color: dark ? '#020617' : '#f8fafc' }),
    StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark })
  ])
}

export async function initializeNativeShell() {
  if (!isNativeApp) return

  document.documentElement.classList.add('native-app')
  const dark = document.documentElement.classList.contains('dark')

  await Promise.allSettled([
    StatusBar.setOverlaysWebView({ overlay: false }),
    syncNativeTheme(dark),
    Keyboard.setResizeMode({ mode: KeyboardResize.Native }),
    LocalNotifications.createChannel({
      id: 'health-reminders',
      name: 'Rappels santé',
      description: 'Traitements et rendez-vous S7a ya s7a',
      importance: 4,
      visibility: 1,
      vibration: true
    }),
    LocalNotifications.createChannel({
      id: 'shopping-alerts',
      name: 'Courses et partenaire',
      description: 'Demandes de courses et nouveaux produits du foyer',
      importance: 4,
      visibility: 1,
      vibration: true
    }),
    LocalNotifications.createChannel({
      id: 'daily-reminders',
      name: 'Rappels quotidiens',
      description: 'Rappels quotidiens choisis dans le Hub',
      importance: 3,
      visibility: 1,
      vibration: true
    })
  ])

  await CapacitorApp.addListener('backButton', () => {
    const rootPaths = ['/', '/auth']
    if (!rootPaths.includes(window.location.pathname)) {
      window.history.back()
      return
    }
    CapacitorApp.exitApp()
  })

  await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
    const path = notification.extra?.path
    if (!path || path === window.location.pathname) return
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}
