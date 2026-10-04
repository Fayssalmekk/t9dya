import { useEffect, useState, useSyncExternalStore } from 'react'
import { CheckCircle2, Download, MoreVertical, Share2, Smartphone, X } from 'lucide-react'
import { isNativeApp } from '../../native/capacitor'
import { getInstallState, requestAppInstall, subscribeInstallState } from '../../pwa/installPrompt'

const isIos = () => /iPad|iPhone|iPod/i.test(navigator.userAgent)
const isPhone = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  || window.matchMedia('(max-width: 767px) and (pointer: coarse)').matches

export default function InstallAppCard() {
  const installState = useSyncExternalStore(subscribeInstallState, getInstallState, getInstallState)
  const [phone, setPhone] = useState(isPhone)
  const [installing, setInstalling] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px) and (pointer: coarse)')
    const sync = () => setPhone(isPhone())
    media.addEventListener?.('change', sync)
    window.addEventListener('resize', sync)
    return () => {
      media.removeEventListener?.('change', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  if (isNativeApp || !phone || installState.installed) return null

  const install = async () => {
    setInstalling(true)
    setMessage('')
    const result = await requestAppInstall()
    setInstalling(false)
    if (result.outcome === 'accepted') {
      setMessage('Notre espace est maintenant installé.')
      return
    }
    if (result.outcome === 'dismissed') {
      setMessage('Installation annulée. Vous pourrez recommencer depuis le menu du navigateur.')
    }
    setHelpOpen(true)
  }

  const ios = isIos()
  return <section className="relative mt-4 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-5 text-white shadow-xl shadow-violet-200/60 dark:shadow-none">
    <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
    <span className="pointer-events-none absolute -bottom-10 left-12 h-24 w-24 rounded-full bg-white/10" />
    <div className="relative flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 shadow-inner"><Smartphone size={27} /></span><span className="min-w-0 flex-1"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"><CheckCircle2 size={12} />Application mobile</span><h2 className="mt-2 text-xl font-black">Installer Notre espace</h2><p className="mt-1 text-sm leading-5 text-white/80">Ouvrez vos courses, votre budget, Hwayj et S7a directement depuis l’écran d’accueil.</p></span></div>
    <button type="button" onClick={install} disabled={installing} className="relative mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 font-black text-violet-700 shadow-lg transition active:scale-[.98] disabled:opacity-65"><Download size={19} />{installing ? 'Ouverture…' : installState.canPrompt ? 'Installer maintenant' : 'Installer sur ce téléphone'}</button>
    {message && <p className="relative mt-3 text-xs font-bold text-white/85" aria-live="polite">{message}</p>}
    {helpOpen && <div className="relative mt-4 rounded-2xl bg-slate-950/25 p-4 backdrop-blur-sm"><button type="button" onClick={() => setHelpOpen(false)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-xl bg-white/10" aria-label="Fermer l’aide"><X size={16} /></button><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">{ios ? <Share2 size={20} /> : <MoreVertical size={20} />}</span><strong className="mt-3 block text-sm">{ios ? 'Sur iPhone ou iPad' : 'Depuis le menu du navigateur'}</strong><p className="mt-1 pr-7 text-xs leading-5 text-white/80">{ios ? 'Touchez Partager, puis « Sur l’écran d’accueil » et confirmez avec Ajouter.' : 'Ouvrez le menu ⋮ de Chrome, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'}</p></div>}
  </section>
}
