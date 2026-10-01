import { useEffect, useState } from 'react'
import { handleOAuthCallback } from '../auth/AuthContext'
import { renderCallback, vercelCallback } from '../lib/api'
import { AlertIcon, BrandMark, Spinner } from './icons'

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

        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`)
        }

        // Returning from Vercel or Render after "Connect": hand the code to the backend.
        const pendingRaw = sessionStorage.getItem('oauth_pending')
        const platformCode = new URLSearchParams(window.location.search).get('code')
        if (pendingRaw && platformCode) {
          sessionStorage.removeItem('oauth_pending')
          const pending = JSON.parse(pendingRaw) as { platform: 'vercel' | 'render'; userId: string }
          if (pending.platform === 'vercel') await vercelCallback(platformCode, pending.userId)
          else await renderCallback(platformCode, pending.userId)
          sessionStorage.setItem('open_view', 'settings')
          window.location.href = '/'
          return
        }

        // If we have tokens directly from Supabase, use them
        if (accessToken) {
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
          localStorage.setItem('auth_token', queryAccessToken)
          window.location.href = '/'
          return
        }

        if (queryCode) {
          await handleOAuthCallback(queryCode)
          window.location.href = '/'
          return
        }

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
      <div className="grid min-h-dvh place-items-center bg-bg px-6">
        <div role="status" className="flex flex-col items-center text-center">
          <BrandMark className="h-11 w-11" />
          <Spinner className="mt-6 h-6 w-6 text-accent" />
          <p className="mt-3 text-sm font-medium">Completing sign in</p>
          <p className="mt-1 text-sm text-muted">You’ll be redirected in a moment.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6">
        <div role="alert" className="card view-in w-full max-w-md p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-bad-soft text-bad-text">
            <AlertIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Sign in failed</h2>
          <p className="mt-1 break-words text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="btn btn-primary mt-6"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return null
}
