import { useEffect, useState, type CSSProperties } from 'react'
import type { JobSummary, Stage } from '../types'
import { listJobs } from '../lib/api'
import { formatWhen, hostOf, repoName } from '../lib/format'
import { StatusBadge } from './StatusBadge'
import { AlertIcon, ChevronRightIcon, GitHubIcon } from './icons'

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading history">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Deployment history, a list of past jobs. Click one to re-view it. */
export function History({
  onOpen,
  onNewDeploy,
}: {
  onOpen: (jobId: string) => void
  onNewDeploy?: () => void
}) {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    listJobs()
      .then((j) => alive && setJobs(j))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Failed to load history'))
    return () => {
      alive = false
    }
  }, [attempt])

  function retry() {
    setError(null)
    setJobs(null)
    setAttempt((n) => n + 1)
  }

  if (error) {
    return (
      <div role="alert" className="card flex items-start gap-3 border-bad/30 bg-bad-soft p-5">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-bad-text" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-bad-text">Couldn’t load your history</p>
          <p className="mt-1 break-words text-sm text-muted">{error}</p>
        </div>
        <button type="button" onClick={retry} className="btn btn-secondary btn-sm shrink-0">
          Try again
        </button>
      </div>
    )
  }

  if (jobs === null) {
    return <HistorySkeleton />
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
        <h2 className="text-base font-semibold">No deployments yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Deploy a repository and it will appear here with its status and live URL.
        </p>
        {onNewDeploy && (
          <button type="button" onClick={onNewDeploy} className="btn btn-primary mt-5">
            New deploy
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold tracking-tight">History</h2>
        <span className="text-sm tabular-nums text-muted">
          {jobs.length} {jobs.length === 1 ? 'deployment' : 'deployments'}
        </span>
      </div>
      <div className="space-y-3">
        {jobs.map((job, i) => (
          <button
            key={job.job_id}
            type="button"
            onClick={() => onOpen(job.job_id)}
            style={{ '--i': Math.min(i, 8) } as CSSProperties}
            className="rise card spot lift group flex w-full items-center gap-3 p-3.5 text-left sm:gap-4 sm:p-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raised text-muted transition-colors group-hover:text-ink">
              <GitHubIcon width={18} height={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{repoName(job.repo_url)}</span>
              <span className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                <span className="shrink-0">{formatWhen(job.created_at)}</span>
                {job.deployment?.deployment_url && (
                  <span className="truncate font-mono text-ok-text">{hostOf(job.deployment.deployment_url)}</span>
                )}
              </span>
            </span>
            <StatusBadge status={job.status as Stage} />
            <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-faint sm:block transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        ))}
      </div>
    </div>
  )
}
