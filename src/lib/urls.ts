/** Pull a clean http(s) URL out of a log line, stripping trailing punctuation. */
export function extractHttpUrl(text: string | undefined | null): string | null {
  if (!text) return null
  const match = text.match(/https?:\/\/[^\s<>"']+/i)
  if (!match) return null
  return match[0].replace(/[.,;:!?)]+$/g, '')
}

export function ensureHttps(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}
