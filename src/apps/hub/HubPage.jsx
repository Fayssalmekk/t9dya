import { ArrowRight, LogOut, Settings2, Sparkles, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import HouseholdPage from '../../pages/HouseholdPage'
import { useAuth } from '../../context/AuthContext'
import { appRegistry } from '../registry'
import AppCard from './AppCard'
import HealthHubAlerts from './HealthHubAlerts'
import InstallAppCard from './InstallAppCard'
import { APP_VERSION } from '../../version'

export default function HubPage() {
  const { household, profile, signOut } = useAuth()

  if (!household) return <HouseholdPage />

  const members = (household.members || []).map((uid) => household.memberProfiles?.[uid]).filter(Boolean)
  const profileIncomplete = !profile.birthDate || !profile.sex

  return (
    <main className="min-h-dvh bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950"><Sparkles size={23} /></span><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Notre espace</p><h1 className="truncate text-xl font-black">Bienvenue, {profile.displayName}</h1></div></div><button type="button" onClick={signOut} className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label="Se déconnecter"><LogOut size={19} /></button></header>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-5 text-white shadow-xl sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-200/75">Le portail de notre quotidien</p><h2 className="mt-2 truncate text-2xl font-black">{household.name}</h2><p className="mt-2 text-xs text-white/60">Vos espaces, vos projets. Tout commence ici.</p></div><Link to="/settings" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/20" aria-label="Gérer le foyer"><Settings2 size={22} /></Link></div>
          <div className="relative mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">{members.map((member) => <span key={member.uid} className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-xs font-black">{member.displayName?.[0]?.toUpperCase()}</span><span className="text-xs font-bold">{member.displayName}</span></span>)}<span className="ml-auto flex items-center gap-1 text-[10px] text-white/60"><Users size={14} />{members.length}/2</span></div>
        </section>

        {profileIncomplete && <Link to="/settings" className="mt-4 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-900 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-100"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200"><UserRound size={20} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">Complétez votre profil</strong><small className="text-violet-700 dark:text-violet-300">Date de naissance et sexe amélioreront les futures suggestions.</small></span><ArrowRight size={18} /></Link>}

        <div className="mt-7 flex items-end justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Vos applications</p><span className="text-xs font-bold text-muted">{appRegistry.filter((app) => app.enabled).length} espaces à ouvrir</span></div>
        <section aria-label="Applications du foyer" className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">{appRegistry.filter((app) => app.enabled).map((app) => <AppCard key={app.id} app={app} />)}</section>
        <HealthHubAlerts />
        <InstallAppCard />
        <footer className="pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 text-center"><span className="inline-flex rounded-full border border-slate-200 bg-surface px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted shadow-sm dark:border-slate-800">Version {APP_VERSION}</span></footer>
      </div>
    </main>
  )
}
