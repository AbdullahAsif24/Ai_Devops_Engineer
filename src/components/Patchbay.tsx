import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { CheckIcon, Spinner, XIcon } from './icons'

export type JackState = 'pending' | 'running' | 'success' | 'failed'

export interface PatchStage {
  key: string
  label: string
  /** One line shown under the jack in intro mode. */
  detail?: string
  /** CSS colour (a --c-* token) that identifies this stage. */
  color: string
}

interface PatchbayProps {
  stages: PatchStage[]
  states: JackState[]
  /** intro: the home page preview. live: tracking a real job. */
  mode?: 'intro' | 'live'
  /** Intro only: a valid repo URL is entered, so the first cable plugs in. */
  primed?: boolean
}

const JACK = 48
const CY = JACK / 2
const ZONE = 92 // height of the jack row plus the room cables need to hang

// Intro loop. One signal leaves jack 1 and hops to the last jack, then the loop repeats.
// These must match the keyframes in index.css: a 3.6s cycle, each hop 0.9s (a quarter).
const LOOP_START = 1.2 // seconds after load, so the entrance finishes first
const HOP = 0.9
const TAIL = [0, 1, 2] // the head and two fading followers

const STATE_TEXT: Record<JackState, string> = {
  pending: 'pending',
  running: 'in progress',
  success: 'complete',
  failed: 'failed',
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

const r = (n: number) => Math.round(n * 10) / 10

/**
 * Four jacks joined by hanging cables. A cable draws in when the stage before
 * it completes, carries a moving dash while the next stage runs, and stays
 * solid afterwards. In intro mode a single pulse travels the board on load.
 */
export function Patchbay({ stages, states, mode = 'live', primed = false }: PatchbayProps) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const intro = mode === 'intro'
  const n = stages.length
  const cols: CSSProperties = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }
  const colW = width / n

  const cables = stages.slice(0, -1).map((stage, i) => {
    const x1 = colW * (i + 0.5)
    const x2 = colW * (i + 1.5)
    const dip = Math.min(58, Math.max(32, (x2 - x1) * 0.26))
    const c = CY + dip * 1.33
    return {
      d: `M ${r(x1)} ${CY} C ${r(x1)} ${r(c)}, ${r(x2)} ${r(c)}, ${r(x2)} ${CY}`,
      connected: states[i] === 'success' || (intro && primed && i === 0),
      flowing: states[i] === 'success' && states[i + 1] === 'running',
      color: stage.color,
    }
  })

  const hoverProps = (i: number) => ({
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(null),
  })

  return (
    <div role="group" aria-label="Deployment pipeline">
      {/* Stage names sit above the jacks so the cables have the space below. */}
      <div className="grid" style={cols}>
        {stages.map((stage, i) => {
          const state = states[i] ?? 'pending'
          const tone = intro
            ? 'text-ink'
            : state === 'pending'
              ? 'text-faint'
              : state === 'failed'
                ? 'text-bad-text'
                : 'text-ink'
          return (
            <p
              key={stage.key}
              {...hoverProps(i)}
              className={`text-center font-display text-[15px] font-bold tracking-tight transition-colors duration-300 ${tone}`}
            >
              {stage.label}
            </p>
          )
        })}
      </div>

      <div ref={ref} className="relative mt-3" style={{ height: ZONE }}>
        {width > 0 && (
          <svg
            aria-hidden="true"
            width={width}
            height={ZONE}
            className="pointer-events-none absolute inset-0 overflow-visible"
          >
            {cables.map((cable, i) => (
              <g key={i}>
                {/* Idle: a dotted guide showing where the cable will go. */}
                <path
                  d={cable.d}
                  fill="none"
                  stroke="var(--line-strong)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="0.1 8"
                  style={{ opacity: cable.connected ? 0 : 1, transition: 'opacity 0.4s ease' }}
                />
                {/* Live: the cable, drawn in from its source jack. */}
                <path
                  d={cable.d}
                  fill="none"
                  stroke={cable.color}
                  strokeWidth={7}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={cable.connected ? 0 : 1}
                  style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.5, 0, 0.2, 1)' }}
                />
                {/* Highlight along the top gives the cable some body. */}
                <path
                  d={cable.d}
                  fill="none"
                  stroke="#fff"
                  strokeOpacity={0.3}
                  strokeWidth={2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={cable.connected ? 0 : 1}
                  transform="translate(0 -1.5)"
                  style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.5, 0, 0.2, 1)' }}
                />
                {cable.flowing && (
                  <path
                    d={cable.d}
                    fill="none"
                    stroke="#fff"
                    strokeOpacity={0.7}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="2 14"
                    className="cable-flow"
                  />
                )}
              </g>
            ))}
          </svg>
        )}

        {/* A signal with a short fading tail runs the cables left to right, again and again. */}
        {width > 0 &&
          intro &&
          cables.flatMap((cable, i) =>
            TAIL.map((k) => (
              <span
                key={`pulse-${i}-${k}`}
                aria-hidden="true"
                className="pulse-dot"
                style={
                  {
                    '--c': cable.color,
                    '--s': 1 - k * 0.24,
                    '--o': 1 - k * 0.34,
                    offsetPath: `path("${cable.d}")`,
                    animationDelay: `${LOOP_START + i * HOP + k * 0.07}s`,
                  } as CSSProperties
                }
              />
            )),
          )}

        <div className="absolute inset-x-0 top-0 grid" style={cols}>
          {stages.map((stage, i) => {
            const state = states[i] ?? 'pending'
            const armed = intro && primed && i === 0
            return (
              <div key={stage.key} className="flex justify-center" {...hoverProps(i)}>
                <span
                  role="img"
                  aria-label={`${stage.label}: ${STATE_TEXT[state]}`}
                  aria-current={state === 'running' ? 'step' : undefined}
                  className="jack"
                  data-state={state}
                  data-armed={armed || undefined}
                  data-hover={hover === i || undefined}
                  data-beat={intro || undefined}
                  style={{ '--c': stage.color, '--k': i } as CSSProperties}
                >
                  {state === 'running' && (
                    <span
                      aria-hidden="true"
                      className="animate-ripple absolute inset-[-3px] rounded-full border-2"
                      style={{ borderColor: stage.color }}
                    />
                  )}
                  <span key={state} className={`grid place-items-center ${state === 'pending' ? '' : 'animate-pop'}`}>
                    {state === 'success' ? (
                      <CheckIcon className="h-5 w-5" strokeWidth={3} />
                    ) : state === 'failed' ? (
                      <XIcon className="h-5 w-5" strokeWidth={3} />
                    ) : state === 'running' ? (
                      <Spinner className="h-5 w-5" />
                    ) : (
                      <span className="font-display text-base font-bold tabular-nums">{i + 1}</span>
                    )}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {intro && (
        <div className="mt-1 hidden gap-x-4 sm:grid" style={cols}>
          {stages.map((stage, i) => (
            <p
              key={stage.key}
              {...hoverProps(i)}
              className={`text-pretty text-center text-sm leading-snug transition-colors duration-300 ${
                hover === i ? 'text-ink' : 'text-muted'
              }`}
            >
              {stage.detail}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
