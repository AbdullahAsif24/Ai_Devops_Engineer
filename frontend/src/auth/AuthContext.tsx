import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface User {
  id: string
  access_token: string
  github_username: string | null
  email: string | null
  avatar_url: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  configured: boolean
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
}

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined

// GitHub sign-in goes through Supabase. The URL is public; set it per environment.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ioxdvfqvpexdkoidgjrl.supabase.co'
// Optional. The anon key is public by design; with it, expired sessions refresh quietly
// instead of signing the person out after an hour.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function clearTokens() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
}

/** Swap the stored refresh token for a fresh access token. Returns null if that isn't possible. */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken || !SUPABASE_ANON_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.access_token !== 'string') return null
    localStorage.setItem('auth_token', data.access_token)
    if (typeof data.refresh_token === 'string') localStorage.setItem('refresh_token', data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

function fetchSession(token: string) {
  return fetch(`${API_BASE}/auth/session`, { headers: { Authorization: `Bearer ${token}` } })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)

  useEffect(() => {
    // No backend URL means the app runs in demo mode with no sign-in.
    if (!API_BASE) {
      setConfigured(false)
      setLoading(false)
      return
    }
    void loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      let res = await fetchSession(token)
      if (!res.ok) {
        // Expired or rejected: try one silent refresh before giving up.
        const fresh = await refreshAccessToken()
        if (fresh) res = await fetchSession(fresh)
      }

      if (!res.ok) {
        clearTokens()
        return
      }

      const raw = await res.json()
      // The backend may name the identifier `user_id`; the rest of the app reads `id`.
      setUser({ ...raw, id: raw.id ?? raw.user_id ?? '' })
      if (typeof raw.access_token === 'string' && raw.access_token) {
        localStorage.setItem('auth_token', raw.access_token)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGitHub = async () => {
    const redirectUrl = window.location.origin
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectUrl)}`
  }

  const signOut = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  const value: AuthContextValue = { user, loading, configured, signInWithGitHub, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

/** Exchange an authorization code for a session through the backend. */
export async function handleOAuthCallback(code: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/github/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) throw new Error('OAuth callback failed')

  const raw = await response.json()
  if (typeof raw.access_token === 'string') localStorage.setItem('auth_token', raw.access_token)
  return { ...raw, id: raw.id ?? raw.user_id ?? '' }
}
