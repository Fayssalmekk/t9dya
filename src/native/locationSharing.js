const SHARING_PREFIX = 't9dya-location-sharing:'

export function isLocationSharingEnabled(userId) {
  return Boolean(userId) && localStorage.getItem(`${SHARING_PREFIX}${userId}`) === 'true'
}

export function setLocationSharingEnabled(userId, enabled) {
  if (!userId) return
  localStorage.setItem(`${SHARING_PREFIX}${userId}`, enabled ? 'true' : 'false')
  window.dispatchEvent(new CustomEvent('t9dya-location-sharing', { detail: { userId, enabled } }))
}

export async function locationPermissionState() {
  if (!navigator.geolocation) return 'unsupported'
  if (!navigator.permissions?.query) return 'prompt'
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state
  } catch {
    return 'prompt'
  }
}

export function requestLocationPermission() {
  if (!navigator.geolocation) return Promise.reject(new Error('GEOLOCATION_UNSUPPORTED'))
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 10000
  }))
}
