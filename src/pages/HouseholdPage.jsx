import { useState } from 'react'
import { ArrowLeft, ArrowRight, Home, LogOut, UserPlus, Users } from 'lucide-react'
import Brand from '../components/Brand'
import FormField from '../components/FormField'
import Notice from '../components/Notice'
import { useAuth } from '../context/AuthContext'
import { createHousehold, joinHousehold, normalizeInviteCode } from '../services/household'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'

export default function HouseholdPage() {
  const { user, signOut, dataError } = useAuth()
  const [choice, setChoice] = useState(null)
  const [householdName, setHouseholdName] = useState('Notre foyer')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const runAction = async (action) => {
    setSubmitting(true)
    setError('')
    try {
      await action()
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  const submitCreate = (event) => {
    event.preventDefault()
    runAction(() => createHousehold(user, householdName))
  }

  const submitJoin = (event) => {
    event.preventDefault()
    runAction(() => joinHousehold(user, inviteCode))
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 text-ink sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-md rounded-card bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <Brand compact />
          <button type="button" onClick={signOut} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-muted hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Se déconnecter"><LogOut size={20} /></button>
        </div>

        {!choice ? (
          <>
            <div className="mt-9">
              <h1 className="text-2xl font-bold">Créons votre foyer</h1>
              <p className="mt-2 leading-6 text-muted">Un seul de vous crée le foyer. L’autre le rejoint avec le code reçu.</p>
            </div>
            {dataError && <div className="mt-5"><Notice>{dataError}</Notice></div>}
            <div className="mt-7 space-y-3">
              <button type="button" onClick={() => setChoice('create')} className="group flex min-h-20 w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-accent-500 hover:bg-accent-50 dark:border-slate-700">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700"><Home size={23} /></span>
                <span className="flex-1"><strong className="block">Créer notre foyer</strong><small className="mt-1 block text-muted">Je recevrai le code à partager</small></span>
                <ArrowRight className="text-muted transition group-hover:translate-x-1" size={20} />
              </button>
              <button type="button" onClick={() => setChoice('join')} className="group flex min-h-20 w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-accent-500 hover:bg-accent-50 dark:border-slate-700">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><UserPlus size={23} /></span>
                <span className="flex-1"><strong className="block">Rejoindre mon partenaire</strong><small className="mt-1 block text-muted">J’ai déjà un code d’invitation</small></span>
                <ArrowRight className="text-muted transition group-hover:translate-x-1" size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => { setChoice(null); setError('') }} className="mt-7 flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={19} /> Retour</button>
            <div className="mt-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-100 text-accent-700">{choice === 'create' ? <Home size={23} /> : <Users size={23} />}</span>
              <h1 className="mt-5 text-2xl font-bold">{choice === 'create' ? 'Nommer votre foyer' : 'Entrer le code'}</h1>
              <p className="mt-2 leading-6 text-muted">{choice === 'create' ? 'Vous pourrez le modifier plus tard.' : 'Demandez à votre partenaire le code affiché sur son écran.'}</p>
            </div>
            <form className="mt-7 space-y-5" onSubmit={choice === 'create' ? submitCreate : submitJoin}>
              {choice === 'create'
                ? <FormField id="householdName" label="Nom du foyer" value={householdName} onChange={(event) => setHouseholdName(event.target.value)} required maxLength={50} placeholder="Notre foyer" />
                : <FormField id="inviteCode" label="Code d’invitation" value={inviteCode} onChange={(event) => setInviteCode(normalizeInviteCode(event.target.value))} required autoCapitalize="characters" autoCorrect="off" spellCheck="false" maxLength={14} placeholder="T9DYA-AB12CD34" />}
              {error && <Notice>{error}</Notice>}
              <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Patientez…' : choice === 'create' ? 'Créer le foyer' : 'Rejoindre le foyer'}
                {!submitting && <ArrowRight size={19} />}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
