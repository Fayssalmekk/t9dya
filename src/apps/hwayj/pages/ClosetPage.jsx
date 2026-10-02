import { Heart, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { ColorSwatch } from '../components/ColorPicker'
import ClothingImage from '../components/ClothingImage'
import HwayjHeader from '../components/HwayjHeader'
import { useWardrobe } from '../context/WardrobeContext'
import { updateClothingItem } from '../services/wardrobe'

const categories = ['Tous', 'Hauts', 'Bas', 'Robes', 'Vestes', 'Chaussures', 'Accessoires']

export default function ClosetPage() {
  const { clothes, loading, error, ownerId, ownerProfile, isOwnWardrobe } = useWardrobe()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tous')
  const [status, setStatus] = useState('all')
  const [color, setColor] = useState('all')
  const [season, setSeason] = useState('all')
  const [style, setStyle] = useState('all')
  const [favorites, setFavorites] = useState(false)
  const [sort, setSort] = useState('recent')
  const term = useDebouncedValue(search, 180).trim().toLowerCase()
  const options = useMemo(() => ({
    colors: [...new Set(clothes.flatMap((item) => item.colors || []))].sort(),
    seasons: [...new Set(clothes.flatMap((item) => item.season || []))].sort(),
    styles: [...new Set(clothes.flatMap((item) => item.style || []))].sort()
  }), [clothes])
  const visible = useMemo(() => clothes.filter((item) => {
    const searchable = [item.name, item.category, item.subcategory, ...(item.colors || []), ...(item.season || []), ...(item.style || [])].join(' ').toLowerCase()
    return (!term || searchable.includes(term))
      && (category === 'Tous' || item.category === category)
      && (status === 'all' || item.status === status)
      && (color === 'all' || item.colors?.includes(color))
      && (season === 'all' || item.season?.includes(season))
      && (style === 'all' || item.style?.includes(style))
      && (!favorites || item.favorite)
  }).sort((a, b) => sort === 'most' ? (b.wearCount || 0) - (a.wearCount || 0) : sort === 'least' ? (a.wearCount || 0) - (b.wearCount || 0) : (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)), [category, clothes, color, favorites, season, sort, status, style, term])

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6">
      <HwayjHeader title={isOwnWardrobe ? 'Mon dressing' : `Dressing de ${ownerProfile?.displayName || 'mon partenaire'}`} subtitle={`${clothes.length} vêtement${clothes.length > 1 ? 's' : ''}`} />
      <label className="relative block"><Search className="absolute left-4 top-3.5 text-muted" size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="field-input pl-12" placeholder="Rechercher une couleur, un style…" /></label>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((value) => <button key={value} type="button" onClick={() => setCategory(value)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${category === value ? 'bg-violet-600 text-white' : 'bg-surface text-muted shadow-sm'}`}>{value}</button>)}</div>
      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Filter value={status} onChange={setStatus} label="État" options={[['all', 'Tous les états'], ['clean', 'Propre'], ['dirty', 'À laver'], ['laundry', 'En machine']]} />
        <Filter value={color} onChange={setColor} label="Couleur" options={[['all', 'Toutes couleurs'], ...options.colors.map((value) => [value, value])]} />
        <Filter value={season} onChange={setSeason} label="Saison" options={[['all', 'Toutes saisons'], ...options.seasons.map((value) => [value, value])]} />
        <Filter value={style} onChange={setStyle} label="Style" options={[['all', 'Tous les styles'], ...options.styles.map((value) => [value, value])]} />
        <Filter value={sort} onChange={setSort} label="Tri" options={[['recent', 'Plus récents'], ['most', 'Plus portés'], ['least', 'Moins portés']]} />
        <button type="button" onClick={() => setFavorites((value) => !value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${favorites ? 'bg-rose-100 text-rose-700' : 'bg-surface text-muted shadow-sm'}`}><Heart size={17} fill={favorites ? 'currentColor' : 'none'} />Favoris</button>
      </section>
      {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
      {loading ? <div className="mt-6 grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((value) => <div key={value} className="h-64 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />)}</div> : visible.length ? <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{visible.map((item) => <article key={`${ownerId}:${item.id}`} className="group relative overflow-hidden rounded-[1.5rem] bg-surface p-2 shadow-card"><Link to={`/hwayj/item/${item.id}`} className="block"><div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.2rem] bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-900 dark:to-violet-950/40"><ClothingImage ownerId={ownerId} item={item} className="h-full w-full object-contain p-2 transition group-hover:scale-105" />{item.colors?.length > 0 && <ColorSwatch colors={item.colors} className="absolute bottom-2 left-2 h-7 w-7 ring-2 ring-white dark:ring-slate-900" />}</div><div className="p-2"><strong className="block truncate pr-8 text-sm">{item.name}</strong><small className="mt-1 flex items-center justify-between gap-2 text-muted"><span className="truncate">{item.category}</span><span>{item.wearCount || 0}×</span></small></div></Link>{isOwnWardrobe ? <button type="button" onClick={() => updateClothingItem(ownerId, item.id, { favorite: !item.favorite })} className={`absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full shadow-md backdrop-blur ${item.favorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-500 dark:bg-slate-900/90'}`} aria-label={item.favorite ? `Retirer ${item.name} des favoris` : `Ajouter ${item.name} aux favoris`}><Heart size={19} fill={item.favorite ? 'currentColor' : 'none'} /></button> : item.favorite && <span className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-rose-500 text-white shadow-md"><Heart size={17} fill="currentColor" /></span>}</article>)}</section> : <section className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><span className="text-5xl">👚</span><h2 className="mt-4 text-lg font-black">{clothes.length ? 'Aucun résultat' : 'Votre dressing est vide'}</h2><p className="mt-2 text-sm text-muted">{clothes.length ? 'Essayez un autre filtre.' : 'Ajoutez votre premier vêtement avec le bouton +.'}</p><SlidersHorizontal className="mx-auto mt-4 text-muted" /></section>}
    </main>
  )
}

function Filter({ value, onChange, label, options }) {
  return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="field-input px-3 text-sm">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select></label>
}
