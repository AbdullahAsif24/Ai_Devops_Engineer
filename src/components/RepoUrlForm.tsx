import { useState, type CSSProperties, type FormEvent } from 'react'
import { createJob } from '../lib/api'
import { repoName } from '../lib/format'
import { PIPELINE_STAGES } from '../lib/stageMeta'
import type { Job } from '../types'
import { AnimatedHeading } from './AnimatedHeading'
import { EnvVarForm } from './EnvVarForm'
import { AlertIcon, CheckIcon, ChevronDownIcon, GitHubIcon, Spinner } from './icons'
import { Patchbay } from './Patchbay'

const GITHUB_URL_RE = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/i

const rise = (i: number) => ({ '--i': i }) as CSSProperties

export function RepoUrlForm({ onJobCreated }: { onJobCreated: (job: Job) => void }) {
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEnvVars, setShowEnvVars] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  const trimmed = url.trim()
  const envCount = Object.keys(envVars).length
  const valid = GITHUB_URL_RE.test(trimmed)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!valid) {
      setError('Enter a valid GitHub repo URL, e.g. https://github.com/owner/repo')
      return
    }
    setSubmitting(true)
    try {
      const job = await createJob({ repo_url: trimmed, env_vars: envVars })
      onJobCreated(job)
      setUrl('')
      setEnvVars({})
      setShowEnvVars(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnvVarsSubmit = (vars: Record<string, string>) => {
    setEnvVars(vars)
    setShowEnvVars(false)
  }

  return (
    <div>
      <section className="relative pb-9 pt-1 sm:pb-10 sm:pt-4">
        <HeroRings />
        <AnimatedHeading
          lines={['Paste a repository.', 'Get a live URL.']}
          className="relative max-w-3xl text-[clamp(2.15rem,8.5vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.035em]"
        />
        <p style={rise(5)} className="rise relative mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-muted">
          The agent clones your repo, detects the stack, writes the deployment config and deploys it to Vercel for
          frontends or Render for backends.
        </p>
      </section>

      <form onSubmit={handleSubmit} noValidate style={rise(6)} className="rise relative">
        <div
          data-invalid={error ? true : undefined}
          data-valid={valid && !error ? true : undefined}
          className="repo-bar flex flex-wrap items-center gap-1.5 p-1.5 sm:flex-nowrap sm:gap-2"
        >
          <div className="flex min-w-0 basis-full items-center sm:flex-1 sm:basis-0">
          <GitHubIcon width={20} height={20} className="ml-3 shrink-0 text-faint" />
          <label htmlFor="repo" className="sr-only">
            GitHub repository URL
          </label>
          <input
            id="repo"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError(null)
            }}
            placeholder="https://github.com/owner/repo"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'repo-error' : undefined}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-ink outline-none placeholder:text-faint"
          />
          </div>
          <button
            type="submit"
            disabled={submitting || !trimmed}
            className="btn btn-primary magnetic h-11 w-full px-6 text-[15px] sm:w-auto"
          >
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Starting
              </>
            ) : (
              'Deploy'
            )}
          </button>
        </div>

        {error && (
          <p id="repo-error" role="alert" className="view-in mt-4 flex items-start gap-2 text-sm text-bad-text">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-4 flex min-h-9 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowEnvVars((v) => !v)}
            aria-expanded={showEnvVars}
            aria-controls="env-panel"
            className="btn btn-ghost btn-sm -ml-2"
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${showEnvVars ? 'rotate-180' : ''}`} />
            Environment variables
            {envCount > 0 && (
              <span className="rounded-full bg-accent-soft px-1.5 text-xs font-semibold tabular-nums text-accent-text">
                {envCount}
              </span>
            )}
          </button>

          {valid && !error && (
            <span
              key={trimmed}
              role="status"
              className="animate-pop inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ok-text"
            >
              <CheckIcon className="h-4 w-4 shrink-0" strokeWidth={3} />
              <span className="truncate">{repoName(trimmed)}</span>
            </span>
          )}
        </div>
      </form>

      {showEnvVars && (
        <div id="env-panel" className="mt-4">
          <EnvVarForm onSubmit={handleEnvVarsSubmit} initialVars={envVars} />
        </div>
      )}

      <div style={rise(7)} className="rise card spot mt-10 p-5 sm:mt-12 sm:p-9">
        <h2 className="mb-6 text-base font-semibold tracking-tight sm:mb-8">What happens after you press Deploy</h2>
        <Patchbay
          mode="intro"
          primed={valid && !error}
          stages={PIPELINE_STAGES}
          states={PIPELINE_STAGES.map(() => 'pending' as const)}
        />
      </div>
    </div>
  )
}

/**
 * Concentric rings behind the headline, a jack seen head-on. They draw in on load
 * and then keep turning: each ring at its own speed, alternating direction, with the
 * four stage arcs and two small beads riding along.
 */
function HeroRings() {
  const t = (seconds: number) => ({ '--t': `${seconds}s` }) as CSSProperties
  const delay = (i: number) => ({ '--i': i }) as CSSProperties
  const arcs = ['var(--c-clone)', 'var(--c-analyze)', 'var(--c-generate)', 'var(--c-deploy)']

  return (
    <svg
      aria-hidden="true"
      viewBox="-300 -300 600 600"
      className="hero-rings pointer-events-none absolute -right-56 -top-32 hidden h-[560px] w-[560px] md:block lg:-right-40 xl:-right-24"
    >
      {/* Soft core */}
      <g className="ring-in" style={delay(0)}>
        <circle r={54} fill="var(--sage-pale)" opacity={0.75} />
      </g>

      {/* Inner ring with the four stage arcs, turning clockwise */}
      <g className="ring-in" style={delay(1)}>
        <g className="orbit" style={t(32)}>
          <circle r={64} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} />
          {arcs.map((color, i) => (
            <g key={color} transform={`rotate(${-90 + i * 90 + 6})`}>
              <circle
                r={64}
                fill="none"
                stroke={color}
                strokeWidth={7}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="19 81"
              />
            </g>
          ))}
        </g>
      </g>

      {/* Dashed ring, counter-clockwise */}
      <g className="ring-in" style={delay(2)}>
        <g className="orbit orbit-rev" style={t(70)}>
          <circle
            r={118}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray="7 11"
          />
          <circle cx={118} r={6} fill="var(--rose)" stroke="var(--bg)" strokeWidth={3} />
        </g>
      </g>

      {/* Plain ring carrying a bead, clockwise */}
      <g className="ring-in" style={delay(3)}>
        <g className="orbit" style={t(48)}>
          <circle r={172} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} strokeOpacity={0.8} />
          <circle cx={-172} r={5} fill="var(--sage)" stroke="var(--bg)" strokeWidth={3} />
        </g>
      </g>

      {/* Fine dotted ring, counter-clockwise and very slow */}
      <g className="ring-in" style={delay(4)}>
        <g className="orbit orbit-rev" style={t(140)}>
          <circle
            r={226}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="0.1 14"
            strokeOpacity={0.9}
          />
        </g>
      </g>

      {/* Outer hairline */}
      <g className="ring-in" style={delay(5)}>
        <circle r={280} fill="none" stroke="var(--line)" strokeWidth={1.5} />
      </g>
    </svg>
  )
}
