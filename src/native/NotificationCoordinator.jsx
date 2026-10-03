import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../services/firebase'
import { isNativeApp } from './capacitor'
import { notifyNativeOnce, syncDailyNotifications, syncHealthNotifications } from './notifications'

const timestampValue = (value) => value?.toMillis?.() || 0

export default function NotificationCoordinator() {
  const { user, household } = useAuth()
  const [items, setItems] = useState([])
  const [medications, setMedications] = useState([])
  const [appointments, setAppointments] = useState([])
  const [preferencesVersion, setPreferencesVersion] = useState(0)
  const initializedItems = useRef(false)

  useEffect(() => {
    const refresh = () => setPreferencesVersion((value) => value + 1)
    window.addEventListener('t9dya-notification-preferences', refresh)
    return () => window.removeEventListener('t9dya-notification-preferences', refresh)
  }, [])

  useEffect(() => {
    if (!isNativeApp || !user?.uid || !household?.id) return undefined
    initializedItems.current = false
    const listsStop = onSnapshot(collection(db, 'households', household.id, 'lists'), (snapshot) => {
      snapshot.docs.forEach((entry) => {
        const list = entry.data()
        if (list.status !== 'requested' || list.assignedTo !== user.uid) return
        const requestTime = timestampValue(list.shoppingRequestedAt) || timestampValue(list.updatedAt)
        const partnerName = household.memberProfiles?.[list.requestedBy]?.displayName || 'Votre partenaire'
        notifyNativeOnce({
          preferenceKey: 'shoppingRequests',
          eventKey: `${entry.id}:${requestTime}`,
          title: 'T9dya · Course à faire 🛒',
          body: `${partnerName} vous demande de faire « ${list.title || 'la liste'} ».`,
          path: '/t9dya/list',
          channelId: 'shopping-alerts'
        }).catch(() => {})
      })
    }, () => {})

    const itemsStop = onSnapshot(collection(db, 'households', household.id, 'items'), (snapshot) => {
      const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
      setItems(nextItems)
      const now = Date.now()
      snapshot.docChanges().filter((change) => change.type === 'added').forEach((change) => {
        const item = change.doc.data()
        if (item.addedBy === user.uid) return
        const createdAt = timestampValue(item.createdAt)
        if (!initializedItems.current && (!createdAt || now - createdAt > 120000)) return
        const partnerName = household.memberProfiles?.[item.addedBy]?.displayName || 'Votre partenaire'
        notifyNativeOnce({
          preferenceKey: 'partnerItems',
          eventKey: change.doc.id,
          title: 'Nouveau produit dans T9dya',
          body: `${partnerName} a ajouté ${item.name || 'un produit'} à une liste.`,
          path: '/t9dya/list',
          channelId: 'shopping-alerts'
        }).catch(() => {})
      })
      initializedItems.current = true
    }, () => {})

    return () => {
      listsStop()
      itemsStop()
      initializedItems.current = false
    }
  }, [household, user?.uid])

  useEffect(() => {
    if (!isNativeApp || !user?.uid || !household?.members?.length) return undefined
    const stops = household.members.flatMap((ownerId) => {
      const ownerName = household.memberProfiles?.[ownerId]?.displayName || 'Membre'
      return [
        onSnapshot(collection(db, 'users', ownerId, 'healthMedications'), (snapshot) => {
          setMedications((current) => [
            ...current.filter((entry) => entry.ownerId !== ownerId),
            ...snapshot.docs.map((entry) => ({ id: entry.id, ownerId, ownerName, ...entry.data() }))
          ])
        }, () => {}),
        onSnapshot(collection(db, 'users', ownerId, 'healthAppointments'), (snapshot) => {
          setAppointments((current) => [
            ...current.filter((entry) => entry.ownerId !== ownerId),
            ...snapshot.docs.map((entry) => ({ id: entry.id, ownerId, ownerName, ...entry.data() }))
          ])
        }, () => {})
      ]
    })
    return () => {
      stops.forEach((stop) => stop())
    }
  }, [household, user?.uid])

  useEffect(() => {
    if (!isNativeApp || !household?.members) return
    household.members.forEach((ownerId) => {
      syncHealthNotifications({
        ownerId,
        ownerName: household.memberProfiles?.[ownerId]?.displayName || 'Membre',
        medications: medications.filter((item) => item.ownerId === ownerId),
        appointments: appointments.filter((item) => item.ownerId === ownerId)
      }).catch(() => {})
    })

    medications.filter((item) => item.stockInitialized && Number(item.stock) <= Number(item.lowStockThreshold)).forEach((item) => {
      const changedAt = timestampValue(item.stockUpdatedAt) || timestampValue(item.updatedAt) || item.stock
      notifyNativeOnce({
        preferenceKey: 'lowStock',
        eventKey: `${item.ownerId}:${item.id}:${changedAt}`,
        title: `Stock faible · ${item.ownerName}`,
        body: `${item.name} arrive au seuil minimum (${item.stock} ${item.unit || ''}).`,
        path: `/s7a/medications?profile=${item.ownerId}`,
        channelId: 'health-reminders'
      }).catch(() => {})
    })

    appointments.forEach((item) => {
      const appointmentDate = new Date(`${item.date}T${item.time || '09:00'}:00`)
      const reminderDate = new Date(`${item.date}T09:00:00`)
      reminderDate.setDate(reminderDate.getDate() - (Number(item.reminderDays) || 7))
      if (appointmentDate.getTime() < Date.now() || reminderDate.getTime() > Date.now()) return
      notifyNativeOnce({
        preferenceKey: 'appointments',
        eventKey: `${item.ownerId}:${item.id}:${item.date}`,
        title: `Rendez-vous · ${item.ownerName}`,
        body: `${item.doctor}${item.specialty ? ` · ${item.specialty}` : ''} le ${item.date}${item.time ? ` à ${item.time}` : ''}.`,
        path: `/s7a/appointments?profile=${item.ownerId}`,
        channelId: 'health-reminders'
      }).catch(() => {})
    })
  }, [appointments, household, medications, preferencesVersion])

  useEffect(() => {
    if (!isNativeApp || !user?.uid) return
    syncDailyNotifications({
      userId: user.uid,
      openShoppingItems: items.filter((item) => !item.bought).length
    }).catch(() => {})
  }, [items, preferencesVersion, user?.uid])

  return null
}
