import { useEffect } from 'react'

/**
 * Pointer-driven polish, enabled only for a fine pointer with motion allowed.
 *  - --cx/--cy  cursor position, drives the ambient glow behind the page
 *  - --px/--py  cursor position from -1 to 1, drives the hero ring parallax
 *  - .spot      cards get --mx/--my so a soft light follows the cursor inside them
 *  - .magnetic  buttons lean slightly toward the cursor while it is over them
 * One delegated listener, throttled to animation frames. No re-renders.
 */
export function usePointerFx() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || calm) return

    const root = document.documentElement
    let frame = 0
    let last: PointerEvent | null = null
    let leaning: HTMLElement | null = null

    const release = (el: HTMLElement | null) => {
      el?.style.removeProperty('--tx')
      el?.style.removeProperty('--ty')
    }

    const apply = () => {
      frame = 0
      const e = last
      if (!e) return

      root.style.setProperty('--cx', `${e.clientX}px`)
      root.style.setProperty('--cy', `${e.clientY}px`)
      root.style.setProperty('--px', (e.clientX / window.innerWidth - 0.5).toFixed(3))
      root.style.setProperty('--py', (e.clientY / window.innerHeight - 0.5).toFixed(3))

      const target = e.target instanceof Element ? e.target : null

      const spot = target?.closest<HTMLElement>('.spot')
      if (spot) {
        const r = spot.getBoundingClientRect()
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`)
        spot.style.setProperty('--my', `${e.clientY - r.top}px`)
      }

      const magnet = target?.closest<HTMLElement>('.magnetic') ?? null
      if (magnet !== leaning) {
        release(leaning)
        leaning = magnet
      }
      if (magnet && !(magnet as HTMLButtonElement).disabled) {
        const r = magnet.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
        magnet.style.setProperty('--tx', `${(dx * 5).toFixed(2)}px`)
        magnet.style.setProperty('--ty', `${(dy * 4).toFixed(2)}px`)
      }
    }

    const onMove = (e: PointerEvent) => {
      last = e
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const onLeave = () => {
      release(leaning)
      leaning = null
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
      release(leaning)
    }
  }, [])
}
