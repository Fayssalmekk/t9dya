import { BellRing, Check, Clipboard, LogOut, Moon, ShieldCheck, Sun, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { household, profile, signOut } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('t9dya-theme') === 'dark')
  const [copied, setCopied] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('t9dya-theme', dark ? 'dark' : 'light')
  }, [dark])

  const copyCode = async () => {
    await navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return
    setNotificationPermission(await Notification.requestPermission())
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <AppHeader title="Réglages" subtitle="Votre foyer et votre expérience" />

      <section className="rounded-[1.75rem] bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-100 text-xl font-black text-accent-700">{profile.displayName?.[0]?.toUpperCase()}</span><div className="min-w-0"><h2 className="truncate text-lg font-extrabold">{profile.displayName}</h2><p className="truncate text-sm text-muted">{profile.email}</p></div></div>
      </section>

      <section className="mt-4 rounded-[1.75rem] bg-surface p-5 shadow-card"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-700"><Users size={21} /></span><div><h2 className="font-extrabold">{household.name}</h2><p className="text-xs text-muted">{household.members.length}/2 membres</p></div></div><button type="button" onClick={copyCode} className="mt-4 flex min-h-12 w-full items-center justify-between rounded-xl bg-canvas px-4 font-mono font-bold tracking-wider"><span>{household.inviteCode}</span>{copied ? <Check size={19} className="text-emerald-600" /> : <Clipboard size={19} className="text-muted" />}</button></section>

      <section className="mt-4 overflow-hidden rounded-[1.75rem] bg-surface shadow-card">
        <button type="button" onClick={() => setDark((value) => !value)} className="flex min-h-16 w-full items-center gap-3 border-b border-slate-100 px-5 text-left dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas">{dark ? <Moon size={20} /> : <Sun size={20} />}</span><span className="flex-1 font-bold">Mode sombre</span><span className={`relative h-7 w-12 rounded-full transition ${dark ? 'bg-accent-600' : 'bg-slate-200'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${dark ? 'left-6' : 'left-1'}`} /></span></button>
        <div className="flex min-h-16 items-center gap-3 px-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={20} /></span><span className="flex-1"><strong className="block">Foyer privé</strong><small className="text-muted">Accessible uniquement à vous deux</small></span></div>
        <button type="button" onClick={enableNotifications} disabled={notificationPermission === 'granted' || notificationPermission === 'unsupported'} className="flex min-h-16 w-full items-center gap-3 border-t border-slate-100 px-5 text-left disabled:opacity-70 dark:border-slate-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><BellRing size={20} /></span><span className="flex-1"><strong className="block">Alertes “Go buy it”</strong><small className="text-muted">{notificationPermission === 'granted' ? 'Activées sur cet appareil' : notificationPermission === 'denied' ? 'Bloquées dans les réglages du navigateur' : 'Recevoir une alerte quand T9dya est ouverte'}</small></span>{notificationPermission === 'granted' && <Check size={19} className="text-emerald-600" />}</button>
      </section>

      <button type="button" onClick={signOut} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 font-extrabold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"><LogOut size={20} />Se déconnecter</button>
      <p className="mt-5 text-center text-xs text-muted">T9dya v0.3 · Fait pour votre foyer ❤️</p>
    </main>
  )
}
