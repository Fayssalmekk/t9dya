import { Check, ChevronLeft, Shirt, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useWardrobe } from '../context/WardrobeContext'
import { getWardrobeGenderLabel } from '../utils/profileGender'

export default function HwayjHeader({ title, subtitle, backTo }) {
  const { user, household } = useAuth()
  const { ownerId, selectOwner } = useWardrobe()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const profiles = (household?.members || []).map((uid) => household.memberProfiles?.[uid] || { uid, displayName: uid === user.uid ? 'Moi' : 'Partenaire' })
  const switchProfile = (uid) => {
    if (uid === ownerId) return
    selectOwner(uid)
    if (pathname === '/hwayj/add' || pathname.startsWith('/hwayj/item/')) navigate('/hwayj/closet')
    else if (/^\/hwayj\/outfits\/[^/]+$/.test(pathname) && pathname !== '/hwayj/outfits/new') navigate('/hwayj/outfits')
  }

  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <Link to={backTo || '/'} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-muted shadow-sm" aria-label={backTo ? 'Retour' : 'Retour aux applications'}><ChevronLeft size={21} /></Link>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><Shirt size={21} /></span>
        <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Hwayj</p><h1 className="truncate text-2xl font-black">{title}</h1>{subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}</div>
      </div>

      {profiles.length > 1 && <div className="mt-4 rounded-2xl bg-surface p-1.5 shadow-sm"><p className="px-2 pb-1.5 pt-1 text-[9px] font-black uppercase tracking-[0.17em] text-muted">Voir le dressing de</p><div className="grid grid-cols-2 gap-1">{profiles.map((member) => { const selected = member.uid === ownerId; return <button key={member.uid} type="button" onClick={() => switchProfile(member.uid)} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-left transition ${selected ? 'bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none' : 'bg-canvas text-muted'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${selected ? 'bg-white/20' : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200'}`}><UserRound size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{member.displayName}</strong><small className={`block truncate text-[9px] ${selected ? 'text-white/70' : 'text-muted'}`}>{member.uid === user.uid ? 'Mon profil' : 'Partenaire'} · {getWardrobeGenderLabel(member)}</small></span>{selected && <Check size={16} />}</button> })}</div></div>}
    </header>
  )
}
