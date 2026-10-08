import { auth } from '../../../services/firebase'
import { apiUrl } from '../../../services/api'

export class HwayjAIError extends Error {
  constructor(code, status = 0) {
    super(code || 'AI_UNAVAILABLE')
    this.name = 'HwayjAIError'
    this.code = code || 'AI_UNAVAILABLE'
    this.status = status
  }
}

export async function callHwayjAI(action, payload) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new HwayjAIError('AUTH_REQUIRED', 401)
  let response
  try {
    response = await fetch(apiUrl('/api/ai'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, ...payload }) })
  } catch {
    throw new HwayjAIError('NETWORK_ERROR')
  }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new HwayjAIError(result.error || `HTTP_${response.status}`, response.status)
  return result
}

const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  UNAUTHORIZED: 'Votre session n’est plus valide. Reconnectez-vous puis réessayez.',
  NOT_ALLOWED: 'Ce compte n’est pas autorisé à utiliser GPT.',
  AUTH_CONFIGURATION_UNAVAILABLE: 'La vérification du compte est mal configurée sur le serveur.',
  AI_NOT_CONFIGURED: 'La clé OpenAI n’est pas configurée sur le serveur.',
  MODEL_NOT_CONFIGURED: 'Le modèle GPT n’est pas configuré sur le serveur.',
  TEXT_MODEL_NOT_CONFIGURED: 'Le modèle texte GPT n’est pas configuré sur le serveur.',
  MODEL_NOT_FOUND: 'Le modèle GPT configuré est introuvable ou inaccessible.',
  OPENAI_AUTH_ERROR: 'La clé OpenAI est invalide ou n’a pas accès au modèle configuré.',
  INVALID_IMAGES: 'Le look doit contenir entre 2 et 4 images valides.',
  INVALID_IMAGE: 'Une des images est illisible, trop lourde ou dans un format non accepté.',
  INVALID_CAR_DATA: 'Les informations de la voiture sont incomplètes. Vérifiez le compteur puis réessayez.',
  IMAGE_TOO_LARGE: 'Une des images reste trop lourde après compression.',
  BODY_TOO_LARGE: 'Les images réunies sont trop lourdes pour être envoyées. Retirez une pièce ou utilisez des photos plus légères.',
  credit_balance_exhausted: 'Les crédits OpenAI sont épuisés. Rechargez le compte OpenAI puis réessayez.',
  insufficient_quota: 'Le quota ou les crédits OpenAI sont épuisés.',
  RATE_LIMIT_REACHED: 'OpenAI reçoit trop de demandes. Attendez un moment puis réessayez.',
  rate_limit_exceeded: 'OpenAI reçoit trop de demandes. Attendez un moment puis réessayez.',
  CONTENT_BLOCKED: 'GPT a refusé cette génération à cause de ses règles de contenu.',
  content_policy_violation: 'GPT a refusé cette génération à cause de ses règles de contenu.',
  AI_TIMEOUT: 'GPT a mis trop de temps à répondre. Réessayez avec moins de pièces.',
  OPENAI_UNREACHABLE: 'Le serveur n’arrive pas à joindre OpenAI pour le moment.',
  OPENAI_TEMPORARY_ERROR: 'OpenAI rencontre un problème temporaire. Réessayez dans quelques instants.',
  EMPTY_AI_IMAGE: 'GPT a répondu sans fournir d’image. Relancez la génération.',
  OPENAI_INVALID_REQUEST: 'OpenAI a refusé les images ou les paramètres envoyés.',
  OPENAI_ERROR: 'OpenAI a refusé la demande sans donner une raison plus précise.',
  NETWORK_ERROR: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
  AI_UNAVAILABLE: 'Le service GPT est indisponible pour le moment.',
}

export function getHwayjAIErrorMessage(error) {
  const code = error?.code || error?.message || 'AI_UNAVAILABLE'
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  const safeCode = String(code).match(/^[A-Za-z0-9_.-]{2,80}$/)?.[0]
  return safeCode ? `La génération a échoué (raison technique : ${safeCode}).` : ERROR_MESSAGES.AI_UNAVAILABLE
}
