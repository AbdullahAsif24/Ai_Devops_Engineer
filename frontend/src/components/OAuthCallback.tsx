import { useEffect, useState } from 'react'
import { handleOAuthCallback } from '../auth/AuthContext'

export function OAuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase returns tokens in the hash fragment for security
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('OAuth callback hash params:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken, 
          error, 
          errorDescription,
          allParams: Object.fromEntries(hashParams.entries())
        })

        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`)
        }

        // If we have tokens directly from Supabase, use them
        if (accessToken) {
          console.log('Storing access token from Supabase hash')
          localStorage.setItem('auth_token', accessToken)
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken)
          }
          // Redirect to home page
          window.location.href = '/'
          return
        }

        // If no tokens in hash, check query parameters (fallback)
        const urlParams = new URLSearchParams(window.location.search)
        const queryCode = urlParams.get('code')
        const queryAccessToken = urlParams.get('access_token')
        
        if (queryAccessToken) {
          console.log('Storing access token from query params')
          localStorage.setItem('auth_token', queryAccessToken)
          window.location.href = '/'
          return
        }

        if (queryCode) {
          console.log('Using authorization code flow from query params')
          await handleOAuthCallback(queryCode)
          window.location.href = '/'
          return
        }

        console.error('No authorization data found in URL hash or query params')
        throw new Error('No authorization data found in URL')
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'OAuth callback failed')
        setLoading(false)
      }
    }

    handleCallback()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-rose-300">Authentication Failed</h2>
          <p className="mt-2 text-slate-400">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return null
}