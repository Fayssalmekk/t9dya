import { compactCarContext } from '../../../shared/carAi.js'

export function carContext(vehicle, tasks, services, today) {
  return compactCarContext({
    v: [vehicle.name, vehicle.year, vehicle.transmission, vehicle.engine], km: vehicle.odometer, day: today,
    s: tasks.filter((task) => task.active).map((task) => ({ id: task.id, n: task.name, k: task.intervalKm, m: task.intervalMonths, b: task.baselineKm, d: task.baselineDate })),
    h: services.map((entry) => ({ t: entry.taskId, n: entry.taskName, k: entry.odometer, d: entry.performedOn, key: entry.aiKey || '' })),
  })
}
