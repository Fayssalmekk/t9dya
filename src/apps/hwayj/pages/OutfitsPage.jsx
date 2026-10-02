import { Heart, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlatform } from '../../../context/PlatformContext'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { deleteOutfit, updateOutfit } from '../services/wardrobe'

export default function OutfitsPage() {
  const { clothes, outfits, ownerId, ownerProfile, isOwnWardrobe } = useWardrobe()
  const { notify } = usePlatform()
  const orderedOutfits = [...outfits].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)))

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title={isOwnWardrobe ? 'Mes outfits' : `Outfits de ${ownerProfile?.displayName || 'mon partenaire'}`} subtitle={`${outfits.length} composition${outfits.length > 1 ? 's' : ''}`} />
      {isOwnWardrobe ? <Link to="/hwayj/outfits/new" className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-violet-600 font-black text-white shadow-lg shadow-violet-200 dark:shadow-none"><Plus size={22} />Composer une tenue</Link> : <div className="rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">Consultation du dressing de {ownerProfile?.displayName || 'votre partenaire'} · lecture seule</div>}

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        {orderedOutfits.map((outfit) => (
          <article key={outfit.id} className="rounded-[1.5rem] bg-surface p-4 shadow-card">
            <Link to={`/hwayj/outfits/${outfit.id}`} className="block">
              <OutfitPreview outfit={outfit} clothes={clothes} />
              <strong className="mt-3 block truncate">{outfit.name}</strong>
              <small className="text-muted">{outfit.mode === 'ai' ? 'Look généré · ' : `${outfit.occasion || 'Toute occasion'} · `}{outfit.items?.length || 0} pièces</small>
              <OutfitReferences outfit={outfit} clothes={clothes} />
            </Link>
            {isOwnWardrobe && <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => updateOutfit(ownerId, outfit.id, { favorite: !outfit.favorite })} className={`grid h-11 w-11 place-items-center rounded-xl ${outfit.favorite ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-950'}`} aria-label={outfit.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}><Heart size={18} fill={outfit.favorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={async () => { if (window.confirm('Supprimer cette tenue ?')) { await deleteOutfit(ownerId, outfit.id); notify('Tenue supprimée') } }} className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 size={17} /></button></div>}
          </article>
        ))}
        {outfits.length === 0 && <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-center text-muted sm:col-span-2"><span className="text-5xl">👚</span><p className="mt-3 font-bold">Composez votre première tenue en swipant.</p></div>}
      </section>
    </main>
  )
}

function OutfitReferences({ outfit, clothes }) {
  const items = (outfit.items || []).map((entry) => clothes.find((item) => item.id === entry.itemId)).filter(Boolean)
  if (!items.length) return null
  return <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted">Pièces à porter</span><div className="mt-2 flex flex-wrap gap-1.5">{items.map((item) => <span key={item.id} className="flex min-w-0 items-center gap-1.5 rounded-full bg-canvas py-1 pl-1 pr-2"><img src={item.thumb} alt="" className="h-7 w-7 shrink-0 rounded-full bg-white object-contain" /><small className="max-w-24 truncate text-[10px] font-bold">{item.name}</small></span>)}</div></div>
}

function OutfitPreview({ outfit, clothes }) {
  if (outfit.previewThumb) {
    return <div className="grid h-64 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-violet-50 p-3 dark:from-slate-900 dark:to-violet-950/40"><img src={outfit.previewThumb} alt={outfit.name} className="block max-h-full max-w-full object-contain" /></div>
  }
  const topEntry = outfit.items?.find((entry) => entry.slot === 'top') || outfit.items?.[0]
  const bottomEntry = outfit.items?.find((entry) => entry.slot === 'bottom') || outfit.items?.[1]
  const top = clothes.find((item) => item.id === topEntry?.itemId)
  const bottom = clothes.find((item) => item.id === bottomEntry?.itemId)
  return <div className="flex h-64 flex-col items-center justify-center gap-[2px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-violet-50 p-2 dark:from-slate-900 dark:to-violet-950/40"><img src={top?.thumb} alt={top?.name || ''} className="h-[7.25rem] w-40 object-contain" /><img src={bottom?.thumb} alt={bottom?.name || ''} className="h-[8rem] w-40 object-contain" /></div>
}
