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

export const GlobeIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export const KeyIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M21 2l-2 2m-1.5 1.5L14 9l2 2-2 2-2-2-4.5 4.5a4.95 4.95 0 1 1-1.4-1.4L11 9.5 9 7.5 11 5.5 13.5 8 16 5.5l2-2z" />
  </svg>
)

export const RefreshCwIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

export const ShieldCheckIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const GitBranchIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
)

export const GitCommitIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="4" />
    <line x1="1.05" y1="12" x2="7" y2="12" />
    <line x1="17.01" y1="12" x2="22.96" y2="12" />
  </svg>
)

export const EyeIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOffIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export const UsersIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const CopyIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const ActivityIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

