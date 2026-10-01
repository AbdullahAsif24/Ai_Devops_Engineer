/** github.com/owner/repo → owner/repo */
export function repoName(url: string): string {
  const m = url.match(/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/i)
  return m?.[1] ?? url
}

/** ISO timestamp → "just now", "5m ago", "3d ago", or a local date. */
export function formatWhen(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.round((Date.now() - then) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

/** https://app.vercel.app/path → app.vercel.app (falls back to the raw string). */
export function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
