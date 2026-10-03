const COLOR_HEX = {
  noir: '#111827',
  blanc: '#ffffff',
  'blanc casse': '#f7f3e8',
  ecru: '#f3ead3',
  ivoire: '#fffff0',
  gris: '#94a3b8',
  'gris clair': '#d1d5db',
  anthracite: '#374151',
  argent: '#cbd5e1',
  rouge: '#dc2626',
  bordeaux: '#7f1d1d',
  rose: '#ec4899',
  'rose poudre': '#e8b4b8',
  fuchsia: '#c026d3',
  orange: '#f97316',
  jaune: '#facc15',
  'jaune moutarde': '#ca8a04',
  vert: '#22c55e',
  'vert sauge': '#9caf88',
  emeraude: '#059669',
  kaki: '#66734a',
  olive: '#808000',
  turquoise: '#14b8a6',
  bleu: '#2563eb',
  'bleu ciel': '#7dd3fc',
  'bleu roi': '#1d4ed8',
  'bleu marine': '#172554',
  violet: '#7c3aed',
  mauve: '#a855f7',
  lavande: '#c4b5fd',
  lilas: '#d8b4fe',
  marron: '#8b5e3c',
  chocolat: '#5c3317',
  camel: '#c08457',
  terracotta: '#c65d3b',
  beige: '#d6c6a5',
  'beige clair': '#eadfca',
  taupe: '#8b7d6b',
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
  if (colors.some((color) => ['multicolore', 'multicolor', 'arc-en-ciel'].includes(colorKey(color)))) return RAINBOW
  if (colors.length > 1) return `linear-gradient(90deg, ${colors.map((color, index) => `${colorHex(color)} ${index / colors.length * 100}% ${(index + 1) / colors.length * 100}%`).join(', ')})`
  return colorHex(colors[0])
}

export const COLOR_CHOICES = ['Noir', 'Blanc', 'Blanc cassé', 'Écru', 'Ivoire', 'Crème', 'Beige clair', 'Beige', 'Taupe', 'Gris clair', 'Gris', 'Anthracite', 'Argent', 'Marron', 'Chocolat', 'Camel', 'Terracotta', 'Rouge', 'Bordeaux', 'Rose poudré', 'Rose', 'Fuchsia', 'Orange', 'Jaune moutarde', 'Jaune', 'Vert sauge', 'Vert', 'Kaki', 'Olive', 'Émeraude', 'Turquoise', 'Bleu ciel', 'Bleu', 'Bleu roi', 'Bleu marine', 'Lavande', 'Lilas', 'Mauve', 'Violet', 'Doré', 'Multicolore']
