export function constrainCamera(camera) {
  return {
    zoom: Math.max(3, Math.min(19, camera.zoom)),
    center: {
      x: ((camera.center.x % 256) + 256) % 256,
      y: Math.max(0, Math.min(256, camera.center.y))
    }
  }
}

export function gestureMetrics(pointers) {
  const [first, second] = [...pointers.values()]
  if (!first) return null
  return second ? {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y))
  } : { ...first, distance: 0 }
}

// World coordinates are zoom-0 pixels. Keep the same world point under the fingers.
export function moveCamera(camera, start, current) {
  const zoom = Math.max(3, Math.min(19, camera.zoom + (start.distance && current.distance ? Math.log2(current.distance / start.distance) : 0)))
  return constrainCamera({
    zoom,
    center: {
      x: camera.center.x + start.x / (2 ** camera.zoom) - current.x / (2 ** zoom),
      y: camera.center.y + start.y / (2 ** camera.zoom) - current.y / (2 ** zoom)
    }
  })
}
