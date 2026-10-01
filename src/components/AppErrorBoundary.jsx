import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('T9dya interface error', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-5 text-ink">
        <section className="w-full max-w-md rounded-[1.75rem] bg-surface p-7 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700"><AlertTriangle size={27} /></span>
          <h1 className="mt-5 text-xl font-extrabold">T9dya a rencontré un petit problème</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Vos données sont conservées dans Firebase. T9dya peut réparer automatiquement ses fichiers locaux.</p>
          <button type="button" onClick={() => window.__t9dyaRepairApp?.() || window.location.reload()} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 font-extrabold text-white"><RefreshCw size={19} />Réparer et recharger</button>
        </section>
      </main>
    )
  }
}
