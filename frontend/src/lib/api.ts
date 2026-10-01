import { mockCreateJob } from './mock'
import { getMockJob, listMockJobs } from './mockStore'
import type { CreateJobRequest, Job, JobSummary, DeploymentResult } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL

/** Mock mode: on when explicitly forced, or when no backend URL is configured. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Attach the stored auth token as a Bearer header when signed in. */
async function authHeader(): Promise<Record<string, string>> {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readError(res: Response): Promise<string> {
  try {
    return (await res.text()) || res.statusText
  } catch {
    return res.statusText
  }
}

/** POST /jobs — create a deployment job. */
export async function createJob(req: CreateJobRequest): Promise<Job> {
  if (USE_MOCK) return mockCreateJob(req)
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as Job
}

/** GET /jobs/{id} — full job state incl. event history (used on reconnect). */
export async function getJob(jobId: string): Promise<Job> {
  if (USE_MOCK) {
    const job = getMockJob(jobId)
    if (!job) throw new ApiError(404, 'Job not found')
    return job
  }
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as Job
}

/** GET /jobs — deployment history for the signed-in user. */
export async function listJobs(): Promise<JobSummary[]> {
  if (USE_MOCK) return listMockJobs()
  const res = await fetch(`${API_BASE}/jobs`, {
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  const body = (await res.json()) as JobSummary[]
  return body ?? []
}

/** GET /deployments/{service_id}/status — get Render deployment status. */
export async function getDeploymentStatus(serviceId: string): Promise<Record<string, unknown>> {
  if (USE_MOCK) return { status: 'ready', url: 'https://mock-render-url.onrender.com' }
  const res = await fetch(`${API_BASE}/deployments/${serviceId}/status`, {
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as Record<string, unknown>
}

/** GET /deployments/jobs/{job_id}/deployment — get deployment info for a job. */
export async function getJobDeployment(jobId: string): Promise<DeploymentResult> {
  if (USE_MOCK) {
    return {
      platform: 'render',
      deployment_url: 'https://mock-deployment-url.onrender.com',
      deployment_id: 'mock-service-id',
      status: 'ready',
      message: 'Mock deployment successful',
    }
  }
  const res = await fetch(`${API_BASE}/deployments/jobs/${jobId}/deployment`, {
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as DeploymentResult
}

/** OAuth APIs */

/** GET /oauth/vercel/authorize — get Vercel OAuth authorization URL */
export async function getVercelAuthUrl(userId: string): Promise<{ auth_url: string; platform: string }> {
  const res = await fetch(`${API_BASE}/oauth/vercel/authorize?user_id=${userId}`)
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { auth_url: string; platform: string }
}

/** GET /oauth/render/authorize — get Render OAuth authorization URL */
export async function getRenderAuthUrl(userId: string): Promise<{ auth_url: string; platform: string }> {
  const res = await fetch(`${API_BASE}/oauth/render/authorize?user_id=${userId}`)
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { auth_url: string; platform: string }
}

/** POST /oauth/vercel/callback — handle Vercel OAuth callback */
export async function vercelCallback(code: string, userId: string): Promise<{ platform: string; access_token: string; expires_at?: string }> {
  const res = await fetch(`${API_BASE}/oauth/vercel/callback?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { platform: string; access_token: string; expires_at?: string }
}

/** POST /oauth/render/callback — handle Render OAuth callback */
export async function renderCallback(code: string, userId: string): Promise<{ platform: string; access_token: string; expires_at?: string }> {
  const res = await fetch(`${API_BASE}/oauth/render/callback?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { platform: string; access_token: string; expires_at?: string }
}

/** GET /oauth/credentials/status — get OAuth credentials status */
export async function getOAuthCredentialsStatus(): Promise<{ vercel: { connected: boolean; expires_at: string | null }; render: { connected: boolean; expires_at: string | null } }> {
  const res = await fetch(`${API_BASE}/oauth/credentials/status`, {
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { vercel: { connected: boolean; expires_at: string | null }; render: { connected: boolean; expires_at: string | null } }
}

/** DELETE /oauth/credentials/{platform} — delete OAuth credentials */
export async function deleteOAuthCredentials(platform: 'vercel' | 'render'): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/oauth/credentials/${platform}`, {
    method: 'DELETE',
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { message: string }
}

/** Environment Variable APIs */

/** POST /env-vars — set environment variables for a job */
export async function setEnvVars(jobId: string, envVars: Record<string, string>): Promise<{ job_id: string; env_vars: Record<string, string>; message: string }> {
  const res = await fetch(`${API_BASE}/env-vars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ job_id: jobId, env_vars: envVars }),
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as { job_id: string; env_vars: Record<string, string>; message: string }
}

/** GET /env-vars/{job_id} — get environment variables for a job */
export async function getEnvVars(jobId: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/env-vars/${jobId}`, {
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as Record<string, string>
}
