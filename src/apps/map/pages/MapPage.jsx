import { useEffect, useState } from 'react'
import { ArrowLeft, Crosshair, ExternalLink, LocateFixed, MapPinned, Navigation, Radio, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { subscribeHouseholdLocations } from '../../../services/location'
import { isLocationSharingEnabled, locationPermissionState, requestLocationPermission, setLocationSharingEnabled } from '../../../native/locationSharing'
import LiveMap from '../components/LiveMap'

const LIVE_WINDOW = 90000

function timestampValue(value) {
  return value?.toMillis?.() || 0
}

function relativeUpdate(timestamp, now) {
  if (!timestamp) return 'Synchronisation…'
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (seconds < 15) return 'À l’instant'
  if (seconds < 60) return `Il y a ${seconds} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  return `Il y a ${hours} h`
}

function distanceBetween(first, second) {
  if (!first || !second) return null
  const radius = 6371
  const dLat = (second.latitude - first.latitude) * Math.PI / 180
  const dLon = (second.longitude - first.longitude) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(first.latitude * Math.PI / 180) * Math.cos(second.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function MapPage() {
  const { user, household, profile } = useAuth()
  const [locations, setLocations] = useState([])
  const [sharing, setSharing] = useState(() => isLocationSharingEnabled(user.uid))
  const [permission, setPermission] = useState('prompt')
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)

  useEffect(() => subscribeHouseholdLocations(household.id, setLocations, () => setError('Impossible de charger la carte du foyer.')), [household.id])
  useEffect(() => {
    locationPermissionState().then(setPermission)
    const clock = window.setInterval(() => setNow(Date.now()), 15000)
    const sharingChanged = (event) => {
      if (event.detail?.userId === user.uid) setSharing(event.detail.enabled)
    }
    const locationError = (event) => setError(event.detail || 'Position GPS indisponible.')
    window.addEventListener('t9dya-location-sharing', sharingChanged)
    window.addEventListener('t9dya-location-error', locationError)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener('t9dya-location-sharing', sharingChanged)
      window.removeEventListener('t9dya-location-error', locationError)
    }
  }, [user.uid])

  const toggleSharing = async () => {
    setError('')
    if (sharing) {
      setLocationSharingEnabled(user.uid, false)
      setSharing(false)
      return
    }
    setRequesting(true)
    try {
      await requestLocationPermission()
      setPermission('granted')
      setLocationSharingEnabled(user.uid, true)
      setSharing(true)
    } catch (reason) {
      setPermission(reason?.code === 1 ? 'denied' : permission)
      setError(reason?.code === 1 ? 'GPS refusé. Autorisez la localisation dans les réglages Android.' : 'Le téléphone n’arrive pas à obtenir votre position GPS.')
    } finally {
      setRequesting(false)
    }
  }

  const ownLocation = locations.find((location) => location.uid === user.uid)
  const partnerId = household.members?.find((uid) => uid !== user.uid)
  const partner = household.memberProfiles?.[partnerId]
  const partnerLocation = locations.find((location) => location.uid === partnerId)
  const distance = distanceBetween(ownLocation, partnerLocation)
  const points = [
    ownLocation && { ...ownLocation, isMe: true, label: 'Moi', initial: profile.displayName?.[0]?.toUpperCase() || 'M', live: now - timestampValue(ownLocation.updatedAt) < LIVE_WINDOW },
    partnerLocation && { ...partnerLocation, isMe: false, label: partner?.displayName || 'Partenaire', initial: partner?.displayName?.[0]?.toUpperCase() || 'P', live: now - timestampValue(partnerLocation.updatedAt) < LIVE_WINDOW }
  ].filter(Boolean)
  const partnerLive = partnerLocation && now - timestampValue(partnerLocation.updatedAt) < LIVE_WINDOW

  return <main className="min-h-dvh bg-canvas px-4 pb-10 pt-5 text-ink sm:px-6 sm:pt-8">
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center gap-3"><Link to="/" className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label="Retour au Hub"><ArrowLeft size={20} /></Link><span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><MapPinned size={22} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-sky-700 dark:text-sky-300">Notre position</p><h1 className="text-2xl font-black">Carte du foyer</h1></div></header>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}

      <section className="mt-5 overflow-hidden rounded-[2rem] border border-sky-100 bg-surface shadow-xl dark:border-sky-950">
        <LiveMap points={points} />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <article className="rounded-2xl bg-sky-50 p-4 dark:bg-sky-950/30"><div className="flex items-center gap-2 text-sky-700 dark:text-sky-300"><LocateFixed size={18} /><strong>Votre téléphone</strong></div><p className="mt-2 text-sm font-bold">{sharing ? (ownLocation ? 'Position partagée' : 'Recherche GPS en cours…') : 'Partage désactivé'}</p>{ownLocation && <small className="mt-1 block text-muted">Précision ±{Math.round(ownLocation.accuracy || 0)} m · {relativeUpdate(timestampValue(ownLocation.updatedAt), now)}</small>}</article>
          <article className={`rounded-2xl p-4 ${partnerLive ? 'bg-violet-50 dark:bg-violet-950/30' : 'bg-canvas'}`}><div className={`flex items-center gap-2 ${partnerLive ? 'text-violet-700 dark:text-violet-300' : 'text-muted'}`}><Radio size={18} /><strong>{partner?.displayName || 'Votre partenaire'}</strong></div><p className="mt-2 text-sm font-bold">{partnerLive ? 'En direct' : partnerLocation ? 'Dernière position connue' : 'Ne partage pas sa position'}</p>{partnerLocation && <small className="mt-1 block text-muted">{relativeUpdate(timestampValue(partnerLocation.updatedAt), now)}{distance !== null ? ` · ${distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}` : ''}</small>}</article>
        </div>
      </section>

      <button type="button" onClick={toggleSharing} disabled={requesting || permission === 'unsupported'} className={`mt-4 flex min-h-16 w-full items-center gap-4 rounded-[1.5rem] px-5 text-left font-black text-white shadow-lg transition disabled:opacity-55 ${sharing ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-sky-600 to-cyan-500'}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">{sharing ? <Crosshair size={22} /> : <Navigation size={22} />}</span><span className="flex-1"><span className="block">{requesting ? 'Recherche du GPS…' : sharing ? 'Arrêter et effacer ma position' : 'Partager ma position en direct'}</span><small className="mt-1 block font-medium text-white/75">{sharing ? 'Votre partenaire ne verra plus votre position.' : 'Android demandera votre autorisation.'}</small></span></button>

      {partnerLocation && <a href={`https://www.google.com/maps/search/?api=1&query=${partnerLocation.latitude},${partnerLocation.longitude}`} target="_blank" rel="noreferrer" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-surface font-black text-sky-700 dark:border-sky-900 dark:text-sky-300"><ExternalLink size={18} />Ouvrir sa position dans Maps</a>}

      <section className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={22} /><div><strong className="text-emerald-900 dark:text-emerald-200">Privé entre vous deux</strong><p className="mt-1 text-xs leading-5 text-emerald-800/75 dark:text-emerald-300/75">Seuls les deux comptes du foyer peuvent lire la position. L’arrêt du partage efface immédiatement vos coordonnées de Firebase. Une position de plus de 90 secondes est affichée comme ancienne, jamais comme “en direct”.</p></div></div></section>
    </div>
  </main>
}
