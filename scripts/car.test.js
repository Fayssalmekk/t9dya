import test from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, carExpenseFields, daysUntil, taskStatus, validDate } from '../src/apps/car/model.js'

const TASK = { id: 'oil', intervalKm: 10000, intervalMonths: 0, baselineKm: 0, baselineDate: '' }

test('10k / 20k / 30k comes from actual confirmed services, not automatic checks', () => {
  assert.equal(taskStatus(TASK, [], 9999, '2026-10-01').nextKm, 10000)
  assert.equal(taskStatus(TASK, [], 20000, '2026-10-01').nextKm, 10000)
  assert.equal(taskStatus(TASK, [], 20000, '2026-10-01').due, true)
  const first = { taskId: 'oil', odometer: 10000, performedOn: '2026-01-01' }
  const second = { taskId: 'oil', odometer: 20000, performedOn: '2026-08-01' }
  assert.equal(taskStatus(TASK, [first], 15000, '2026-10-01').nextKm, 20000)
  assert.equal(taskStatus(TASK, [first, second], 21000, '2026-10-01').nextKm, 30000)
})

test('late service restarts interval at its real mileage, including historical inserts', () => {
  const log = [{ taskId: 'oil', odometer: 12000, performedOn: '2026-09-01' }, { taskId: 'oil', odometer: 5000, performedOn: '2026-01-01' }]
  assert.equal(taskStatus(TASK, log, 13000, '2026-10-01').nextKm, 22000)
  assert.equal(taskStatus(TASK, [log[1]], 13000, '2026-10-01').nextKm, 15000)
})

test('time OR mileage can make maintenance due, and missing mileage is not zero', () => {
  const task = { ...TASK, intervalMonths: 12, baselineDate: '2025-10-01' }
  assert.equal(taskStatus(task, [], 1000, '2026-10-01').due, true)
  const unknown = taskStatus(TASK, [], null, '2026-10-01')
  assert.equal(unknown.remainingKm, null)
  assert.equal(unknown.due, false)
  assert.equal(taskStatus(TASK, [], 9100, '2026-10-01').soon, true)
})

test('date arithmetic handles leap years, month end and invalid dates', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29')
  assert.equal(addMonths('2024-02-29', 12), '2025-02-28')
  assert.equal(validDate('2026-02-30'), false)
  assert.equal(validDate(''), false)
  assert.equal(daysUntil('2026-10-01', '2026-10-02'), -1)
  assert.equal(daysUntil('', '2026-10-02'), null)
})

test('car expenses use the shared record and non-car expenses stay unchanged', () => {
  assert.deepEqual(carExpenseFields({ category: 'food', carOdometer: 'nonsense' }), {})
  assert.deepEqual(carExpenseFields({ category: 'car', carKind: 'fuel', carOdometer: '12345', carLiters: '32.5' }), {
    vehicleId: 'main', carKind: 'fuel', carOdometer: 12345, carLiters: 32.5, carServiceId: ''
  })
  assert.equal(carExpenseFields({ category: 'car', carKind: 'repair', carLiters: 25 }).carLiters, null)
  assert.equal(carExpenseFields({ category: 'car', carKind: 'maintenance', carServiceId: 'service-123' }).carServiceId, 'service-123')
  assert.equal(carExpenseFields({ category: 'car' }).carOdometer, null)
})

test('invalid numeric expense metadata never reaches Firestore', () => {
  for (const carOdometer of [-1, 1.5, Infinity, 2000001]) assert.throws(() => carExpenseFields({ category: 'car', carOdometer }), /INVALID_CAR_ODOMETER/)
  for (const carLiters of [-1, 0, 301, 'bad']) assert.throws(() => carExpenseFields({ category: 'car', carKind: 'fuel', carLiters }), /INVALID_CAR_LITERS/)
})
