import { useEffect, useRef } from 'react'
import type { JobEvent, Stage } from '../types'
import { STAGE_LABEL } from '../lib/stageMeta'
import { extractHttpUrl } from '../lib/urls'

// Stage colours come from the same tokens as the patch bay.
const STAGE_COLOR: Record<Stage, string> = {
  queued: 'text-faint',
  cloning: 'text-c-clone',
  analyzing: 'text-c-analyze',
  generating: 'text-c-generate',
  building: 'text-warn-text',
  healing: 'text-warn-text',
  deploying: 'text-c-deploy',
  done: 'text-ok-text',
  failed: 'text-bad-text',
  needs_review: 'text-warn-text',
}

function isRunning(stage: Stage): boolean {
  return stage === 'cloning' || stage === 'analyzing' || stage === 'generating' || stage === 'deploying'
}

function Glyph({ stage }: { stage: Stage }) {
  if (stage === 'done') return <span aria-hidden="true">✓</span>
  if (stage === 'failed') return <span aria-hidden="true">✗</span>
  if (stage === 'needs_review') return <span aria-hidden="true">?</span>
  return (
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 rounded-full bg-current ${isRunning(stage) ? 'animate-pulse' : ''}`}
    />
  )
}

/** Scrolling terminal log with per-event structured data surfaced inline. */
export function JobLog({ events, live = false }: { events: JobEvent[]; live?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  // Follow the stream: keep the newest line in view.
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [events])

  return (
    <section aria-label="Deployment logs" className="terminal overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-line bg-raised/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-medium text-muted">
          {live && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          )}
          {live ? 'Live logs' : 'Logs'}
        </div>
        <span className="tabular-nums text-faint">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      <div
        ref={ref}
        role="log"
        aria-live="polite"
        className="max-h-96 min-h-40 overflow-y-auto py-1.5 font-mono text-[12.5px] leading-relaxed"
      >
        {events.length === 0 ? (
          <p className="px-4 py-2 text-faint">
            Waiting for events
            <span className="animate-caret ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 bg-faint" />
          </p>
        ) : (
          events.map((event, i) => <LogRow key={i} event={event} />)
        )}
      </div>
    </section>
  )
}

function LogRow({ event }: { event: JobEvent }) {
  const color = STAGE_COLOR[event.stage]
  return (
    <div className="animate-log-in grid grid-cols-[6rem_1fr] gap-x-3 px-4 py-1 transition-colors hover:bg-raised/70 sm:grid-cols-[auto_6rem_1fr]">
      <span className="hidden tabular-nums text-faint sm:block">
        {typeof event.timestamp === 'string' ? event.timestamp.slice(11, 19) : ''}
      </span>
      <span className={`flex items-center gap-2 font-medium ${color}`}>
        <span className="flex w-3 justify-center">
          <Glyph stage={event.stage} />
        </span>
        {STAGE_LABEL[event.stage]}
      </span>
      <div className="min-w-0">
        <p className="break-words text-ink">{event.message}</p>
        <LogData event={event} />
      </div>
    </div>
  )
}

/** Renders structured data from event messages for new backend format. */
function LogData({ event }: { event: JobEvent }) {
  const { stage, message } = event

  if ((stage === 'deploying' || stage === 'done') && message.includes('http')) {
    const url = extractHttpUrl(message)
    if (url) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block break-all text-ok-text underline decoration-ok/40 underline-offset-2 transition-colors hover:text-ok"
        >
          {url}
        </a>
      )
    }
  }

  // Show detection information
  if (stage === 'analyzing' && message.includes('detected')) {
    return (
      <p className="mt-1 rounded-md border border-c-analyze/25 bg-accent-soft px-2 py-1 text-[12px] text-accent-text">
        {message}
      </p>
    )
  }

  // Show error messages
  if (stage === 'failed') {
    return (
      <pre className="mt-1 overflow-x-auto rounded-md border border-bad/25 bg-bad-soft p-2 text-[12px] text-bad-text">
        {message}
      </pre>
    )
  }

  return null
}
