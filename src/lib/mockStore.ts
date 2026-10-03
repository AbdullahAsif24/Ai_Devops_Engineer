import type { Job, JobSummary, Stage } from '../types'

/**
 * localStorage-backed store for mock deployment history, so the History view
 * populates and survives reloads with zero backend. When the real backend is
 * wired, GET /api/jobs replaces listMockJobs — this module goes unused.
 */

const KEY = 'aidevops.mock.jobs'
const MAX = 50

function load(): Job[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Job[]) : []
  } catch {
    return []
  }
}

function save(jobs: Job[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs.slice(0, MAX)))
  } catch {
    /* storage unavailable — history just won't persist */
  }
}

/** Insert (or replace) a job at the top of the mock history. */
export function recordJob(job: Job): void {
  const jobs = load().filter((j) => j.job_id !== job.job_id)
  jobs.unshift(job)
  save(jobs)
}

/** Shallow-merge a patch into a stored job. No-op if the job is unknown. */
export function updateMockJob(jobId: string, patch: Partial<Job>): void {
  const jobs = load()
  const idx = jobs.findIndex((j) => j.job_id === jobId)
  if (idx === -1) return
  // Ensure status is properly typed as Stage
  const updatedJob = { ...jobs[idx], ...patch }
  if (patch.status && typeof patch.status === 'string') {
    (updatedJob as any).status = patch.status as Stage
  }
  jobs[idx] = updatedJob
  save(jobs)
}

export function getMockJob(jobId: string): Job | undefined {
  return load().find((j) => j.job_id === jobId)
}

export function listMockJobs(): JobSummary[] {
  return load().map((j) => ({
    job_id: j.job_id,
    repo_url: j.repo_url,
    status: j.status,
    created_at: j.created_at,
  }))
}

// ── Auto-deploy on Push Mocks ────────────────────────────────────────────
import type {
  AutoDeployConfig,
  CreateAutoDeployRequest,
  CustomDomainItem,
  DomainHealthCheckResponse,
  SecretAuditLog,
  SecretEnvironment,
  SecretItem,
  TeamMember,
  WebhookEventRecord,
} from '../types'

const AUTODEPLOY_KEY = 'aidevops.mock.autodeploy'
const WEBHOOK_EVENTS_KEY = 'aidevops.mock.webhook_events'

const SEED_AUTODEPLOY: AutoDeployConfig[] = [
  {
    id: 'cfg-1',
    user_id: 'demo-user',
    repo_url: 'https://github.com/facebook/react',
    branch: 'main',
    is_active: true,
    webhook_secret: '7f9a2b8c4d1e6f3089ab52c4d9ef1042',
    webhook_url: 'http://localhost:8000/webhooks/github/cfg-1',
    auto_rollback: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
]

const SEED_WEBHOOK_EVENTS: WebhookEventRecord[] = [
  {
    id: 'ev-1',
    config_id: 'cfg-1',
    user_id: 'demo-user',
    repo_url: 'https://github.com/facebook/react',
    branch: 'main',
    commit_sha: 'e48b192',
    commit_message: 'feat: optimize concurrent hydration and event listeners',
    committer: 'gaearon',
    status: 'triggered',
    job_id: 'job-sample-1',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ev-2',
    config_id: 'cfg-1',
    user_id: 'demo-user',
    repo_url: 'https://github.com/facebook/react',
    branch: 'feature/v19-docs',
    commit_sha: '7a2f05c',
    commit_message: 'docs: update deployment architecture guidelines',
    committer: 'acdlite',
    status: 'skipped',
    error_message: "Branch 'feature/v19-docs' does not match watched branch 'main'",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
]

export function getMockAutoDeployConfigs(): AutoDeployConfig[] {
  try {
    const raw = localStorage.getItem(AUTODEPLOY_KEY)
    if (!raw) {
      localStorage.setItem(AUTODEPLOY_KEY, JSON.stringify(SEED_AUTODEPLOY))
      return SEED_AUTODEPLOY
    }
    return JSON.parse(raw)
  } catch {
    return SEED_AUTODEPLOY
  }
}

export function saveMockAutoDeployConfig(req: CreateAutoDeployRequest): AutoDeployConfig {
  const configs = getMockAutoDeployConfigs()
  const id = `cfg-${Date.now().toString(36)}`
  const now = new Date().toISOString()
  const newConfig: AutoDeployConfig = {
    id,
    user_id: 'demo-user',
    repo_url: req.repo_url,
    branch: req.branch || 'main',
    is_active: true,
    webhook_secret: Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    webhook_url: `http://localhost:8000/webhooks/github/${id}`,
    auto_rollback: req.auto_rollback ?? true,
    created_at: now,
    updated_at: now,
  }
  configs.unshift(newConfig)
  localStorage.setItem(AUTODEPLOY_KEY, JSON.stringify(configs))
  return newConfig
}

export function updateMockAutoDeployConfig(
  id: string,
  patch: Partial<AutoDeployConfig>,
): AutoDeployConfig | null {
  const configs = getMockAutoDeployConfigs()
  const idx = configs.findIndex((c) => c.id === id)
  if (idx === -1) return null
  const updated = { ...configs[idx], ...patch, updated_at: new Date().toISOString() }
  configs[idx] = updated
  localStorage.setItem(AUTODEPLOY_KEY, JSON.stringify(configs))
  return updated
}

export function deleteMockAutoDeployConfig(id: string): boolean {
  const configs = getMockAutoDeployConfigs().filter((c) => c.id !== id)
  localStorage.setItem(AUTODEPLOY_KEY, JSON.stringify(configs))
  return true
}

export function getMockWebhookEvents(): WebhookEventRecord[] {
  try {
    const raw = localStorage.getItem(WEBHOOK_EVENTS_KEY)
    if (!raw) {
      localStorage.setItem(WEBHOOK_EVENTS_KEY, JSON.stringify(SEED_WEBHOOK_EVENTS))
      return SEED_WEBHOOK_EVENTS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_WEBHOOK_EVENTS
  }
}

export function recordMockWebhookEvent(event: WebhookEventRecord): void {
  const events = getMockWebhookEvents()
  events.unshift(event)
  localStorage.setItem(WEBHOOK_EVENTS_KEY, JSON.stringify(events.slice(0, 50)))
}

// ── Secrets Management Mocks ─────────────────────────────────────────────
const SECRETS_KEY = 'aidevops.mock.secrets'
const SECRETS_AUDIT_KEY = 'aidevops.mock.secrets_audit'
const TEAM_KEY = 'aidevops.mock.team'

interface StoredMockSecret extends SecretItem {
  _plain_value: string
}

const SEED_SECRETS: StoredMockSecret[] = [
  {
    id: 'sec-1',
    user_id: 'demo-user',
    key: 'DATABASE_URL',
    environment: 'production',
    masked_value: 'pos••••••••5432',
    _plain_value: 'postgres://root:p@ssw0rd99@db.prod.internal:5432/main_app',
    version: 2,
    rotation_interval_days: 30,
    last_rotated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 18).toISOString(),
    status: 'active',
    shared_roles: ['Admin', 'Developer'],
    created_at: new Date(Date.now() - 86400000 * 42).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'sec-2',
    user_id: 'demo-user',
    key: 'STRIPE_SECRET_KEY',
    environment: 'production',
    masked_value: 'sk_••••••••8a9c',
    _plain_value: 'sk_test_fake_demo_key_not_real_1234567890',
    version: 1,
    rotation_interval_days: 60,
    last_rotated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 55).toISOString(),
    status: 'active',
    shared_roles: ['Admin'],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'sec-3',
    user_id: 'demo-user',
    key: 'JWT_SIGNING_SECRET',
    environment: 'staging',
    masked_value: 'jwt••••••••key9',
    _plain_value: 'jwt_staging_super_secret_hmac_256_signing_key9',
    version: 3,
    rotation_interval_days: 14,
    last_rotated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'expiring_soon',
    shared_roles: ['Admin', 'Developer'],
    created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'sec-4',
    user_id: 'demo-user',
    key: 'AWS_ACCESS_KEY_ID',
    environment: 'development',
    masked_value: 'AKI••••••••Z4PQ',
    _plain_value: 'AKIAIOSFODNN7EXAMPLEZ4PQ',
    version: 1,
    rotation_interval_days: 90,
    last_rotated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 75).toISOString(),
    status: 'active',
    shared_roles: ['Admin', 'Developer'],
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
]

const SEED_AUDIT_LOGS: SecretAuditLog[] = [
  {
    id: 'log-1',
    user_id: 'demo-user',
    secret_key: 'DATABASE_URL',
    environment: 'production',
    action: 'rotate',
    actor: 'Alex Rivers (Admin)',
    ip_address: '192.168.1.42',
    details: 'Rotated key to version v2. Next rotation scheduled in 30 days',
    timestamp: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'log-2',
    user_id: 'demo-user',
    secret_key: 'STRIPE_SECRET_KEY',
    environment: 'production',
    action: 'create',
    actor: 'Sarah Chen (Developer)',
    ip_address: '192.168.1.18',
    details: 'Created secret with AES-256-GCM encryption in production',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

const SEED_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    user_id: 'demo-user',
    name: 'Alex Rivers',
    email: 'alex.rivers@cloudcorp.dev',
    role: 'Admin',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'tm-2',
    user_id: 'demo-user',
    name: 'Sarah Chen',
    email: 'sarah.chen@cloudcorp.dev',
    role: 'Developer',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'tm-3',
    user_id: 'demo-user',
    name: 'Marcus Vance',
    email: 'marcus.security@cloudcorp.dev',
    role: 'Viewer',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
]

export function getMockSecrets(env?: SecretEnvironment): SecretItem[] {
  try {
    const raw = localStorage.getItem(SECRETS_KEY)
    const list: StoredMockSecret[] = raw ? JSON.parse(raw) : SEED_SECRETS
    if (!raw) localStorage.setItem(SECRETS_KEY, JSON.stringify(SEED_SECRETS))
    return env ? list.filter((s) => s.environment === env) : list
  } catch {
    return env ? SEED_SECRETS.filter((s) => s.environment === env) : SEED_SECRETS
  }
}

export function saveMockSecret(
  key: string,
  value: string,
  environment: SecretEnvironment = 'production',
  rotation_interval_days: number = 30,
): SecretItem {
  const secrets = (JSON.parse(localStorage.getItem(SECRETS_KEY) || 'null') || SEED_SECRETS) as StoredMockSecret[]
  const id = `sec-${Date.now().toString(36)}`
  const now = new Date()
  const masked = value.length > 6 ? `${value.slice(0, 3)}••••••••${value.slice(-4)}` : '••••••••'
  const expires = rotation_interval_days > 0 ? new Date(now.getTime() + rotation_interval_days * 86400000).toISOString() : null
  const newSecret: StoredMockSecret = {
    id,
    user_id: 'demo-user',
    key: key.toUpperCase().trim(),
    environment,
    masked_value: masked,
    _plain_value: value,
    version: 1,
    rotation_interval_days,
    last_rotated_at: now.toISOString(),
    expires_at: expires,
    status: 'active',
    shared_roles: ['Admin', 'Developer'],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }
  secrets.unshift(newSecret)
  localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
  addMockAuditLog(newSecret.key, environment, 'create', `Created encrypted secret ${newSecret.key} (v1)`)
  return newSecret
}

export function revealMockSecret(id: string): { plain_value: string } | null {
  const secrets = (JSON.parse(localStorage.getItem(SECRETS_KEY) || 'null') || SEED_SECRETS) as StoredMockSecret[]
  const found = secrets.find((s) => s.id === id)
  if (!found) return null
  addMockAuditLog(found.key, found.environment, 'reveal', `Viewed decrypted plain text value for ${found.key} (v${found.version})`)
  return { plain_value: found._plain_value }
}

export function rotateMockSecret(id: string, newVal?: string): SecretItem | null {
  const secrets = (JSON.parse(localStorage.getItem(SECRETS_KEY) || 'null') || SEED_SECRETS) as StoredMockSecret[]
  const idx = secrets.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const current = secrets[idx]
  const val = newVal || `sec_live_${Array.from(crypto.getRandomValues(new Uint8Array(18))).map((b) => b.toString(16).padStart(2, '0')).join('')}`
  const now = new Date()
  const masked = val.length > 6 ? `${val.slice(0, 3)}••••••••${val.slice(-4)}` : '••••••••'
  const interval = current.rotation_interval_days ?? 30
  const expires = interval > 0 ? new Date(now.getTime() + interval * 86400000).toISOString() : null
  const updated: StoredMockSecret = {
    ...current,
    _plain_value: val,
    masked_value: masked,
    version: current.version + 1,
    last_rotated_at: now.toISOString(),
    expires_at: expires,
    status: 'active',
    updated_at: now.toISOString(),
  }
  secrets[idx] = updated
  localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
  addMockAuditLog(updated.key, updated.environment, 'rotate', `Rotated key to version v${updated.version}. Reset expiration countdown`)
  return updated
}

export function deleteMockSecret(id: string): boolean {
  const secrets = (JSON.parse(localStorage.getItem(SECRETS_KEY) || 'null') || SEED_SECRETS) as StoredMockSecret[]
  const found = secrets.find((s) => s.id === id)
  if (found) {
    addMockAuditLog(found.key, found.environment, 'delete', `Permanently deleted secret ${found.key} from vault`)
  }
  const filtered = secrets.filter((s) => s.id !== id)
  localStorage.setItem(SECRETS_KEY, JSON.stringify(filtered))
  return true
}

export function getMockAuditLogs(): SecretAuditLog[] {
  try {
    const raw = localStorage.getItem(SECRETS_AUDIT_KEY)
    if (!raw) {
      localStorage.setItem(SECRETS_AUDIT_KEY, JSON.stringify(SEED_AUDIT_LOGS))
      return SEED_AUDIT_LOGS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_AUDIT_LOGS
  }
}

export function addMockAuditLog(
  key: string,
  environment: string,
  action: SecretAuditLog['action'],
  details: string,
): void {
  const logs = getMockAuditLogs()
  const newLog: SecretAuditLog = {
    id: `log-${Date.now().toString(36)}`,
    user_id: 'demo-user',
    secret_key: key,
    environment,
    action,
    actor: 'Security Admin',
    ip_address: '127.0.0.1',
    details,
    timestamp: new Date().toISOString(),
  }
  logs.unshift(newLog)
  localStorage.setItem(SECRETS_AUDIT_KEY, JSON.stringify(logs.slice(0, 50)))
}

export function getMockTeam(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY)
    if (!raw) {
      localStorage.setItem(TEAM_KEY, JSON.stringify(SEED_TEAM))
      return SEED_TEAM
    }
    return JSON.parse(raw)
  } catch {
    return SEED_TEAM
  }
}

export function inviteMockTeamMember(email: string, name: string, role: TeamMember['role']): TeamMember {
  const team = getMockTeam()
  const member: TeamMember = {
    id: `tm-${Date.now().toString(36)}`,
    user_id: 'demo-user',
    email,
    name,
    role,
    status: 'active',
    joined_at: new Date().toISOString(),
  }
  team.push(member)
  localStorage.setItem(TEAM_KEY, JSON.stringify(team))
  addMockAuditLog('TEAM', 'all', 'share', `Invited ${name} (${email}) as ${role}`)
  return member
}

export function removeMockTeamMember(id: string): boolean {
  const team = getMockTeam().filter((t) => t.id !== id)
  localStorage.setItem(TEAM_KEY, JSON.stringify(team))
  return true
}

// ── Custom Domain Management Mocks ───────────────────────────────────────
const DOMAINS_KEY = 'aidevops.mock.domains'

const SEED_DOMAINS: CustomDomainItem[] = [
  {
    id: 'dom-1',
    user_id: 'demo-user',
    domain: 'api.production-cloud.io',
    target_url: 'https://backend-service.onrender.com',
    status: 'active',
    dns_record: {
      type: 'CNAME',
      host: 'api',
      value: 'cname.aidevops.app',
      ttl: 60,
      verified: true,
    },
    dns_verified: true,
    ssl_status: 'issued',
    ssl_issuer: "Let's Encrypt Authority X3 (TLS 1.3)",
    ssl_expires_at: new Date(Date.now() + 86400000 * 84).toISOString(),
    auto_ssl_renew: true,
    health_status: 'healthy',
    latency_ms: 28,
    uptime_percent: 99.98,
    http_status_code: 200,
    last_checked_at: new Date(Date.now() - 120000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'dom-2',
    user_id: 'demo-user',
    domain: 'dashboard.mybrand.org',
    target_url: 'https://mybrand-dashboard.vercel.app',
    status: 'pending_dns',
    dns_record: {
      type: 'CNAME',
      host: 'dashboard',
      value: 'cname.aidevops.app',
      ttl: 60,
      verified: false,
    },
    dns_verified: false,
    ssl_status: 'pending',
    ssl_issuer: "Let's Encrypt Authority X3",
    ssl_expires_at: null,
    auto_ssl_renew: true,
    health_status: 'pending',
    latency_ms: undefined,
    uptime_percent: 100.0,
    http_status_code: undefined,
    last_checked_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
]

export function getMockDomains(): CustomDomainItem[] {
  try {
    const raw = localStorage.getItem(DOMAINS_KEY)
    if (!raw) {
      localStorage.setItem(DOMAINS_KEY, JSON.stringify(SEED_DOMAINS))
      return SEED_DOMAINS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_DOMAINS
  }
}

export function saveMockDomain(domain: string, target_url?: string): CustomDomainItem {
  const domains = getMockDomains()
  const id = `dom-${Date.now().toString(36)}`
  const parts = domain.split('.')
  const host = parts.length > 2 ? parts[0] : '@'
  const type = parts.length > 2 ? 'CNAME' : 'A'
  const value = parts.length > 2 ? 'cname.aidevops.app' : '76.76.21.21'
  const newDomain: CustomDomainItem = {
    id,
    user_id: 'demo-user',
    domain: domain.toLowerCase().trim(),
    target_url: target_url || `https://${domain}`,
    status: 'pending_dns',
    dns_record: {
      type,
      host,
      value,
      ttl: 60,
      verified: false,
    },
    dns_verified: false,
    ssl_status: 'pending',
    ssl_issuer: "Let's Encrypt Authority X3 (TLS 1.3)",
    ssl_expires_at: null,
    auto_ssl_renew: true,
    health_status: 'pending',
    uptime_percent: 100.0,
    created_at: new Date().toISOString(),
  }
  domains.unshift(newDomain)
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains))
  return newDomain
}

export function verifyMockDomainDNS(id: string): CustomDomainItem | null {
  const domains = getMockDomains()
  const idx = domains.findIndex((d) => d.id === id)
  if (idx === -1) return null
  const now = new Date()
  const updated: CustomDomainItem = {
    ...domains[idx],
    dns_verified: true,
    dns_record: { ...domains[idx].dns_record, verified: true },
    status: 'active',
    ssl_status: 'issued',
    ssl_expires_at: new Date(now.getTime() + 86400000 * 90).toISOString(),
    health_status: 'healthy',
    latency_ms: 34,
    http_status_code: 200,
    last_checked_at: now.toISOString(),
  }
  domains[idx] = updated
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains))
  return updated
}

export function issueMockDomainSSL(id: string): CustomDomainItem | null {
  const domains = getMockDomains()
  const idx = domains.findIndex((d) => d.id === id)
  if (idx === -1) return null
  const updated: CustomDomainItem = {
    ...domains[idx],
    ssl_status: 'issued',
    ssl_expires_at: new Date(Date.now() + 86400000 * 90).toISOString(),
    status: 'active',
  }
  domains[idx] = updated
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains))
  return updated
}

export function checkMockDomainHealth(id: string): DomainHealthCheckResponse | null {
  const domains = getMockDomains()
  const idx = domains.findIndex((d) => d.id === id)
  if (idx === -1) return null
  const latency = Math.floor(Math.random() * 25) + 20
  const now = new Date().toISOString()
  domains[idx] = {
    ...domains[idx],
    health_status: 'healthy',
    latency_ms: latency,
    http_status_code: 200,
    last_checked_at: now,
  }
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains))
  return {
    domain_id: id,
    domain: domains[idx].domain,
    health_status: 'healthy',
    latency_ms: latency,
    http_status_code: 200,
    ssl_status: domains[idx].ssl_status,
    ssl_expires_days: 88,
    checked_at: now,
  }
}

export function toggleMockDomainRenew(id: string, auto_renew: boolean): CustomDomainItem | null {
  const domains = getMockDomains()
  const idx = domains.findIndex((d) => d.id === id)
  if (idx === -1) return null
  domains[idx].auto_ssl_renew = auto_renew
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains))
  return domains[idx]
}

export function deleteMockDomain(id: string): boolean {
  const domains = getMockDomains().filter((d) => d.id !== id)
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains))
  return true
}

