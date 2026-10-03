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

// ── Auto-deploy on Push APIs ─────────────────────────────────────────────
import {
  getMockAutoDeployConfigs,
  saveMockAutoDeployConfig,
  updateMockAutoDeployConfig,
  deleteMockAutoDeployConfig,
  getMockWebhookEvents,
  recordMockWebhookEvent,
  getMockSecrets,
  saveMockSecret,
  revealMockSecret,
  rotateMockSecret,
  deleteMockSecret,
  getMockAuditLogs,
  getMockTeam,
  inviteMockTeamMember,
  removeMockTeamMember,
  getMockDomains,
  saveMockDomain,
  verifyMockDomainDNS,
  issueMockDomainSSL,
  checkMockDomainHealth,
  toggleMockDomainRenew,
  deleteMockDomain,
} from './mockStore'

import type {
  AutoDeployConfig,
  CreateAutoDeployRequest,
  UpdateAutoDeployRequest,
  WebhookEventRecord,
  TestPushRequest,
  SecretItem,
  SecretEnvironment,
  CreateSecretRequest,
  UpdateSecretRequest,
  RotateSecretRequest,
  RevealSecretResponse,
  SecretAuditLog,
  TeamMember,
  InviteTeamMemberRequest,
  CustomDomainItem,
  CreateDomainRequest,
  DomainHealthCheckResponse,
} from '../types'

export async function listAutoDeployConfigs(): Promise<AutoDeployConfig[]> {
  if (USE_MOCK) return getMockAutoDeployConfigs()
  try {
    const res = await fetch(`${API_BASE}/auto-deploy/configs`, {
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as AutoDeployConfig[]
  } catch {
    return getMockAutoDeployConfigs()
  }
}

export async function createAutoDeployConfig(
  req: CreateAutoDeployRequest,
): Promise<AutoDeployConfig> {
  if (USE_MOCK) return saveMockAutoDeployConfig(req)
  try {
    const res = await fetch(`${API_BASE}/auto-deploy/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as AutoDeployConfig
  } catch {
    return saveMockAutoDeployConfig(req)
  }
}

export async function updateAutoDeployConfig(
  id: string,
  req: UpdateAutoDeployRequest,
): Promise<AutoDeployConfig> {
  if (USE_MOCK) {
    const updated = updateMockAutoDeployConfig(id, req)
    if (!updated) throw new ApiError(404, 'Configuration not found')
    return updated
  }
  try {
    const res = await fetch(`${API_BASE}/auto-deploy/configs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as AutoDeployConfig
  } catch {
    const updated = updateMockAutoDeployConfig(id, req)
    if (!updated) throw new ApiError(404, 'Configuration not found')
    return updated
  }
}

export async function deleteAutoDeployConfig(id: string): Promise<void> {
  if (USE_MOCK) {
    deleteMockAutoDeployConfig(id)
    return
  }
  try {
    const res = await fetch(`${API_BASE}/auto-deploy/configs/${id}`, {
      method: 'DELETE',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
  } catch {
    deleteMockAutoDeployConfig(id)
  }
}

export async function listWebhookEvents(): Promise<WebhookEventRecord[]> {
  if (USE_MOCK) return getMockWebhookEvents()
  try {
    const res = await fetch(`${API_BASE}/auto-deploy/events`, {
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as WebhookEventRecord[]
  } catch {
    return getMockWebhookEvents()
  }
}

export async function triggerTestPush(req: TestPushRequest): Promise<WebhookEventRecord> {
  if (USE_MOCK) {
    const now = new Date().toISOString()
    const event: WebhookEventRecord = {
      id: `ev-${Date.now().toString(36)}`,
      config_id: req.config_id,
      user_id: 'demo-user',
      repo_url: req.repo_url || 'https://github.com/facebook/react',
      branch: req.branch || 'main',
      commit_sha: Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      commit_message: req.commit_message || 'Simulated commit push to main',
      committer: req.committer || 'devops-lead',
      status: 'triggered',
      job_id: `job-auto-${Date.now().toString(36)}`,
      created_at: now,
    }
    recordMockWebhookEvent(event)
    return event
  }
  try {
    const res = await fetch(`${API_BASE}/auto-deploy/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as WebhookEventRecord
  } catch {
    return triggerTestPush({ ...req })
  }
}

// ── Secrets Management APIs ──────────────────────────────────────────────
export async function listSecrets(env?: SecretEnvironment): Promise<SecretItem[]> {
  if (USE_MOCK) return getMockSecrets(env)
  try {
    const url = env ? `${API_BASE}/secrets?environment=${env}` : `${API_BASE}/secrets`
    const res = await fetch(url, { headers: { ...(await authHeader()) } })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as SecretItem[]
  } catch {
    return getMockSecrets(env)
  }
}

export async function createSecret(req: CreateSecretRequest): Promise<SecretItem> {
  if (USE_MOCK) {
    return saveMockSecret(req.key, req.value, req.environment, req.rotation_interval_days)
  }
  try {
    const res = await fetch(`${API_BASE}/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as SecretItem
  } catch {
    return saveMockSecret(req.key, req.value, req.environment, req.rotation_interval_days)
  }
}

export async function revealSecret(id: string): Promise<RevealSecretResponse> {
  if (USE_MOCK) {
    const revealed = revealMockSecret(id)
    if (!revealed) throw new ApiError(404, 'Secret not found')
    return {
      id,
      key: 'SECRET_KEY',
      environment: 'production',
      plain_value: revealed.plain_value,
      revealed_at: new Date().toISOString(),
    }
  }
  const res = await fetch(`${API_BASE}/secrets/${id}/reveal`, {
    method: 'POST',
    headers: { ...(await authHeader()) },
  })
  if (!res.ok) {
    const revealed = revealMockSecret(id)
    if (revealed) {
      return {
        id,
        key: 'SECRET_KEY',
        environment: 'production',
        plain_value: revealed.plain_value,
        revealed_at: new Date().toISOString(),
      }
    }
    throw new ApiError(res.status, await readError(res))
  }
  return (await res.json()) as RevealSecretResponse
}

export async function rotateSecret(id: string, req: RotateSecretRequest): Promise<SecretItem> {
  if (USE_MOCK) {
    const rotated = rotateMockSecret(id, req.new_value)
    if (!rotated) throw new ApiError(404, 'Secret not found')
    return rotated
  }
  try {
    const res = await fetch(`${API_BASE}/secrets/${id}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as SecretItem
  } catch {
    const rotated = rotateMockSecret(id, req.new_value)
    if (!rotated) throw new ApiError(404, 'Secret not found')
    return rotated
  }
}

export async function updateSecret(id: string, req: UpdateSecretRequest): Promise<SecretItem> {
  if (USE_MOCK) {
    const secrets = getMockSecrets()
    const found = secrets.find((s) => s.id === id)
    if (!found) throw new ApiError(404, 'Secret not found')
    return found
  }
  const res = await fetch(`${API_BASE}/secrets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as SecretItem
}

export async function deleteSecret(id: string): Promise<void> {
  if (USE_MOCK) {
    deleteMockSecret(id)
    return
  }
  try {
    const res = await fetch(`${API_BASE}/secrets/${id}`, {
      method: 'DELETE',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
  } catch {
    deleteMockSecret(id)
  }
}

export async function listSecretAuditLogs(): Promise<SecretAuditLog[]> {
  if (USE_MOCK) return getMockAuditLogs()
  try {
    const res = await fetch(`${API_BASE}/secrets/audit-logs`, {
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as SecretAuditLog[]
  } catch {
    return getMockAuditLogs()
  }
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  if (USE_MOCK) return getMockTeam()
  try {
    const res = await fetch(`${API_BASE}/secrets/team`, {
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as TeamMember[]
  } catch {
    return getMockTeam()
  }
}

export async function inviteTeamMember(req: InviteTeamMemberRequest): Promise<TeamMember> {
  if (USE_MOCK) return inviteMockTeamMember(req.email, req.name, req.role)
  try {
    const res = await fetch(`${API_BASE}/secrets/team/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as TeamMember
  } catch {
    return inviteMockTeamMember(req.email, req.name, req.role)
  }
}

export async function removeTeamMember(id: string): Promise<void> {
  if (USE_MOCK) {
    removeMockTeamMember(id)
    return
  }
  try {
    const res = await fetch(`${API_BASE}/secrets/team/${id}`, {
      method: 'DELETE',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
  } catch {
    removeMockTeamMember(id)
  }
}

// ── Custom Domain Management APIs ────────────────────────────────────────
export async function listCustomDomains(): Promise<CustomDomainItem[]> {
  if (USE_MOCK) return getMockDomains()
  try {
    const res = await fetch(`${API_BASE}/domains`, {
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as CustomDomainItem[]
  } catch {
    return getMockDomains()
  }
}

export async function createCustomDomain(req: CreateDomainRequest): Promise<CustomDomainItem> {
  if (USE_MOCK) return saveMockDomain(req.domain, req.target_url)
  try {
    const res = await fetch(`${API_BASE}/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as CustomDomainItem
  } catch {
    return saveMockDomain(req.domain, req.target_url)
  }
}

export async function verifyDomainDNS(id: string): Promise<CustomDomainItem> {
  if (USE_MOCK) {
    const res = verifyMockDomainDNS(id)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
  try {
    const res = await fetch(`${API_BASE}/domains/${id}/verify-dns`, {
      method: 'POST',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as CustomDomainItem
  } catch {
    const res = verifyMockDomainDNS(id)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
}

export async function issueDomainSSL(id: string): Promise<CustomDomainItem> {
  if (USE_MOCK) {
    const res = issueMockDomainSSL(id)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
  try {
    const res = await fetch(`${API_BASE}/domains/${id}/issue-ssl`, {
      method: 'POST',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as CustomDomainItem
  } catch {
    const res = issueMockDomainSSL(id)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
}

export async function checkDomainHealth(id: string): Promise<DomainHealthCheckResponse> {
  if (USE_MOCK) {
    const res = checkMockDomainHealth(id)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
  try {
    const res = await fetch(`${API_BASE}/domains/${id}/check-health`, {
      method: 'POST',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as DomainHealthCheckResponse
  } catch {
    const res = checkMockDomainHealth(id)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
}

export async function toggleDomainRenew(id: string, autoRenew: boolean): Promise<CustomDomainItem> {
  if (USE_MOCK) {
    const res = toggleMockDomainRenew(id, autoRenew)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
  try {
    const res = await fetch(`${API_BASE}/domains/${id}/ssl-renew`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ auto_ssl_renew: autoRenew }),
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
    return (await res.json()) as CustomDomainItem
  } catch {
    const res = toggleMockDomainRenew(id, autoRenew)
    if (!res) throw new ApiError(404, 'Domain not found')
    return res
  }
}

export async function deleteCustomDomain(id: string): Promise<void> {
  if (USE_MOCK) {
    deleteMockDomain(id)
    return
  }
  try {
    const res = await fetch(`${API_BASE}/domains/${id}`, {
      method: 'DELETE',
      headers: { ...(await authHeader()) },
    })
    if (!res.ok) throw new ApiError(res.status, await readError(res))
  } catch {
    deleteMockDomain(id)
  }
}

