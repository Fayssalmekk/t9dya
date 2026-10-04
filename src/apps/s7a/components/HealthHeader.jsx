import { ChevronLeft, HeartPulse, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useHealth } from '../context/HealthContext'

export default function HealthHeader({ title, subtitle, backTo }) {
  const { user } = useAuth()
  const { healthProfiles, healthOwnerId, setHealthOwnerId } = useHealth()
  return <div className="mb-5"><header className="flex items-center gap-3">{backTo && <Link to={backTo} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label="Retour"><ChevronLeft size={21} /></Link>}<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300"><HeartPulse size={22} /></span><div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[.18em] text-rose-500">S7a ya s7a <ShieldCheck size={12} /></p><h1 className="truncate text-2xl font-black">{title}</h1>{subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}</div></header>{healthProfiles.length > 1 && <div className="mt-4 flex rounded-2xl bg-surface p-1.5 shadow-sm" role="group" aria-label="Profil santé">{healthProfiles.map((member) => <button key={member.uid} type="button" onClick={() => setHealthOwnerId(member.uid)} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-black transition ${healthOwnerId === member.uid ? 'bg-rose-500 text-white shadow-md' : 'text-muted'}`}><span className="block truncate">{member.uid === user.uid ? 'Moi' : member.displayName}</span><small className={`text-[9px] ${healthOwnerId === member.uid ? 'text-white/75' : 'text-muted'}`}>{member.diabetic ? 'Diabète activé' : 'Santé générale'}</small></button>)}</div>}</div>
}
