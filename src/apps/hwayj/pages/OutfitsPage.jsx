import { Copy, Layers3, Plus, Shirt, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { usePlatform } from '../../../context/PlatformContext'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { deleteOutfit, duplicateOutfit } from '../services/wardrobe'

export default function OutfitsPage() {
  const { user } = useAuth()
  const { clothes, outfits } = useWardrobe()
  const { notify } = usePlatform()

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title="Mes tenues" subtitle={`${outfits.length} composition${outfits.length > 1 ? 's' : ''}`} />
      <Link to="/hwayj/outfits/new" className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-violet-600 font-black text-white shadow-lg shadow-violet-200 dark:shadow-none"><Plus size={22} />Composer en swipant</Link>

      <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-surface p-5 shadow-card">
        <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"><Layers3 size={23} /></span><div><h2 className="font-black">Votre miroir intelligent</h2><p className="mt-1 text-sm leading-6 text-muted">Swipe le haut sans bouger le pantalon. Ajoute ensuite une veste, un manteau ou des chaussures. Aucun choix n’est fait par une IA.</p></div></div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-canvas p-3 text-xs font-bold text-muted"><Shirt size={18} className="shrink-0 text-violet-600" />GPT est utilisé uniquement si vous demandez une fusion visuelle haut + veste.</div>
      </section>

      <section className="mt-7 grid gap-3 sm:grid-cols-2">
        {outfits.map((outfit) => <article key={outfit.id} className="rounded-[1.5rem] bg-surface p-4 shadow-card"><Link to={`/hwayj/outfits/${outfit.id}`} className="block"><div className="flex h-44 items-center justify-center gap-1 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-900 dark:to-violet-950/40">{outfit.previewThumb ? <img src={outfit.previewThumb} alt={outfit.name} className="h-full w-full object-contain" /> : outfit.items?.slice(0, 4).map((entry) => { const item = clothes.find((value) => value.id === entry.itemId); return item ? <img key={entry.itemId} src={item.thumb} alt="" className="h-32 min-w-0 flex-1 object-contain" /> : null })}</div><strong className="mt-3 block truncate">{outfit.name}</strong><small className="text-muted">{outfit.mode === 'ai' ? 'Look généré · ' : `${outfit.occasion || 'Toute occasion'} · `}{outfit.items?.length || 0} pièces</small></Link><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => duplicateOutfit(user.uid, outfit)} className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-muted" aria-label="Dupliquer"><Copy size={17} /></button><button type="button" onClick={async () => { if (window.confirm('Supprimer cette tenue ?')) { await deleteOutfit(user.uid, outfit.id); notify('Tenue supprimée') } }} className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600" aria-label="Supprimer"><Trash2 size={17} /></button></div></article>)}
        {outfits.length === 0 && <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-center text-muted sm:col-span-2"><span className="text-5xl">👚</span><p className="mt-3 font-bold">Composez votre première tenue en swipant.</p></div>}
      </section>
    </main>
  )
}
