import type { JobEvent, Stage } from '../types'
import { PIPELINE_STAGES } from '../lib/stageMeta'
import { Patchbay } from './Patchbay'

type ChipState = 'pending' | 'running' | 'success' | 'failed'

/** Derive each pipeline step's state from the event stream. */
function latestStatusByStage(events: JobEvent[]): Map<Stage, ChipState> {
  const m = new Map<Stage, ChipState>()
  const stages = PIPELINE_STAGES.map((s) => s.key)

  // The furthest pipeline step any event has reached is the current one.
  let current = -1
  let hasFailed = false
  for (const e of events) {
    if (e.stage === 'failed') hasFailed = true
    current = Math.max(current, stages.indexOf(e.stage))
  }

  const done = events[events.length - 1]?.stage === 'done'

  stages.forEach((stage, i) => {
    if (done) m.set(stage, 'success')
    else if (hasFailed) {
      // Steps before the one that failed finished fine; later ones never started.
      const failedAt = Math.max(current, 0)
      if (i < failedAt) m.set(stage, 'success')
      else if (i === failedAt) m.set(stage, 'failed')
    } else if (i < current) m.set(stage, 'success')
    else if (i === current) m.set(stage, 'running')
  })

  return m
}

function toChipState(state: ChipState | undefined): ChipState {
  return state ?? 'pending'
}

/** Live tracker for a job: the patch bay, driven by the event stream. */
export function PipelineRail({ events }: { events: JobEvent[] }) {
  const byStage = latestStatusByStage(events)
  const states = PIPELINE_STAGES.map((stage) => toChipState(byStage.get(stage.key)))

  return <Patchbay stages={PIPELINE_STAGES} states={states} mode="live" />
}
