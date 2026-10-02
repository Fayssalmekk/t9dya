import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Bell, CalendarClock, PackageSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { todayKey } from '../s7a/utils/dates'
import { isMedicationDueOnDate } from '../s7a/utils/medicationSchedule'
import { syncHealthNotifications } from '../../native/notifications'

const TODAY = todayKey
const CURRENT_TIME = new Date().toTimeString().slice(0, 5)
const MS_DAY = 86400000

export default function HealthHubAlerts() {
  const { user, household } = useAuth()
  const [medications, setMedications] = useState([])
  const [appointments, setAppointments] = useState([])
  const [checks, setChecks] = useState([])
  useEffect(() => {
    if (!user?.uid) return undefined
    const memberIds = household?.members || [user.uid]
    const stops = memberIds.flatMap((ownerId) => {
      const ownerName = household?.memberProfiles?.[ownerId]?.displayName || 'Membre'
      return [
        onSnapshot(collection(db, 'users', ownerId, 'healthMedications'), (snapshot) => setMedications((current) => [...current.filter((entry) => entry.ownerId !== ownerId), ...snapshot.docs.map((entry) => ({ id: entry.id, ownerId, ownerName, ...entry.data() }))]), () => {}),
        onSnapshot(collection(db, 'users', ownerId, 'healthAppointments'), (snapshot) => setAppointments((current) => [...current.filter((entry) => entry.ownerId !== ownerId), ...snapshot.docs.map((entry) => ({ id: entry.id, ownerId, ownerName, ...entry.data() }))]), () => {}),
        onSnapshot(collection(db, 'users', ownerId, 'medicationChecks'), (snapshot) => setChecks((current) => [...current.filter((entry) => entry.ownerId !== ownerId), ...snapshot.docs.map((entry) => ({ id: entry.id, ownerId, ...entry.data() }))]), () => {})
      ]
    })
    return () => stops.forEach((stop) => stop())
  }, [household, user?.uid])
  useEffect(() => {
    const memberIds = household?.members || []
    memberIds.forEach((ownerId) => {
      syncHealthNotifications({
        ownerId,
        ownerName: household.memberProfiles?.[ownerId]?.displayName || 'Membre',
        medications: medications.filter((item) => item.ownerId === ownerId),
        appointments: appointments.filter((item) => item.ownerId === ownerId)
      }).catch(() => {})
    })
  }, [appointments, household, medications])
  const alerts = useMemo(() => {
    const low = medications.filter((item) => item.stockInitialized && item.stock <= item.lowStockThreshold).map((item) => ({ id: `stock-${item.ownerId}-${item.id}`, icon: PackageSearch, label: `${item.ownerName} · ${item.name} : stock faible`, to: `/s7a/diabetes?profile=${item.ownerId}` }))
    const checkedToday = new Set(checks.filter((item) => item.date === TODAY && item.taken).map((item) => `${item.ownerId}:${item.medicationId}`))
    const due = medications.filter((item) => item.kind === 'supplement' && isMedicationDueOnDate(item, TODAY) && !checkedToday.has(`${item.ownerId}:${item.id}`) && (!item.reminderTimes?.[0] || item.reminderTimes[0] <= CURRENT_TIME)).map((item) => ({ id: `dose-${item.ownerId}-${item.id}`, icon: Bell, label: `${item.ownerName} · ${item.name} : prise à confirmer`, to: `/s7a/today?profile=${item.ownerId}` }))
    const soon = appointments.filter((item) => { const days = Math.ceil((new Date(`${item.date}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / MS_DAY); return days >= 0 && days <= item.reminderDays }).map((item) => ({ id: `rdv-${item.ownerId}-${item.id}`, icon: CalendarClock, label: `${item.ownerName} · RDV ${item.doctor} le ${item.date}`, to: `/s7a/appointments?profile=${item.ownerId}` }))
    return [...due, ...low, ...soon].slice(0, 4)
  }, [appointments, checks, medications])
  useEffect(() => {
    if (!alerts.length || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const key = `${TODAY}:${alerts.map((item) => item.id).join(',')}`
    if (localStorage.getItem('s7a-last-hub-alert') === key) return
    localStorage.setItem('s7a-last-hub-alert', key)
    new Notification('S7a ya s7a · Rappel', { body: alerts[0].label, icon: '/t9dya-icon.svg', tag: key })
  }, [alerts])
  if (!alerts.length) return null
  return <section className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><div className="flex items-center gap-2"><Bell size={19} className="text-rose-500" /><strong>S7a ya s7a · {alerts.length} rappel{alerts.length > 1 ? 's' : ''}</strong></div><div className="mt-3 space-y-2">{alerts.map(({ id, icon: Icon, label, to }) => <Link key={id} to={to} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/70 px-3 text-sm font-bold dark:bg-slate-950/30"><Icon size={17} /><span className="min-w-0 flex-1 truncate">{label}</span><AlertCircle size={16} /></Link>)}</div></section>
}
