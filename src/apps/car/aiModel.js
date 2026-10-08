import { compactCarContext } from '../../../shared/carAi.js'

export function carContext(vehicle, odometer, tasks, services, today) {
  return compactCarContext({
    v: [vehicle.make, vehicle.model, vehicle.trim, vehicle.year, vehicle.engine, vehicle.fuel, vehicle.transmission, vehicle.gearbox, vehicle.market], r: vehicle.registrationDate, km: odometer, day: today,
    s: tasks.filter((task) => task.active).map((task) => ({ id: task.id, n: task.name, k: task.intervalKm, m: task.intervalMonths, b: task.baselineKm, d: task.baselineDate })),
    h: services.map((entry) => ({ t: entry.taskId || `ai:${entry.aiKey || 'other'}`, n: entry.taskName, k: entry.odometer, d: entry.performedOn, key: entry.aiKey || '' })),
  })
}
