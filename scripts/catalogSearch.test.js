import test from 'node:test'
import assert from 'node:assert/strict'
import { catalog } from '../src/data/catalog.js'
import { matchesProductSearch, productSearchScore } from '../src/utils/catalogSearch.js'

const find = (query) => catalog.filter((product) => matchesProductSearch(product, query))
const names = (query) => find(query).map((product) => product.name)
const ranked = (query) => find(query).sort((first, second) => productSearchScore(second, query) - productSearchScore(first, query))

test('catalog finds Moroccan Darija, French and English aliases', () => {
  assert.ok(names('maticha').some((name) => name.includes('Tomate')))
  assert.ok(names('mticha').some((name) => name.includes('Tomate')))
  assert.ok(names('tomato').some((name) => name.includes('Tomate')))
  assert.ok(names('btata').some((name) => name.includes('Pommes de terre')))
  assert.ok(names('chicken').some((name) => name.includes('Poulet')))
  assert.ok(names('khobz').some((name) => name.includes('Pain')))
})

test('catalog tolerates a small typo and ranks direct names first', () => {
  assert.ok(names('maticha').length > 0)
  assert.ok(names('dentifrce').some((name) => name.includes('Dentifrice')))
  assert.equal(ranked('dentifrce')[0].name, 'Dentifrice')
  assert.equal(names('dentifrce').some((name) => name.includes('Huile de table')), false)
  assert.equal(names('matich').some((name) => name.includes('Eau minérale')), false)
  const tomates = catalog.find((product) => product.name === 'Tomates')
  const lait = catalog.find((product) => product.name === 'Lait entier')
  assert.ok(productSearchScore(tomates, 'tomate') > productSearchScore(lait, 'tomate'))
})

test('unrelated products stay out of specific searches', () => {
  assert.equal(find('maticha').some((product) => product.name === 'Papier toilette'), false)
  assert.equal(find('toothpaste').some((product) => product.name.includes('Tomate')), false)
  assert.equal(find('hlib').some((product) => product.name === 'Laitue'), false)
})
