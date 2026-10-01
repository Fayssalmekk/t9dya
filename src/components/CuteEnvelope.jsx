import { Mail } from 'lucide-react'

const tones = {
  teal: { background: '#ccfbf1', flap: '#99f6e4', ink: '#0f766e' },
  rose: { background: '#ffe4e6', flap: '#fecdd3', ink: '#be123c' },
  violet: { background: '#ede9fe', flap: '#ddd6fe', ink: '#6d28d9' },
  amber: { background: '#fef3c7', flap: '#fde68a', ink: '#b45309' },
  sky: { background: '#e0f2fe', flap: '#bae6fd', ink: '#0369a1' },
  emerald: { background: '#d1fae5', flap: '#a7f3d0', ink: '#047857' }
}

export default function CuteEnvelope({ icon = '💰', color = 'teal', small = false }) {
  const tone = tones[color] || tones.teal
  return (
    <span className={`relative block shrink-0 ${small ? 'h-14 w-[4.5rem]' : 'h-20 w-28'}`} aria-hidden="true">
      <span className="absolute inset-x-0 bottom-0 h-[78%] rounded-xl shadow-sm" style={{ backgroundColor: tone.background }} />
      <Mail className="absolute inset-0 h-full w-full" strokeWidth={1.35} style={{ color: tone.ink }} />
      <span className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-[42%] place-items-center rounded-full bg-white/90 shadow-sm ${small ? 'h-7 w-7 text-base' : 'h-10 w-10 text-2xl'}`} style={{ boxShadow: `0 3px 10px ${tone.flap}` }}>{icon}</span>
    </span>
  )
}
