import type { CSSProperties } from 'react'

/**
 * Page headline that sets itself letter by letter: every character rises out of
 * its word's clipped box. Screen readers get the plain sentence through
 * aria-label; the split-up letters are hidden from them.
 */
export function AnimatedHeading({ lines, className = '' }: { lines: string[]; className?: string }) {
  let n = 0
  const rows = lines.map((line) =>
    line.split(' ').map((word) => Array.from(word).map((ch) => ({ ch, d: n++ }))),
  )

  return (
    <h1 aria-label={lines.join(' ')} className={className}>
      {rows.map((words, li) => (
        <span key={li} aria-hidden="true" className="block">
          {words.map((chars, wi) => (
            <span key={wi}>
              <span className="hero-word">
                {chars.map(({ ch, d }) => (
                  <span key={d} className="hero-char" style={{ '--d': d } as CSSProperties}>
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
