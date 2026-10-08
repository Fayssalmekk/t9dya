import { BellRing, Cake, Check, ChevronLeft, Clipboard, Clock3, Home, LoaderCircle, LocateFixed, LogOut, Moon, Save, ShieldCheck, Sparkles, Sun, UserRound, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BackgroundGeolocation } from '@capgo/background-geolocation'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { updateHouseholdName, updateMemberProfile } from '../../services/household'
import { isNativeApp, syncNativeTheme } from '../../native/capacitor'
import { getNotificationPreferences, nativeNotificationPermission, notificationOptions, requestNativeNotificationPermission, saveNotificationPreferences, sendTestNotification } from '../../native/notifications'
import { isAlwaysLocationSharingEnabled, locationPermissionState, requestLocationPermission, setAlwaysLocationSharingEnabled } from '../../native/locationSharing'

const sexLabels = { female: 'Femme', male: 'Homme' }

export default function HubSettingsPage() {
  const { user, household, profile, signOut } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('t9dya-theme') === 'dark')
  const [homeName, setHomeName] = useState(() => household.name)
  const [form, setForm] = useState(() => ({ displayName: profile.displayName || '', birthDate: profile.birthDate || '', sex: profile.sex || '', diabetic: profile.diabetic === true }))
  const [savingHome, setSavingHome] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notificationPermission, setNotificationPermission] = useState(() => isNativeApp ? 'prompt' : typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const [notificationPreferences, setNotificationPreferences] = useState(getNotificationPreferences)
  const [testingNotification, setTestingNotification] = useState(false)
  const [locationPermission, setLocationPermission] = useState('prompt')
  const [alwaysSharing, setAlwaysSharing] = useState(() => isAlwaysLocationSharingEnabled(user?.uid))
  const [changingAlwaysSharing, setChangingAlwaysSharing] = useState(false)
  const members = (household.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('t9dya-theme', dark ? 'dark' : 'light')
    syncNativeTheme(dark).catch(() => {})
  }, [dark])

  useEffect(() => {
    if (!isNativeApp) return
    nativeNotificationPermission().then(setNotificationPermission).catch(() => {})
  }, [])

  useEffect(() => {
    locationPermissionState().then(setLocationPermission).catch(() => {})
  }, [])

  const copyCode = async () => {
    await navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const saveHome = async (event) => {
    event.preventDefault()
    if (!homeName.trim()) return
    setSavingHome(true)
    setError('')
    try {
      await updateHouseholdName(household.id, homeName)
      setMessage('Nom du foyer mis à jour')
    } catch {
      setError('Impossible de modifier le foyer.')
    } finally {
      setSavingHome(false)
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!form.displayName.trim() || !form.birthDate || !form.sex) return
    setSavingProfile(true)
    setError('')
    try {
      await updateMemberProfile(user, household.id, form)
      setMessage('Profil personnel mis à jour')
    } catch {
      setError('Impossible de modifier votre profil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const enableNotifications = async () => {
    if (isNativeApp) {
      const permission = await requestNativeNotificationPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') saveNotificationPreferences(notificationPreferences)
      return
    }
    if (typeof Notification === 'undefined') return
    setNotificationPermission(await Notification.requestPermission())
  }

  const toggleNotification = async (key) => {
    const enabled = !notificationPreferences[key]
    if (enabled && isNativeApp && notificationPermission !== 'granted') {
      const permission = await requestNativeNotificationPermission()
      setNotificationPermission(permission)
      if (permission !== 'granted') {
        setError('Autorisez les notifications dans les réglages Android pour activer cette alerte.')
        return
      }
    }
    setError('')
    setNotificationPreferences(saveNotificationPreferences({ ...notificationPreferences, [key]: enabled }))
  }

  const changeNotificationTime = (key, value) => {
    setNotificationPreferences(saveNotificationPreferences({ ...notificationPreferences, [key]: value }))
  }

  const testNotification = async () => {
    setTestingNotification(true)
    setError('')
    try {
      await sendTestNotification()
      setNotificationPermission('granted')
      setMessage('Notification de test programmée. Elle doit apparaître dans une seconde.')
      saveNotificationPreferences(notificationPreferences)
    } catch (reason) {
      setError(reason?.message === 'NOTIFICATION_PERMISSION_DENIED' ? 'Android bloque les notifications. Réactivez-les dans les réglages de l’application.' : `Test impossible${reason?.message ? ` : ${reason.message}` : '.'}`)
    } finally {
      setTestingNotification(false)
    }
  }

  const enableLocation = async () => {
    setError('')
    try {
      await requestLocationPermission()
      setLocationPermission('granted')
      setMessage('GPS autorisé. Vous décidez quand partager depuis l’application Carte.')
    } catch (reason) {
      setLocationPermission(reason?.code === 1 ? 'denied' : locationPermission)
      setError(reason?.code === 1 ? 'Localisation refusée. Autorisez-la dans les réglages Android.' : 'Le téléphone n’arrive pas à obtenir votre position GPS.')
    }
  }

  const toggleAlwaysSharing = async () => {
    if (!user?.uid || !isNativeApp) return
    setChangingAlwaysSharing(true)
    setError('')
    try {
      if (alwaysSharing) {
        setAlwaysLocationSharingEnabled(user.uid, false)
        setAlwaysSharing(false)
        setMessage('Le partage permanent est désactivé. Le partage en direct reste contrôlable dans Carte.')
        return
      }
      await requestLocationPermission()
      const permissions = await BackgroundGeolocation.requestPermissions({ permissions: ['location', 'backgroundLocation', 'notification'] })
      const foregroundGranted = permissions.location === 'granted'
      const backgroundGranted = ['granted', 'always'].includes(permissions.backgroundLocation)
      if (!foregroundGranted || !backgroundGranted) {
        setLocationPermission(foregroundGranted ? 'granted' : (permissions.location || 'denied'))
        setError('Pour “Toujours partager”, choisissez « Autoriser tout le temps » dans les réglages Android de T9DYA.')
        return
      }
      setLocationPermission('granted')
      setAlwaysLocationSharingEnabled(user.uid, true)
      setAlwaysSharing(true)
      setMessage('Partage permanent activé. Android affichera une notification pendant le suivi GPS.')
    } catch {
      setError('Impossible d’activer le partage permanent. Vérifiez les autorisations GPS et notifications Android.')
    } finally {
      setChangingAlwaysSharing(false)
    }
  }

  return (
    <main className="min-h-dvh bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center gap-3"><Link to="/" className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label="Retour au portail"><ChevronLeft size={21} /></Link><span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-700"><Home size={21} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-teal-700">Portail du foyer</p><h1 className="text-2xl font-black">Foyer et profils</h1></div></header>

        {message && <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</p>}
        {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}

        <form onSubmit={saveHome} className="mt-6 rounded-[1.75rem] bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Home size={22} /></span><div><h2 className="font-black">Votre foyer</h2><p className="text-xs text-muted">Visible dans toutes vos applications</p></div></div>
          <label className="mt-5 block"><span className="mb-2 block text-sm font-bold">Nom du foyer</span><input value={homeName} onChange={(event) => setHomeName(event.target.value)} className="field-input" maxLength={50} required /></label>
          <button type="submit" disabled={savingHome || !homeName.trim() || homeName.trim() === household.name} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 font-black text-white disabled:opacity-45">{savingHome ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Enregistrer le nom</button>
          <button type="button" onClick={copyCode} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl bg-canvas px-4 font-mono font-bold tracking-wider"><span>{household.inviteCode}</span>{copied ? <Check size={19} className="text-emerald-600" /> : <Clipboard size={19} className="text-muted" />}</button>
        </form>

        <section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Users size={22} /></span><div><h2 className="font-black">Membres du foyer</h2><p className="text-xs text-muted">{members.length}/2 comptes autorisés</p></div></div>
          <div className="mt-4 space-y-2">{members.map((member) => <article key={member.uid} className="flex items-center gap-3 rounded-2xl bg-canvas p-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface font-black text-teal-700 shadow-sm">{member.displayName?.[0]?.toUpperCase()}</span><div className="min-w-0 flex-1"><strong className="block truncate">{member.displayName}</strong><small className="block truncate text-muted">{member.uid === user.uid ? 'Vous' : 'Partenaire'}{member.sex ? ` · ${sexLabels[member.sex]}` : ' · Sexe à compléter'}{member.birthDate ? ` · ${member.birthDate}` : ''}</small></div>{member.uid === user.uid && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[9px] font-black uppercase text-teal-700">Modifiable</span>}</article>)}</div>
          <p className="mt-3 text-xs leading-5 text-muted">Chaque membre gère ses propres informations depuis son compte. Cela évite de modifier par erreur le profil du partenaire.</p>
        </section>

        <form onSubmit={saveProfile} className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><UserRound size={22} /></span><div><h2 className="font-black">Mon profil</h2><p className="text-xs text-muted">Utilisé pour personnaliser les apps</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Nom affiché</span><input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className="field-input" maxLength={50} required /></label><label><span className="mb-2 flex items-center gap-2 text-sm font-bold"><Cake size={16} className="text-violet-600" />Date de naissance</span><input type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} className="field-input" required /></label><label><span className="mb-2 block text-sm font-bold">Sexe</span><select value={form.sex} onChange={(event) => setForm((current) => ({ ...current, sex: event.target.value }))} className="field-input" required><option value="">Choisir</option><option value="male">Homme</option><option value="female">Femme</option></select></label><label className={`sm:col-span-2 flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition ${form.diabetic ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 bg-canvas dark:border-slate-700'}`}><input type="checkbox" checked={form.diabetic} onChange={(event) => setForm((current) => ({ ...current, diabetic: event.target.checked }))} className="h-5 w-5 accent-rose-600" /><span><strong className="block">Je suis diabétique</strong><small className="text-muted">Affiche mon suivi glycémie dans Aujourd’hui et mes insulines dans Traitements. Mon partenaire pourra aussi m’aider à les gérer.</small></span></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Adresse e-mail</span><input value={profile.email || user.email || ''} className="field-input opacity-65" disabled /></label></div>
          <button type="submit" disabled={savingProfile || !form.displayName.trim() || !form.birthDate || !form.sex} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 font-black text-white disabled:opacity-45">{savingProfile ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Enregistrer mon profil</button>
        </form>

        <section className="mt-4 overflow-hidden rounded-[1.75rem] bg-surface shadow-card">
          <button type="button" onClick={() => setDark((value) => !value)} className="flex min-h-16 w-full items-center gap-3 border-b border-slate-100 px-5 text-left dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas">{dark ? <Moon size={20} /> : <Sun size={20} />}</span><span className="flex-1 font-bold">Mode sombre</span><span className={`relative h-7 w-12 rounded-full transition ${dark ? 'bg-teal-600' : 'bg-slate-200'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${dark ? 'left-6' : 'left-1'}`} /></span></button>
          <div className="flex min-h-16 items-center gap-3 px-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={20} /></span><span className="flex-1"><strong className="block">Foyer privé</strong><small className="text-muted">Accessible uniquement à vos deux comptes</small></span></div>
          <button type="button" onClick={enableNotifications} disabled={notificationPermission === 'granted' || notificationPermission === 'unsupported'} className="flex min-h-16 w-full items-center gap-3 border-t border-slate-100 px-5 text-left disabled:opacity-70 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><BellRing size={20} /></span><span className="flex-1"><strong className="block">Notifications</strong><small className="text-muted">{notificationPermission === 'granted' ? 'Activées sur cet appareil' : notificationPermission === 'denied' ? (isNativeApp ? 'Bloquées dans les réglages Android' : 'Bloquées dans le navigateur') : 'Activer les alertes de la plateforme'}</small></span>{notificationPermission === 'granted' && <Check size={19} className="text-emerald-600" />}</button>
          <button type="button" onClick={enableLocation} disabled={locationPermission === 'granted' || locationPermission === 'unsupported'} className="flex min-h-16 w-full items-center gap-3 border-t border-slate-100 px-5 text-left disabled:opacity-70 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950"><LocateFixed size={20} /></span><span className="flex-1"><strong className="block">Localisation GPS</strong><small className="text-muted">{locationPermission === 'granted' ? 'Autorisée · partage contrôlé dans Carte' : locationPermission === 'denied' ? 'Bloquée dans les réglages Android' : locationPermission === 'unsupported' ? 'Indisponible sur cet appareil' : 'Autoriser sans commencer le partage'}</small></span>{locationPermission === 'granted' && <Check size={19} className="text-emerald-600" />}</button>
        </section>

        <section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><LocateFixed size={22} /></span><div><h2 className="font-black">Position du foyer</h2><p className="text-xs text-muted">Votre choix reste propre à ce téléphone</p></div></div>
          <button type="button" role="switch" aria-checked={alwaysSharing} disabled={!isNativeApp || changingAlwaysSharing} onClick={toggleAlwaysSharing} className={`mt-4 flex min-h-20 w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition disabled:opacity-55 ${alwaysSharing ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30' : 'border-slate-200 bg-canvas dark:border-slate-700'}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${alwaysSharing ? 'bg-sky-600 text-white' : 'bg-surface text-muted'}`}>{changingAlwaysSharing ? <LoaderCircle className="animate-spin" size={20} /> : <LocateFixed size={20} />}</span>
            <span className="min-w-0 flex-1"><strong className="block">Toujours partager si le GPS est actif</strong><small className="mt-1 block leading-4 text-muted">Continue écran verrouillé ou app en arrière-plan. Une notification Android reste visible.</small></span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${alwaysSharing ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${alwaysSharing ? 'left-6' : 'left-1'}`} /></span>
          </button>
          {!isNativeApp && <p className="mt-3 text-xs text-muted">Cette option apparaît dans l’APK Android. Le navigateur partage seulement tant que la page reste active.</p>}
          <p className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200">Désactiver le GPS du téléphone suspend le suivi. Forcer l’arrêt de T9DYA dans Android l’arrête aussi jusqu’à la prochaine ouverture.</p>
        </section>

        {isNativeApp && <section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Sparkles size={22} /></span><div><h2 className="font-black">Mes notifications Android</h2><p className="text-xs text-muted">Chaque choix est enregistré uniquement sur ce téléphone</p></div></div>
          <button type="button" onClick={testNotification} disabled={testingNotification} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">{testingNotification ? <LoaderCircle className="animate-spin" size={18} /> : <BellRing size={18} />}{testingNotification ? 'Programmation…' : 'Envoyer une notification de test'}</button>
          <div className="mt-5 space-y-3">
            {notificationOptions.map((option) => {
              const enabled = Boolean(notificationPreferences[option.key])
              return <article key={option.key} className={`rounded-2xl border p-4 transition ${enabled ? 'border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/20' : 'border-slate-200 bg-canvas dark:border-slate-700'}`}>
                <button type="button" role="switch" aria-checked={enabled} onClick={() => toggleNotification(option.key)} className="flex w-full items-center gap-3 text-left">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${enabled ? 'bg-violet-600 text-white' : 'bg-surface text-muted'}`}><BellRing size={19} /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm">{option.title}</strong><small className="mt-0.5 block leading-4 text-muted">{option.description}</small></span>
                  <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-6' : 'left-1'}`} /></span>
                </button>
                {enabled && option.timeKey && <label className="mt-3 flex items-center gap-3 border-t border-violet-100 pt-3 text-sm font-bold dark:border-violet-900"><Clock3 size={17} className="text-violet-600" /><span className="flex-1">Heure du rappel</span><input type="time" value={notificationPreferences[option.timeKey]} onChange={(event) => changeNotificationTime(option.timeKey, event.target.value)} className="rounded-xl border border-violet-200 bg-surface px-3 py-2 font-black text-ink outline-none focus:ring-2 focus:ring-violet-400 dark:border-violet-800" /></label>}
              </article>
            })}
          </div>
          <p className="mt-4 rounded-2xl bg-canvas px-4 py-3 text-xs leading-5 text-muted">Les traitements, rendez-vous et rappels quotidiens sont programmés sur Android et sonnent même après la fermeture de l’application.</p>
        </section>}

        <button type="button" onClick={signOut} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 font-extrabold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"><LogOut size={20} />Se déconnecter</button>
      </div>
    </main>
  )
}
