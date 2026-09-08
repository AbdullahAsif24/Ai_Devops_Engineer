/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend REST/WebSocket base URL (set once the backend is running) */
  readonly VITE_API_BASE_URL?: string
  /** Force mock mode ('true') or real API ('false'); defaults to mock when no API base URL */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
