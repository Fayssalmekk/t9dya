import { useState } from 'react'

export default function SmartImage({ src, alt, emoji = '🍽️', className = '' }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
    {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />}
    {failed ? <span className="absolute inset-0 grid place-items-center text-6xl" role="img" aria-label={alt}>{emoji}</span> : <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} />}
  </div>
}
