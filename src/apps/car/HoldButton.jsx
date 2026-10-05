import { useEffect, useRef } from 'react'

export default function HoldButton({ onStep, disabled, label, children, className = '' }) {
  const timer = useRef(null)
  const started = useRef(0)
  const callback = useRef(onStep)
  useEffect(() => { callback.current = onStep }, [onStep])
  const stop = () => { window.clearTimeout(timer.current); timer.current = null }
  useEffect(() => {
    const cancel = () => { window.clearTimeout(timer.current); timer.current = null }
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', cancel)
    return () => { cancel(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', cancel) }
  }, [])
  useEffect(() => { if (disabled) { window.clearTimeout(timer.current); timer.current = null } }, [disabled])
  const start = (event) => {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    stop()
    event.currentTarget.setPointerCapture(event.pointerId)
    started.current = performance.now()
    callback.current(1)
    const repeat = () => {
      const elapsed = performance.now() - started.current
      callback.current(elapsed >= 3500 ? 100 : elapsed >= 1800 ? 10 : 1)
      timer.current = window.setTimeout(repeat, elapsed >= 1800 ? 80 : 140)
    }
    timer.current = window.setTimeout(repeat, 400)
  }
  return <button type="button" disabled={disabled} aria-label={label} title={`${label} · maintenir pour accélérer`} onPointerDown={start} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onPointerLeave={stop} onBlur={stop} onContextMenu={(event) => event.preventDefault()} onClick={(event) => { if (event.detail === 0) onStep(1) }} style={{ touchAction: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }} className={`grid h-11 w-11 shrink-0 select-none place-items-center rounded-xl disabled:opacity-35 ${className}`}>{children}</button>
}
