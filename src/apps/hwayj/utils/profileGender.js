const femaleNames = ['salma']
const maleNames = ['fayssal', 'fayçal', 'faissal', 'faisal']

const normalize = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function getWardrobeGender(profile) {
  if (['female', 'male'].includes(profile?.sex)) return profile.sex
  if (['female', 'male'].includes(profile?.wardrobeGender)) return profile.wardrobeGender
  const identity = normalize(`${profile?.displayName || ''} ${profile?.email || ''}`)
  if (femaleNames.some((name) => identity.includes(normalize(name)))) return 'female'
  if (maleNames.some((name) => identity.includes(normalize(name)))) return 'male'
  return 'neutral'
}

export function getWardrobeGenderLabel(profile) {
  const gender = getWardrobeGender(profile)
  return gender === 'female' ? 'Femme' : gender === 'male' ? 'Homme' : 'Profil personnel'
}
