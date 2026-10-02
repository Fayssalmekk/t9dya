import { arrayUnion, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(length = 8) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')
}

export function normalizeInviteCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

export async function createHousehold(user, householdName) {
  const inviteCode = `T9DYA-${randomCode()}`
  const displayName = user.displayName || user.email?.split('@')[0] || 'Membre'
  const batch = writeBatch(db)

  batch.set(doc(db, 'households', inviteCode), {
    name: householdName.trim() || 'Notre foyer',
    inviteCode,
    members: [user.uid],
    memberProfiles: {
      [user.uid]: { uid: user.uid, displayName, email: user.email || '', birthDate: '', sex: '' }
    },
    budget: { monthly: 0, categories: {} },
    lastUsedStore: 'Marjane',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  batch.set(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email: user.email || '',
    birthDate: '',
    sex: '',
    householdId: inviteCode,
    updatedAt: serverTimestamp()
  }, { merge: true })

  await batch.commit()
  return inviteCode
}

export async function joinHousehold(user, rawCode) {
  const inviteCode = normalizeInviteCode(rawCode)
  if (!/^T9DYA-[A-Z0-9]{8}$/.test(inviteCode)) throw new Error('invalid-invite-code')

  const displayName = user.displayName || user.email?.split('@')[0] || 'Membre'
  const batch = writeBatch(db)
  batch.update(doc(db, 'households', inviteCode), {
    members: arrayUnion(user.uid),
    [`memberProfiles.${user.uid}`]: { uid: user.uid, displayName, email: user.email || '', birthDate: '', sex: '' },
    updatedAt: serverTimestamp()
  })
  batch.set(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email: user.email || '',
    birthDate: '',
    sex: '',
    householdId: inviteCode,
    updatedAt: serverTimestamp()
  }, { merge: true })
  await batch.commit()
  return inviteCode
}

export function updateHouseholdName(householdId, name) {
  return updateDoc(doc(db, 'households', householdId), {
    name: name.trim(),
    updatedAt: serverTimestamp()
  })
}

export async function updateMemberProfile(user, householdId, values) {
  const displayName = values.displayName.trim()
  const birthDate = values.birthDate || ''
  const sex = ['male', 'female'].includes(values.sex) ? values.sex : ''
  const memberProfile = { uid: user.uid, displayName, email: user.email || '', birthDate, sex }
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', user.uid), { displayName, birthDate, sex, updatedAt: serverTimestamp() })
  batch.update(doc(db, 'households', householdId), { [`memberProfiles.${user.uid}`]: memberProfile, updatedAt: serverTimestamp() })
  await batch.commit()
}
