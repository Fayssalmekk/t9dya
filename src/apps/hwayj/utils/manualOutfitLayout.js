const LIMITS = {
  x: [-38, 38],
  y: [-30, 30],
  scale: [0.55, 1.65],
}

export const DEFAULT_MANUAL_OUTFIT_LAYOUT = Object.freeze({
  top: Object.freeze({ x: 0, y: 0, scale: 1 }),
  bottom: Object.freeze({ x: 0, y: 0, scale: 1 }),
  front: 'top',
})

function clamp(value, [minimum, maximum], fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(maximum, Math.max(minimum, number))
}

function normalizePart(part = {}) {
  return {
    x: clamp(part.x, LIMITS.x, 0),
    y: clamp(part.y, LIMITS.y, 0),
    scale: clamp(part.scale, LIMITS.scale, 1),
  }
}

export function normalizeManualOutfitLayout(layout = {}) {
  return {
    top: normalizePart(layout.top),
    bottom: normalizePart(layout.bottom),
    front: layout.front === 'bottom' ? 'bottom' : 'top',
  }
}

export function resetManualOutfitPart(layout, slot) {
  return normalizeManualOutfitLayout({
    ...layout,
    [slot]: DEFAULT_MANUAL_OUTFIT_LAYOUT[slot],
  })
}
