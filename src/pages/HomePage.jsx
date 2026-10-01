import { Check, Clipboard, LogOut, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import Brand from '../components/Brand'
import Notice from '../components/Notice'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { household, profile, signOut, dataError } = useAuth()
  const [copied, setCopied] = useState(false)
  const memberProfiles = Object.values(household.memberProfiles || {})

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 py-7 text-ink">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Brand compact />
          <button type="button" onClick={signOut} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink" aria-label="Se déconnecter"><LogOut size={19} /> <span className="hidden sm:inline">Déconnexion</span></button>
        </header>

        <section className="mt-8 overflow-hidden rounded-card bg-surface shadow-card">
          <div className="bg-accent-600 p-6 text-white sm:p-8">
            <p className="text-sm font-semibold text-white/75">Bienvenue, {profile.displayName}</p>
            <h1 className="mt-2 text-3xl font-bold">{household.name}</h1>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-white/90"><Users size={19} /> {household.members?.length || 1} personne{household.members?.length > 1 ? 's' : ''} sur 2</div>
          </div>

          <div className="p-6 sm:p-8">
            {dataError && <div className="mb-5"><Notice>{dataError}</Notice></div>}
            {household.members?.length < 2 ? (
              <div>
                <h2 className="text-lg font-bold">Invitez votre partenaire</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Créez son compte sur son téléphone, puis choisissez « Rejoindre » et utilisez ce code.</p>
                <button type="button" onClick={copyInviteCode} className="mt-5 flex min-h-14 w-full items-center justify-between rounded-xl border-2 border-dashed border-accent-500 bg-accent-50 px-4 font-mono text-lg font-bold tracking-wider text-accent-700">
                  <span>{household.inviteCode}</span>
                  {copied ? <Check size={21} aria-label="Copié" /> : <Clipboard size={21} aria-label="Copier" />}
                </button>
                {copied && <p className="mt-2 text-center text-sm font-semibold text-accent-700" role="status">Code copié !</p>}
              </div>
            ) : <Notice type="success">Votre foyer est complet. Vous êtes prêts à partager vos courses.</Notice>}

            <div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Membres</h2>
              <ul className="mt-4 space-y-3">
                {memberProfiles.map((member) => (
                  <li key={member.uid} className="flex min-h-14 items-center gap-3 rounded-xl bg-slate-50 px-4 dark:bg-slate-800/70">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-100 font-bold text-accent-700"><UserRound size={18} /></span>
                    <span className="min-w-0"><strong className="block truncate text-sm">{member.displayName}</strong><small className="block truncate text-muted">{member.email}</small></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-7 rounded-xl bg-slate-50 p-4 text-center text-sm text-muted dark:bg-slate-800/70">Étape 2 terminée · Le catalogue arrive à l’étape 3.</div>
          </div>
        </section>
      </div>
    </main>
  )
}
