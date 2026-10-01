import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const stroke = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const CheckIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const XIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const TrashIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
)

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const ArrowLeftIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)

export const ArrowUpRightIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
)

export const BoltIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
)

export const AlertIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </svg>
)

export const InfoIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5v.01" />
  </svg>
)

export const SunIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const MoonIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
  </svg>
)

export const LockIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
)

export const ServerIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5v.01M7 16.5v.01" />
  </svg>
)

export const GitHubIcon = ({ width = 16, height = 16, ...p }: IconProps) => (
  <svg viewBox="0 0 16 16" width={width} height={height} fill="currentColor" aria-hidden="true" {...p}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export const VercelIcon = ({ width = 16, height = 16, ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" width={width} height={height} fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 3l10 18H2L12 3z" />
  </svg>
)

/** Circular arc that rotates via Tailwind's animate-spin. */
export function Spinner({ className = 'h-4 w-4', ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`animate-spin ${className}`} {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Product mark: a jack with a cable hanging off it, in the same colours as the pipeline. */
export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="var(--ink)" />
      <path d="M11 17c0 7 10 7 10 0" fill="none" stroke="var(--rose)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="11" cy="12" r="4.4" fill="none" stroke="var(--bg)" strokeWidth="2.4" />
      <circle cx="21" cy="12" r="4.4" fill="var(--sage)" />
    </svg>
  )
}
