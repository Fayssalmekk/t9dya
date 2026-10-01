import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Brand from '../components/Brand'
import FormField from '../components/FormField'
import Notice from '../components/Notice'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      if (mode === 'register') await signUp(form.name, form.email, form.password)
      else await signIn(form.email, form.password)
    } catch (error) {
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!form.email.trim()) {
      setMessage({ type: 'error', text: "Saisissez d'abord votre adresse e-mail." })
      return
    }
    try {
      await resetPassword(form.email)
      setMessage({ type: 'success', text: 'E-mail de réinitialisation envoyé.' })
    } catch (error) {
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) })
    }
  }

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 text-ink sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-md rounded-card bg-surface p-6 shadow-card sm:p-8">
        <Brand />
        <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Type de connexion">
          {[
            ['login', 'Se connecter'],
            ['register', 'Créer un compte']
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setMode(value); setMessage(null) }} className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${mode === value ? 'bg-surface text-accent-700 shadow-sm' : 'text-muted'}`} aria-pressed={mode === value}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-7">
          <h1 className="text-2xl font-bold">{mode === 'login' ? 'Bon retour 👋' : 'Bienvenue chez vous'}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{mode === 'login' ? 'Retrouvez votre liste partagée.' : 'Créez votre compte, puis invitez votre partenaire.'}</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {mode === 'register' && <FormField id="name" name="name" label="Votre prénom" value={form.name} onChange={updateField} autoComplete="name" required maxLength={40} placeholder="Fatima" />}
          <FormField id="email" name="email" label="Adresse e-mail" value={form.email} onChange={updateField} type="email" autoComplete="email" required placeholder="vous@exemple.com" />
          <div className="relative">
            <FormField id="password" name="password" label="Mot de passe" value={form.password} onChange={updateField} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} hint={mode === 'register' ? 'Au moins 6 caractères.' : undefined} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-8 grid min-h-11 min-w-11 place-items-center rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {message && <Notice type={message.type}>{message.text}</Notice>}
          <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Patientez…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            {!submitting && <ArrowRight size={19} aria-hidden="true" />}
          </button>
          {mode === 'login' && <button type="button" onClick={handleReset} className="min-h-11 w-full text-sm font-semibold text-accent-700 hover:underline">Mot de passe oublié ?</button>}
        </form>
      </section>
    </main>
  )
}
