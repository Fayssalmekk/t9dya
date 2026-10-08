import test from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, carExpenseFields, daysUntil, taskStatus, validDate } from '../src/apps/car/model.js'
import { compactCarContext, compactCarResearch, validateCarChecks } from '../shared/carAi.js'

const TASK = { id: 'oil', intervalKm: 10000, intervalMonths: 0, baselineKm: 0, baselineDate: '' }

test('AI context stays compact and keeps only latest history per task', () => {
  const context = compactCarContext({ v: ['Škoda', 'Fabia', '', 2026, '1.0 TSI', 'Essence', 'Automatique', '', 'Maroc'], km: 12500, day: '2026-10-06', s: [
    { id: 'oil', n: 'Vidange', k: 10000, m: 0, b: 0, d: '' },
  ], h: [
    { t: 'oil', n: 'Vidange', k: 12000, d: '2026-10-01', key: 'oil' },
    { t: 'oil', n: 'Vidange', k: 5000, d: '2026-01-01', key: 'oil' },
  ] })
  assert.equal(context.h.length, 1)
  assert.equal(context.h[0].k, 12000)
  assert.equal(JSON.stringify(context).includes('plate'), false)
})

test('AI result rejects duplicates and unknown task IDs', () => {
  const context = compactCarContext({ v: ['Škoda', 'Fabia', '', 2026, '1.0 TSI', 'Essence', 'Automatique', '', 'Maroc'], km: 12500, day: '2026-10-06', s: [{ id: 'oil', n: 'Vidange', k: 10000, m: 0, b: 0, d: '' }], h: [] })
  const checks = ['oil', 'filters', 'tires', 'brakes', 'battery', 'fluids'].map((key, index) => ({ key, taskId: '', label: key, advice: 'Vérifier.', dueKm: 15000 + index * 1000, remainingKm: 0, dueDate: '', remainingDays: -1, urgency: 'upcoming', basis: 'manufacturer' }))
  assert.equal(validateCarChecks({ checks: [checks[0]] }, context).checks.length, 1)
  assert.equal(validateCarChecks({ checks }, context).checks.length, 6)
  assert.equal(validateCarChecks({ checks: checks.map((check, index) => index ? check : { ...check, taskId: 'missing' }) }, context).checks[0].taskId, '')
  assert.deepEqual(validateCarChecks({ checks: checks.map((check, index) => index < 2 ? { ...check, taskId: 'oil' } : check) }, context).checks.slice(0, 2).map((check) => check.taskId), ['oil', ''])
  assert.throws(() => validateCarChecks({ checks: checks.map((check, index) => index === 1 ? { ...check, key: 'oil' } : check) }, context), /OPENAI_ERROR/)
})

test('AI hides distant work and keeps reusable researched schedules', () => {
  const context = compactCarContext({ v: ['Škoda', 'Fabia', '', 2026, '', 'Essence', 'Automatique', '', 'Maroc'], km: 5000, day: '2026-10-06', s: [], h: [] })
  const result = validateCarChecks({ checks: [
    { key: 'oil', taskId: '', label: 'Vidange', advice: 'À prévoir.', dueKm: 15000, remainingKm: 0, dueDate: '', remainingDays: -1, urgency: 'upcoming', basis: 'manufacturer' },
    { key: 'transmission', taskId: '', label: 'Boîte', advice: 'Plus tard.', dueKm: 60000, remainingKm: 0, dueDate: '', remainingDays: -1, urgency: 'upcoming', basis: 'reliable' },
  ] }, context, 15000)
  assert.deepEqual(result.checks.map((check) => check.key), ['oil'])
  assert.equal(result.checks[0].remainingKm, 10000)
  assert.ok(compactCarResearch({ identity: 'Škoda Fabia 2026', summary: 'Référence enregistrée.', schedules: [{ key: 'oil', label: 'Vidange', everyKm: 15000, everyMonths: 12, firstDueKm: 15000, note: 'À confirmer avec le carnet.', basis: 'manufacturer' }] }))
})

test('AI keeps a distant mileage item when its calendar deadline is near', () => {
  const context = compactCarContext({ v: ['Škoda', 'Fabia', '', 2026, '', 'Essence', 'Automatique', '', 'Maroc'], km: 5000, day: '2026-10-06', s: [], h: [] })
  const result = validateCarChecks({ checks: [
    { key: 'oil', taskId: '', label: 'Vidange', advice: 'Bientôt par date.', dueKm: 60000, remainingKm: 0, dueDate: '2026-10-20', remainingDays: 0, urgency: 'soon', basis: 'manufacturer' },
    { key: 'tires', taskId: '', label: 'Pneus', advice: 'Contrôle visuel.', dueKm: -1, remainingKm: -1, dueDate: '', remainingDays: -1, urgency: 'inspect', basis: 'inspection' },
  ] }, context, 15000)
  assert.deepEqual(result.checks.map((check) => check.key), ['oil', 'tires'])
  assert.equal(result.checks[0].remainingDays, 14)
})

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
