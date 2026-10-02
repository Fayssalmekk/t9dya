import { auth } from '../../../services/firebase'
import { apiUrl } from '../../../services/api'

export async function callHwayjAI(action, payload) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('AUTH_REQUIRED')
  const response = await fetch(apiUrl('/api/ai'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, ...payload }) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'AI_UNAVAILABLE')
  return result
}
