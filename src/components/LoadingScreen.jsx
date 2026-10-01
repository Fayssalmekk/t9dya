import Brand from './Brand'

export default function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-ink">
      <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
        <Brand />
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-600" aria-hidden="true" />
        <span className="sr-only">Chargement…</span>
      </div>
    </main>
  )
}
