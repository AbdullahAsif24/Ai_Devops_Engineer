import { useCallback, useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AlertIcon, GitHubIcon, ServerIcon, VercelIcon } from './icons'

type Platform = 'vercel' | 'render'

interface OAuthStatus {
  vercel: { connected: boolean; expires_at: string | null }
  render: { connected: boolean; expires_at: string | null }
}

type AuthUser = NonNullable<ReturnType<typeof useAuth>['user']>

const PLATFORMS: {
  key: Platform
  name: string
  blurb: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  tile: string
}[] = [
  { key: 'vercel', name: 'Vercel', blurb: 'Hosts frontends and static sites.', Icon: VercelIcon, tile: 'bg-ink text-bg' },
  { key: 'render', name: 'Render', blurb: 'Hosts backends and APIs.', Icon: ServerIcon, tile: 'bg-accent text-on-accent' },
]

/** Deployment platform connections. Needs a signed-in user. */
export function OAuthManager() {
  const { user, configured } = useAuth()

  if (!configured) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-raised text-muted">
          <ServerIcon width={20} height={20} />
        </span>
        <h2 className="mt-4 text-base font-semibold">Connect a backend to link accounts</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Vercel and Render connections are stored by the backend. Set{' '}
          <code className="rounded bg-raised px-1 py-0.5 font-mono text-xs text-ink">VITE_API_BASE_URL</code> in{' '}
          <code className="rounded bg-raised px-1 py-0.5 font-mono text-xs text-ink">.env.local</code> and restart the
          dev server.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-raised text-muted">
          <GitHubIcon width={20} height={20} />
        </span>
        <h2 className="mt-4 text-base font-semibold">Sign in to connect your accounts</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Use Sign in at the top right. Then you can connect Vercel and Render so deployments go to your own accounts.
        </p>
      </div>
    )
  }

  return <PlatformConnections user={user} />
}

function PlatformConnections({ user }: { user: AuthUser }) {
  const [status, setStatus] = useState<OAuthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/oauth/credentials/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to load OAuth status')
      const data = await response.json()
      setStatus(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load OAuth status')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load status on mount
  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const connect = async (platform: Platform) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Use the user's id if available, otherwise use a fallback
      const userId = user.id || (platform === 'vercel' ? 'test_user' : 'default_user')

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/oauth/${platform}/authorize?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (!response.ok) {
        throw new Error(`Failed to get ${platform === 'vercel' ? 'Vercel' : 'Render'} auth URL`)
      }
      const data = await response.json()
      // The platform sends the person back with ?code=...; the callback page needs to know which one.
      sessionStorage.setItem('oauth_pending', JSON.stringify({ platform, userId }))
      window.location.href = data.auth_url
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to connect ${platform}`)
    }
  }

  const disconnect = async (platform: Platform) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/oauth/credentials/${platform}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to disconnect')
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect')
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight">Deployment platforms</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Connect your own accounts and deployments will appear there instead of a shared one.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg bg-bad-soft p-3 text-sm text-bad-text ring-1 ring-inset ring-bad/30">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map(({ key, name, blurb, Icon, tile }) => {
          const connected = status?.[key].connected ?? false
          return (
            <div key={key} className="card card-hover spot flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tile}`}>
                  <Icon width={20} height={20} />
                </span>
                {loading && !status ? (
                  <span className="skeleton h-6 w-24 rounded-full" />
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors duration-300 ${
                      connected
                        ? 'bg-ok-soft text-ok-text ring-ok/30'
                        : 'bg-raised text-muted ring-line-strong'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-ok' : 'bg-faint'}`} />
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                )}
              </div>

              <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{name}</h3>
              <p className="mt-0.5 flex-1 text-sm text-muted">{blurb}</p>

              <div className="mt-5">
                {connected ? (
                  <button type="button" onClick={() => disconnect(key)} className="btn btn-danger btn-sm -ml-2.5">
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => connect(key)}
                    disabled={loading && !status}
                    className="btn btn-secondary btn-sm"
                  >
                    Connect {name}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
