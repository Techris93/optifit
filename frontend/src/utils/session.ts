const ACCESS_TOKEN_KEY = 'optifit.access_token'
const CLIENT_SESSION_KEY = 'optifit.client_session_id'

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `guest-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null
}

export function setAccessToken(token: string | null) {
  const storage = getStorage()
  if (!storage) return
  if (!token) {
    storage.removeItem(ACCESS_TOKEN_KEY)
    return
  }
  storage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getOrCreateClientSessionId() {
  const storage = getStorage()
  if (!storage) {
    return 'guest-session-fallback-0000'
  }

  const existing = storage.getItem(CLIENT_SESSION_KEY)
  if (existing) {
    return existing
  }

  const nextValue = generateSessionId()
  storage.setItem(CLIENT_SESSION_KEY, nextValue)
  return nextValue
}
