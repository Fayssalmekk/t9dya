const messages = {
  'auth/email-already-in-use': 'Cette adresse e-mail possède déjà un compte.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/invalid-email': "L'adresse e-mail n'est pas valide.",
  'auth/missing-password': 'Saisissez votre mot de passe.',
  'auth/network-request-failed': 'Connexion impossible. Vérifiez votre réseau.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/weak-password': 'Utilisez un mot de passe d’au moins 6 caractères.',
  'firestore/permission-denied': 'Action refusée. Vérifiez le code ou déployez les règles Firestore.',
  'permission-denied': 'Action refusée. Vérifiez le code ou déployez les règles Firestore.',
  'firestore/not-found': 'Ce foyer est introuvable.',
  'not-found': 'Ce foyer est introuvable.',
  'invalid-invite-code': 'Le code doit ressembler à T9DYA-AB12CD34.'
}

export function getFirebaseErrorMessage(error) {
  return messages[error?.code] || messages[error?.message] || 'Une erreur est survenue. Réessayez.'
}
