import type { Stage } from '../types'

type Tone = 'neutral' | 'accent' | 'warn' | 'ok' | 'bad'

const TONE: Record<Tone, { chip: string; dot: string }> = {
  neutral: { chip: 'bg-raised text-muted ring-line-strong', dot: 'bg-faint' },
  accent: { chip: 'bg-accent-soft text-accent-text ring-accent/25', dot: 'bg-accent' },
  warn: { chip: 'bg-warn-soft text-warn-text ring-warn/30', dot: 'bg-warn' },
  ok: { chip: 'bg-ok-soft text-ok-text ring-ok/30', dot: 'bg-ok' },
  bad: { chip: 'bg-bad-soft text-bad-text ring-bad/30', dot: 'bg-bad' },
}

const STATUS: Record<Stage, { label: string; tone: Tone; live: boolean }> = {
  queued: { label: 'Queued', tone: 'neutral', live: false },
  cloning: { label: 'Cloning', tone: 'accent', live: true },
  analyzing: { label: 'Analyzing', tone: 'accent', live: true },
  generating: { label: 'Generating', tone: 'accent', live: true },
  building: { label: 'Building', tone: 'warn', live: true },
  healing: { label: 'Healing', tone: 'warn', live: true },
  deploying: { label: 'Deploying', tone: 'accent', live: true },
  done: { label: 'Done', tone: 'ok', live: false },
  failed: { label: 'Failed', tone: 'bad', live: false },
  needs_review: { label: 'Needs review', tone: 'warn', live: false },
}

export function StatusBadge({ status }: { status: Stage }) {
  const s = STATUS[status] ?? STATUS.queued
  const tone = TONE[s.tone]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors duration-300 ${tone.chip}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {s.live && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.dot}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      </span>
      {s.label}
    </span>
  )
}
