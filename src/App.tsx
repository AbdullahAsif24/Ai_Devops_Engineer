import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthControl } from './components/AuthControl'
import { RepoUrlForm } from './components/RepoUrlForm'
import { PipelineRail } from './components/PipelineRail'
import { JobLog } from './components/JobLog'
import { SelfHealCallout } from './components/SelfHealCallout'
import { StatusBadge } from './components/StatusBadge'
import { History } from './components/History'
import { OAuthManager } from './components/OAuthManager'
import { OAuthCallback } from './components/OAuthCallback'
import { AutoDeployManager } from './components/AutoDeployManager'
import { SecretsManager } from './components/SecretsManager'
import { CustomDomainManager } from './components/CustomDomainManager'
import { AlertIcon, ArrowLeftIcon, ArrowUpRightIcon, BrandMark, CheckIcon, GitHubIcon, InfoIcon, Spinner } from './components/icons'
import { useAuth } from './auth/AuthContext'
import { useJobStream } from './hooks/useJobStream'
import { usePointerFx } from './hooks/usePointerFx'
import { getJob, USE_MOCK } from './lib/api'
import { hostOf, repoName } from './lib/format'
import type { Job } from './types'

type View = 'new' | 'history' | 'auto-deploy' | 'secrets' | 'domains' | 'settings'

const TABS: { key: View; label: string }[] = [
  { key: 'new', label: 'Deploy' },
  { key: 'history', label: 'History' },
  { key: 'auto-deploy', label: 'Auto-Deploy' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'domains', label: 'Domains' },
  { key: 'settings', label: 'Settings' },
]

function App() {
  const { user, configured, loading, signInWithGitHub } = useAuth()
  const [view, setView] = useState<View>(() => {
    // After connecting Vercel or Render the callback page sends people back to Settings.
    const next = sessionStorage.getItem('open_view')
    sessionStorage.removeItem('open_view')
    return next && ['settings', 'history', 'auto-deploy', 'secrets', 'domains'].includes(next)
      ? (next as View)
      : 'new'
  })

  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  usePointerFx()
  const [scrolled, setScrolled] = useState(false)

  // Navbar state: tint and shrink once the page moves, and a hairline that fills with scroll depth.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      headerRef.current?.style.setProperty('--p', max > 0 ? String(Math.min(1, y / max)) : '0')
      setScrolled(y > 8)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Check if this is an OAuth callback (query params or hash fragment)
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  if (urlParams.has('code') || hashParams.has('access_token') || hashParams.has('error')) {
    return <OAuthCallback />
  }

  // With a real backend, deploying needs a GitHub sign-in. Demo mode has no backend, so it needs none.
  const canUse = USE_MOCK || !!user
  const checkingSession = !USE_MOCK && loading

  function switchView(next: View) {
    setView(next)
    setActiveJob(null)
  }

  async function openJob(jobId: string) {
    try {
      setActiveJob(await getJob(jobId))
    } catch {
      // Job should exist for anything shown in history; ignore for now.
    }
  }

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <div aria-hidden="true" className="ambient" />
      <header ref={headerRef} data-scrolled={scrolled || undefined} className="nav sticky top-0 z-30">
        <div className="nav-inner mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-4 sm:px-5 md:grid-cols-[auto_1fr_auto]">
          <a href="/" className="group col-start-1 row-start-1 flex min-w-0 items-center gap-2.5 sm:gap-3 md:shrink-0">
            <BrandMark className="h-8 w-8 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1.3)] group-hover:-rotate-6 group-hover:scale-110 sm:h-9 sm:w-9" />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold leading-tight tracking-tight sm:text-base">
                <span className="nav-sweep">AI DevOps Engineer</span>
              </span>
              <span className="hidden text-xs text-muted lg:block">Repo-to-deployment agent</span>
            </span>
          </a>

          <TabNav
            view={view}
            onChange={switchView}
            className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1 md:w-[580px] md:justify-self-center"
          />

          <div className="col-start-2 row-start-1 flex items-center justify-end gap-1.5 md:col-start-3">
            <AuthControl />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-5 sm:pb-20 sm:pt-12 lg:pt-16">
        {checkingSession ? (
          <SessionLoading />
        ) : canUse ? (
          <>
            {!configured && !USE_MOCK && (
              <Notice tone="warn">Backend not configured. Set VITE_API_BASE_URL in .env.local.</Notice>
            )}

            <div key={activeJob ? `job-${activeJob.job_id}` : view} className="view-in">
              {activeJob ? (
                <ActiveJob job={activeJob} onReset={() => setActiveJob(null)} />
              ) : view === 'history' ? (
                <History onOpen={openJob} onNewDeploy={() => switchView('new')} />
              ) : view === 'auto-deploy' ? (
                <AutoDeployManager />
              ) : view === 'secrets' ? (
                <SecretsManager />
              ) : view === 'domains' ? (
                <CustomDomainManager />
              ) : view === 'settings' ? (
                <OAuthManager />
              ) : (
                <RepoUrlForm onJobCreated={setActiveJob} />
              )}
            </div>
          </>
        ) : (
          <SignInPrompt onSignIn={() => void signInWithGitHub()} />
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6 text-xs text-muted sm:px-5">
          <span className="flex items-center gap-2 font-medium text-ink">
            <BrandMark className="h-5 w-5" />
            AI DevOps Engineer
          </span>
          <span className="hidden sm:inline">Frontends deploy to Vercel, backends to Render.</span>
        </div>
      </footer>
    </div>
  )
}

/** Segmented control. The highlight slides between the equal-width tabs. */
function TabNav({
  view,
  onChange,
  className = '',
}: {
  view: View
  onChange: (next: View) => void
  className?: string
}) {
  const index = TABS.findIndex((t) => t.key === view)
  const count = TABS.length

  return (
    <nav
      aria-label="Sections"
      className={`relative grid grid-cols-6 rounded-xl border border-line bg-raised p-1 text-xs sm:text-sm ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 tab-pill rounded-lg transition-transform duration-300 ease-[cubic-bezier(0.3,0.9,0.3,1.1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${count})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {TABS.map((tab) => (
        <TabButton key={tab.key} active={view === tab.key} onClick={() => onChange(tab.key)}>
          {tab.label}
        </TabButton>
      ))}
    </nav>
  )
}


function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative z-10 whitespace-nowrap rounded-lg px-3 py-2 font-medium transition-colors duration-200 sm:py-1.5 ${
        active ? 'text-ink' : 'text-muted hover:bg-ink/[0.045] hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Notice({ tone, children }: { tone: 'info' | 'warn'; children: ReactNode }) {
  const style =
    tone === 'warn'
      ? 'bg-warn-soft text-warn-text ring-warn/30'
      : 'bg-accent-soft text-accent-text ring-accent/25'
  const Icon = tone === 'warn' ? AlertIcon : InfoIcon
  return (
    <div role="status" className={`mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${style}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0">{children}</p>
    </div>
  )
}

function ActiveJob({ job, onReset }: { job: Job; onReset: () => void }) {
  const { events, status, deployedUrl, error } = useJobStream(
    job.job_id,
    job.logs ?? [],
    job.deployment?.deployment_url ?? null,
  )

  const running =
    status === 'cloning' || status === 'analyzing' || status === 'generating' || status === 'deploying'

  return (
    <div className="space-y-5">
      <button type="button" onClick={onReset} className="btn btn-ghost btn-sm -ml-2.5">
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      <section className="card spot p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{repoName(job.repo_url)}</h2>
            <p className="mt-1 truncate text-sm text-muted">{job.repo_url}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-8">
          <PipelineRail events={events} />
        </div>

        <SelfHealCallout events={events} />

        {deployedUrl && (
          <a
            href={deployedUrl}
            target="_blank"
            rel="noreferrer"
            className="animate-heal-in group flex items-center gap-3 rounded-xl bg-ok-soft p-3.5 ring-1 ring-inset ring-ok/30 transition-shadow hover:ring-2 hover:ring-ok/60"
          >
            <span className="animate-pop grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-on-solid">
              <CheckIcon className="h-[18px] w-[18px]" strokeWidth={2.6} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ok-text">
                {USE_MOCK ? 'Demo ready' : 'Live now'}
              </span>
              <span className="block truncate font-mono text-xs text-ok-text/80">{hostOf(deployedUrl)}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-ok px-3 py-1.5 text-sm font-semibold text-on-solid transition-[filter] group-hover:brightness-110">
              {USE_MOCK ? 'Preview' : 'Open'}
              <ArrowUpRightIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
          </a>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad-text ring-1 ring-inset ring-bad/30"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </p>
        )}
      </section>

      <JobLog events={events} live={running} />
    </div>
  )
}

function SessionLoading() {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-sm text-muted">
      <Spinner className="h-6 w-6 text-accent" />
      Checking your session
    </div>
  )
}

function SignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      <div className="card spot view-in w-full max-w-md p-8 text-center sm:p-10">
        <BrandMark className="mx-auto h-12 w-12" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight">Sign in to deploy</h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">
          Continue with GitHub to deploy your repositories, including private ones, and keep your deployment history.
        </p>
        <button type="button" onClick={onSignIn} className="btn btn-primary magnetic mt-7 h-11 w-full text-[15px]">
          <GitHubIcon width={18} height={18} />
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}

export default App
