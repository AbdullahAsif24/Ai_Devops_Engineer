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

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configured, setConfiged] = useState(true)

  useEffect(() => {
    // Check if backend is configured
    const apiBase = import.meta.env.VITE_API_BASE_URL
    if (!apiBase) {
      setConfiged(false)
      setLoading(false)
      return
    }

    // Restore session on load
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      console.log('Loading session, token exists:', !!token)
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Session response status:', response.status)
      if (response.ok) {
        const userData = await response.json()
        console.log('User data loaded:', userData)
        console.log('User ID:', userData.user_id)
        console.log('User object structure:', Object.keys(userData))
        setUser(userData)
        // Update the stored token with the one from the response (it might be refreshed)
        localStorage.setItem('auth_token', userData.access_token)
      } else {
        console.error('Session validation failed:', response.status)
        // Token invalid, clear it
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGitHub = async () => {
    try {
      // Use Supabase directly for GitHub OAuth
      const supabaseUrl = 'https://ioxdvfqvpexdkoidgjrl.supabase.co'
      const redirectUrl = `${window.location.origin}`
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectUrl)}`
      
      console.log('Redirecting to Supabase OAuth:', authUrl)
      window.location.href = authUrl
    } catch (error) {
      console.error('GitHub sign-in failed:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  const value: AuthContextValue = {
    user,
    loading,
    configured,
    signInWithGitHub,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

// Helper function to handle OAuth callback
export async function handleOAuthCallback(code: string): Promise<User> {
  console.log('Calling backend OAuth callback with code')
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/github/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  console.log('Backend OAuth callback response status:', response.status)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('OAuth callback failed:', errorText)
    throw new Error('OAuth callback failed')
  }

  const userData = await response.json()
  console.log('User data from OAuth callback:', userData)

  // Store the access token
  localStorage.setItem('auth_token', userData.access_token)

  return userData
}