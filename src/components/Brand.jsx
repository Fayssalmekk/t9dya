import { Heart } from 'lucide-react'

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${compact ? 'h-10 w-10 rounded-xl' : 'h-14 w-14 rounded-2xl'} flex items-center justify-center bg-accent-600 text-white shadow-card`}>
        <Heart aria-hidden="true" size={compact ? 20 : 28} fill="currentColor" />
      </span>
      <div>
        <p className="text-xl font-extrabold tracking-tight">T9dya</p>
        {!compact && <p className="text-sm text-muted">Vos courses, à deux.</p>}
      </div>
    </div>
  )
}
