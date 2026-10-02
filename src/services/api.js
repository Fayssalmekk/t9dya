import { Capacitor } from '@capacitor/core'

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const configuredOrigin = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

  if (Capacitor.isNativePlatform()) {
    if (!configuredOrigin) throw new Error('NATIVE_API_URL_NOT_CONFIGURED')
    return `${configuredOrigin}${normalizedPath}`
  }

  return configuredOrigin ? `${configuredOrigin}${normalizedPath}` : normalizedPath
}
