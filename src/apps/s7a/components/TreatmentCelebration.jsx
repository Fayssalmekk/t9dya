import { createPortal } from 'react-dom'

export default function TreatmentCelebration({ celebration }) {
  if (!celebration) return null
  return createPortal(<div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center px-5 py-[max(1rem,env(safe-area-inset-top))]">
    <div role="status" aria-live="polite" aria-atomic="true" className="w-full max-w-sm rounded-[1.75rem] border border-white/20 bg-slate-950/[.85] p-5 text-center text-white shadow-2xl backdrop-blur-md">
      <span aria-hidden="true" className="mb-2 block text-3xl motion-safe:animate-pulse">{celebration.complete ? '🏆' : '✨'}</span>
      <strong className="block text-lg">{celebration.complete ? 'Routine terminée !' : '+1 prise validée !'}</strong>
      <p className="mt-2 break-words text-sm text-white/80">{celebration.name}{celebration.complete ? ' · Bravo, mission accomplie' : ' · continuez comme ça'}</p>
    </div>
  </div>, document.body)
}
