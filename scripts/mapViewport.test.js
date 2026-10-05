import assert from 'node:assert/strict'
import test from 'node:test'
import { constrainCamera, gestureMetrics, moveCamera } from '../src/apps/map/mapViewport.js'

const CAMERA = { center: { x: 120, y: 100 }, zoom: 10 }
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)

test('one finger pans without changing zoom', () => {
  const next = moveCamera(CAMERA, { x: 0, y: 0, distance: 0 }, { x: 80, y: -40, distance: 0 })
  assert.equal(next.zoom, 10)
  close(next.center.x, 120 - 80 / 1024)
  close(next.center.y, 100 + 40 / 1024)
})

test('pinching doubles the scale and keeps the world point under moving fingers', () => {
  const start = { x: 90, y: -30, distance: 100 }
  const end = { x: 110, y: 20, distance: 200 }
  const next = moveCamera(CAMERA, start, end)
  assert.equal(next.zoom, 11)
  close(CAMERA.center.x + start.x / 1024, next.center.x + end.x / 2048)
  close(CAMERA.center.y + start.y / 1024, next.center.y + end.y / 2048)
})

test('fractional pinch is continuous rather than snapping to integer zoom', () => {
  const next = moveCamera(CAMERA, { x: 0, y: 0, distance: 100 }, { x: 0, y: 0, distance: 150 })
  close(next.zoom, 10 + Math.log2(1.5))
})

test('lifting one finger and rebasing produces no jump', () => {
  const pointers = new Map([[1, { x: -50, y: 20 }], [2, { x: 50, y: 20 }]])
  const start = gestureMetrics(pointers)
  pointers.set(2, { x: 100, y: 30 })
  const next = moveCamera(CAMERA, start, gestureMetrics(pointers))
  pointers.delete(2)
  const rebased = gestureMetrics(pointers)
  const unchanged = moveCamera(next, rebased, rebased)
  close(unchanged.center.x, next.center.x)
  close(unchanged.center.y, next.center.y)
  close(unchanged.zoom, next.zoom)
  pointers.clear()
  assert.equal(gestureMetrics(pointers), null)
})

test('zoom and latitude are bounded; longitude wraps at the date line', () => {
  assert.deepEqual(constrainCamera({ zoom: 25, center: { x: 260, y: -2 } }), { zoom: 19, center: { x: 4, y: 0 } })
  assert.deepEqual(constrainCamera({ zoom: 0, center: { x: -1, y: 300 } }), { zoom: 3, center: { x: 255, y: 256 } })
})

test('pinch zoom limits still preserve the focal point', () => {
  const camera = { ...CAMERA, zoom: 19 }
  const start = { x: 50, y: 50, distance: 100 }
  const end = { x: 80, y: 90, distance: 300 }
  const next = moveCamera(camera, start, end)
  assert.equal(next.zoom, 19)
  close(camera.center.x + 50 / (2 ** 19), next.center.x + 80 / (2 ** 19))
})
