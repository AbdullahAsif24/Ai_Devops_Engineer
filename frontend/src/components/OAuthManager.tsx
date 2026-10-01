import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

interface OAuthStatus {
  vercel: { connected: boolean; expires_at: string | null }
  render: { connected: boolean; expires_at: string | null }
  railway: { connected: boolean; expires_at: string | null }
}

export function OAuthManager() {
  const { user, configured } = useAuth()
  const [status, setStatus] = useState<OAuthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!configured || !user) {
    return null
  }

  const loadStatus = async () => {
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
  }

  const connectVercel = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('User object in OAuthManager:', user)
      console.log('User ID:', user.id)

      const userId = user.id || 'test_user'
      console.log('Using user_id for OAuth:', userId)

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/oauth/vercel/authorize?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to get Vercel auth URL')
      const data = await response.json()
      console.log('Vercel auth URL:', data.auth_url)
      window.location.href = data.auth_url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect Vercel')
    }
  }

  const connectRender = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('User object in OAuthManager:', user)
      console.log('User ID:', user.id)

      const userId = user.id || 'default_user'
      console.log('Using user_id for OAuth:', userId)

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/oauth/render/authorize?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to get Render auth URL')
      const data = await response.json()
      window.location.href = data.auth_url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect Render')
    }
  }

  const connectRailway = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('User object in OAuthManager:', user)
      console.log('User ID:', user.id)

      const userId = user.id || 'default_user'
      console.log('Using user_id for OAuth:', userId)

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/oauth/railway/authorize?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to get Railway auth URL')
      const data = await response.json()
      window.location.href = data.auth_url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect Railway')
    }
  }

  const disconnect = async (platform: 'vercel' | 'render' | 'railway') => {
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

  // Load status on mount
  useEffect(() => {
    loadStatus()
  }, [])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Deployment Platforms</h3>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 px-4 py-2 text-xs text-rose-300 ring-1 ring-rose-500/30">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Vercel */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
              <span className="text-white font-bold">▲</span>
            </div>
            <div>
              <p className="font-medium text-white">Vercel</p>
              <p className="text-xs text-slate-400">
                {loading ? 'Loading...' : status?.vercel.connected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {status?.vercel.connected ? (
            <button
              type="button"
              onClick={() => disconnect('vercel')}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connectVercel}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:bg-slate-200"
            >
              Connect
            </button>
          )}
        </div>

        {/* Render */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-white font-bold">●</span>
            </div>
            <div>
              <p className="font-medium text-white">Render</p>
              <p className="text-xs text-slate-400">
                {loading ? 'Loading...' : status?.render.connected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {status?.render.connected ? (
            <button
              type="button"
              onClick={() => disconnect('render')}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connectRender}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Connect
            </button>
          )}
        </div>

        {/* Railway */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
              <span className="text-white font-bold">🚂</span>
            </div>
            <div>
              <p className="font-medium text-white">Railway</p>
              <p className="text-xs text-slate-400">
                {loading ? 'Loading...' : status?.railway.connected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {status?.railway.connected ? (
            <button
              type="button"
              onClick={() => disconnect('railway')}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connectRailway}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}