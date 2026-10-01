import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Brand from '../components/Brand'
import FormField from '../components/FormField'
import Notice from '../components/Notice'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'

export default function AuthPage() {
  const { signIn, resetPassword } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await signIn(form.email, form.password)
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
        <div className="mt-7">
          <span className="inline-flex rounded-full bg-accent-50 px-3 py-1.5 text-xs font-extrabold text-accent-700">🔒 Foyer privé · 2 comptes</span>
          <h1 className="mt-4 text-2xl font-bold">Bon retour 👋</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Connectez-vous avec l’un des deux comptes autorisés.</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <FormField id="email" name="email" label="Adresse e-mail" value={form.email} onChange={updateField} type="email" autoComplete="email" required placeholder="vous@exemple.com" />
          <div className="relative">
            <FormField id="password" name="password" label="Mot de passe" value={form.password} onChange={updateField} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={6} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-8 grid min-h-11 min-w-11 place-items-center rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {message && <Notice type={message.type}>{message.text}</Notice>}
          <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Patientez…' : 'Se connecter'}
            {!submitting && <ArrowRight size={19} aria-hidden="true" />}
          </button>
          <button type="button" onClick={handleReset} className="min-h-11 w-full text-sm font-semibold text-accent-700 hover:underline">Mot de passe oublié ?</button>
        </form>
      </section>
    </main>
  )
}
