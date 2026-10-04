import { useEffect, useState } from 'react'
import { BackgroundGeolocation } from '@capgo/background-geolocation'
import { useAuth } from '../context/AuthContext'
import { publishLocation, removeSharedLocation } from '../services/location'
import { isAlwaysLocationSharingEnabled, isLocationSharingEnabled, setAlwaysLocationSharingEnabled, setLocationSharingEnabled } from './locationSharing'
import { isNativeApp } from './capacitor'

const MIN_UPDATE_INTERVAL = 12000

export default function LocationCoordinator() {
  const { user, household } = useAuth()
  const [sharingVersion, setSharingVersion] = useState(0)

  useEffect(() => {
    const refresh = (event) => {
      if (!event.detail?.userId || event.detail.userId === user?.uid) setSharingVersion((value) => value + 1)
    }
    window.addEventListener('t9dya-location-sharing', refresh)
    return () => window.removeEventListener('t9dya-location-sharing', refresh)
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || !household?.id || !isLocationSharingEnabled(user.uid)) return undefined
    const useBackgroundTracking = isNativeApp && isAlwaysLocationSharingEnabled(user.uid)
    if (!navigator.geolocation && !useBackgroundTracking) {
      setLocationSharingEnabled(user.uid, false)
      removeSharedLocation(household.id, user.uid).catch(() => {})
      window.dispatchEvent(new CustomEvent('t9dya-location-error', { detail: 'La localisation GPS n’est pas disponible sur cet appareil.' }))
      return undefined
    }

    let lastPublishedAt = 0
    let publishing = false
    let queuedPosition = null
    const sendPosition = async (position) => {
      const now = Date.now()
      if (publishing || now - lastPublishedAt < MIN_UPDATE_INTERVAL) { queuedPosition = position; return }
      publishing = true
      try {
        await publishLocation(household.id, user.uid, position)
        lastPublishedAt = Date.now()
        window.dispatchEvent(new CustomEvent('t9dya-location-update'))
      } catch {
        window.dispatchEvent(new CustomEvent('t9dya-location-error', { detail: 'Impossible d’envoyer votre position à votre partenaire.' }))
      } finally {
        publishing = false
        if (queuedPosition && Date.now() - lastPublishedAt >= MIN_UPDATE_INTERVAL) {
          const nextPosition = queuedPosition
          queuedPosition = null
          sendPosition(nextPosition)
        }
      }
    }
    const handleError = (error) => {
      const denied = error?.code === 1 || ['NOT_AUTHORIZED', 'PERMISSION_DENIED'].includes(error?.code)
      if (denied) {
        setAlwaysLocationSharingEnabled(user.uid, false)
        setLocationSharingEnabled(user.uid, false)
        removeSharedLocation(household.id, user.uid).catch(() => {})
      }
      window.dispatchEvent(new CustomEvent('t9dya-location-error', { detail: denied ? 'Autorisation GPS refusée. Activez la localisation dans les réglages Android.' : 'Position GPS indisponible. Vérifiez que la localisation du téléphone est activée.' }))
    }

    if (useBackgroundTracking) {
      let cancelled = false
      BackgroundGeolocation.start({ backgroundTitle: 'T9DYA · Position du foyer', backgroundMessage: 'Votre position est partagée avec votre partenaire.', requestPermissions: false, stale: false, distanceFilter: 10, minIntervalMs: MIN_UPDATE_INTERVAL }, (location, error) => {
        if (cancelled) return
        if (error) { handleError(error); return }
        if (location) sendPosition({ coords: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy, heading: location.bearing, speed: location.speed } })
      }).catch(handleError)
      return () => { cancelled = true; BackgroundGeolocation.stop().catch(() => {}) }
    }

    const watchId = navigator.geolocation.watchPosition(sendPosition, handleError, { enableHighAccuracy: true, timeout: 25000, maximumAge: 10000 })
    return () => navigator.geolocation.clearWatch(watchId)
  }, [household?.id, sharingVersion, user?.uid])

  useEffect(() => {
    const stop = (event) => {
      if (event.detail?.userId !== user?.uid || event.detail.enabled || !household?.id) return
      BackgroundGeolocation.stop().catch(() => {})
      removeSharedLocation(household.id, user.uid).catch(() => {})
    }
    window.addEventListener('t9dya-location-sharing', stop)
    return () => window.removeEventListener('t9dya-location-sharing', stop)
  }, [household?.id, user?.uid])
  return null
}
