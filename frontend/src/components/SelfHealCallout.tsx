import type { JobEvent } from '../types'
import { BoltIcon, CheckIcon, Spinner, XIcon } from './icons'

type DeployPhase = 'cloning' | 'detecting' | 'generating' | 'deploying' | 'done' | 'failed'

interface DeployInfo {
  phase: DeployPhase
  framework: string | null
  platform: string | null
  message: string
}

/** Reconstruct the deployment story from the event stream, or null if it hasn't happened. */
function deriveDeploy(events: JobEvent[]): DeployInfo | null {
  if (events.length === 0) return null

  const lastEvent = events[events.length - 1]
  const analyzingEvent = events.find((e) => e.stage === 'analyzing')
  const deployingEvent = events.find((e) => e.stage === 'deploying')
  // The analyzing event that reports the framework marks the end of detection.
  const detectedEvent = events.find((e) => e.stage === 'analyzing' && e.message.includes('Detected'))

  let phase: DeployPhase
  if (lastEvent.stage === 'done') phase = 'done'
  else if (lastEvent.stage === 'failed') phase = 'failed'
  else if (deployingEvent) phase = 'deploying'
  else if (detectedEvent) phase = 'generating'
  else if (analyzingEvent) phase = 'detecting'
  else if (events.some((e) => e.stage === 'cloning')) phase = 'cloning'
  else phase = 'detecting'

  const framework = detectedEvent?.message.match(/Detected (.+?) framework/)?.[1] ?? null

  // Determine platform from message
  const platform = lastEvent.message.includes('Vercel')
    ? 'Vercel'
    : lastEvent.message.includes('Render')
      ? 'Render'
      : null

  return {
    phase,
    framework,
    platform,
    message: lastEvent.message,
  }
}

const CARD: Record<DeployPhase, string> = {
  cloning: 'border-accent/30 bg-accent-soft',
  detecting: 'border-accent/30 bg-accent-soft',
  generating: 'border-accent/30 bg-accent-soft',
  deploying: 'border-accent/30 bg-accent-soft',
  done: 'border-ok/30 bg-ok-soft',
  failed: 'border-bad/30 bg-bad-soft',
}

const BADGE: Record<DeployPhase, string> = {
  cloning: 'bg-accent/15 text-accent-text ring-accent/30',
  detecting: 'bg-accent/15 text-accent-text ring-accent/30',
  generating: 'bg-accent/15 text-accent-text ring-accent/30',
  deploying: 'bg-accent/15 text-accent-text ring-accent/30',
  done: 'bg-ok/15 text-ok-text ring-ok/30',
  failed: 'bg-bad/15 text-bad-text ring-bad/30',
}

const TEXT: Record<DeployPhase, string> = {
  cloning: 'text-accent-text',
  detecting: 'text-accent-text',
  generating: 'text-accent-text',
  deploying: 'text-accent-text',
  done: 'text-ok-text',
  failed: 'text-bad-text',
}

const TITLE: Record<DeployPhase, string> = {
  cloning: 'Cloning repository',
  detecting: 'Analyzing repository',
  generating: 'AI generating deployment',
  deploying: 'Configuring deployment',
  done: 'Configuration complete',
  failed: 'Deployment failed',
}

function PhaseIcon({ phase }: { phase: DeployPhase }) {
  if (phase === 'done') return <CheckIcon className="animate-pop h-[18px] w-[18px]" strokeWidth={2.6} />
  if (phase === 'failed') return <XIcon className="animate-pop h-[18px] w-[18px]" strokeWidth={2.6} />
  return <BoltIcon className="h-[18px] w-[18px] animate-pulse" />
}

/**
 * Shows the AI-powered deployment process. Displays framework detection,
 * AI generation, and cloud deployment progress.
 */
export function SelfHealCallout({ events }: { events: JobEvent[] }) {
  const info = deriveDeploy(events)
  if (!info) return null
  const { phase, framework, platform, message } = info
  const busy = phase === 'cloning' || phase === 'detecting' || phase === 'generating' || phase === 'deploying'

  const subtitle =
    phase === 'cloning'
      ? 'Fetching the repository files.'
      : phase === 'detecting'
      ? 'AI is analyzing the repository to detect the technology stack.'
      : phase === 'generating'
        ? `${framework ? `Detected ${framework}. ` : ''}AI is generating optimized deployment configuration.`
        : phase === 'deploying'
          ? `Configuring deployment for ${platform || 'cloud'}.`
          : phase === 'done'
            ? `Deployment configuration created for ${platform || 'cloud'}.`
            : 'Deployment encountered an error.'

  return (
    <div
      role="status"
      className={`animate-heal-in mb-4 rounded-xl border p-4 transition-colors duration-500 ${CARD[phase]}`}
    >
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-inset ${BADGE[phase]}`}>
          <PhaseIcon phase={phase} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{TITLE[phase]}</h3>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        {platform && (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[phase]}`}>
            {platform}
          </span>
        )}
      </div>

      {framework && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface/70 px-3 py-2 text-xs ring-1 ring-inset ring-line">
          <span className="text-muted">Framework</span>
          <span className="font-semibold">{framework}</span>
        </div>
      )}

      {message && phase !== 'done' && phase !== 'failed' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {busy && <Spinner className={`h-3.5 w-3.5 shrink-0 ${TEXT[phase]}`} />}
          <span className="min-w-0 break-words">{message}</span>
        </div>
      )}

      {phase === 'done' && (
        <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${TEXT[phase]}`}>
          <CheckIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
          <span className="min-w-0 break-words">{message}</span>
        </div>
      )}

      {phase === 'failed' && (
        <div className="mt-3 rounded-lg bg-surface/70 p-3 ring-1 ring-inset ring-bad/30">
          <p className={`text-xs font-semibold ${TEXT[phase]}`}>What went wrong</p>
          <p className="mt-1 break-words text-xs text-muted">{message}</p>
        </div>
      )}
    </div>
  )
}
