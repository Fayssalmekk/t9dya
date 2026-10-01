const COLOR_HEX = {
  noir: '#111827',
  blanc: '#ffffff',
  gris: '#94a3b8',
  argent: '#cbd5e1',
  rouge: '#dc2626',
  bordeaux: '#7f1d1d',
  rose: '#ec4899',
  orange: '#f97316',
  jaune: '#facc15',
  vert: '#22c55e',
  kaki: '#66734a',
  olive: '#808000',
  turquoise: '#14b8a6',
  bleu: '#2563eb',
  'bleu marine': '#172554',
  violet: '#7c3aed',
  mauve: '#a855f7',
  marron: '#8b5e3c',
  camel: '#c08457',
  beige: '#d6c6a5',
  creme: '#fff4d6',
  dore: '#d4a017',
}

const RAINBOW = 'conic-gradient(#ef4444 0 16.67%, #f97316 16.67% 33.33%, #facc15 33.33% 50%, #22c55e 50% 66.67%, #3b82f6 66.67% 83.33%, #8b5cf6 83.33% 100%)'

function colorKey(value) {
  return String(value || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function parseColors(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',')
  return [...new Set(values.map((color) => color.trim()).filter(Boolean))]
}

export function colorHex(value) {
  return COLOR_HEX[colorKey(value)] || '#a78bfa'
}

export function colorSwatchBackground(value) {
  const colors = parseColors(value)
  if (colors.length > 2 || colors.some((color) => ['multicolore', 'multicolor', 'arc-en-ciel'].includes(colorKey(color)))) return RAINBOW
  if (colors.length === 2) return `linear-gradient(90deg, ${colorHex(colors[0])} 0 50%, ${colorHex(colors[1])} 50% 100%)`
  return colorHex(colors[0])
}

export const COLOR_CHOICES = ['Noir', 'Blanc', 'Gris', 'Rouge', 'Rose', 'Orange', 'Jaune', 'Vert', 'Kaki', 'Bleu', 'Bleu marine', 'Violet', 'Marron', 'Camel', 'Beige', 'Crème', 'Multicolore']
