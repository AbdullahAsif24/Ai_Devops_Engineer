import type { Stage } from '../types'

export interface StageMeta {
  key: Stage
  label: string
  /** The stage's colour token. Used only for this stage's jack and cable. */
  color: string
  /** What happens in this stage, in plain words. */
  detail: string
}

/** Core stages shown as jacks in the patch bay, in execution order. */
export const PIPELINE_STAGES: StageMeta[] = [
  { key: 'cloning', label: 'Clone', color: 'var(--c-clone)', detail: 'Pulls your repository, public or private.' },
  { key: 'analyzing', label: 'Analyze', color: 'var(--c-analyze)', detail: 'Detects the framework and stack.' },
  { key: 'generating', label: 'Generate', color: 'var(--c-generate)', detail: 'AI writes the deployment configuration.' },
  { key: 'deploying', label: 'Deploy', color: 'var(--c-deploy)', detail: 'Publishes to Vercel or Render.' },
]

/** Human labels for every stage (used by the log). */
export const STAGE_LABEL: Record<Stage, string> = {
  queued: 'Queued',
  cloning: 'Cloning',
  analyzing: 'Analyzing',
  generating: 'Generating',
  building: 'Building',
  healing: 'Healing',
  deploying: 'Deploying',
  done: 'Done',
  failed: 'Failed',
  needs_review: 'Needs Review',
}
