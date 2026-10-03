import { useAuth } from '../auth/AuthContext'
import { USE_MOCK } from '../lib/api'
import { GitHubIcon } from './icons'

/** Header auth control: shows sign-in, the current user, or a config hint. */
export function AuthControl() {
  const { user, loading, configured, signInWithGitHub, signOut } = useAuth()

  if (!configured) {
    // Mock mode is intentional, not an error, so it gets a neutral accent pill.
    if (USE_MOCK) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-text ring-1 ring-inset ring-accent/25">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Demo mode
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1.5 text-xs font-medium text-warn-text ring-1 ring-inset ring-warn/30">
        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
        Backend not configured
      </span>
    )
  }

  if (loading) {
    return <span className="skeleton block h-9 w-32" aria-label="Loading account" />
  }

  if (!user) {
    return (
      <button type="button" onClick={signInWithGitHub} className="btn btn-dark btn-sm h-9 px-3">
        <GitHubIcon />
        Sign in
        <span className="sr-only"> with GitHub</span>
      </button>
    )
  }

  const name: string = user.github_username || user.email || 'User'
  const avatar: string | undefined = user.avatar_url ?? undefined

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img src={avatar} alt="" className="h-8 w-8 rounded-full ring-1 ring-line-strong" />
      ) : (
        <div className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="hidden max-w-[7rem] truncate text-sm font-medium lg:inline" title={name}>
        {name}
      </span>
      <button type="button" onClick={signOut} className="btn btn-ghost btn-sm">
        Sign out
      </button>
    </div>
  )
}
