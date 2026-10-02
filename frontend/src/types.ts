// Types mirroring backend contracts — keep in sync with backend/app/contracts.py

export type Stage =
  | 'queued'
  | 'cloning'
  | 'analyzing'
  | 'generating'
  | 'building'
  | 'healing'
  | 'deploying'
  | 'done'
  | 'failed'
  | 'needs_review'

export type EventStatus = 'running' | 'success' | 'failed' | 'info'

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type Provider = 'vercel' | 'render'

export type DeploymentType = 'static' | 'vercel_native' | 'container' | 'ambiguous'

/** A single streamed event — a WebSocket frame, or an item in Job.events. */
export interface JobEvent {
  job_id: string
  stage: Stage
  message: string
  timestamp: string // ISO 8601 UTC
}

/** Deployment detection result */
export interface DetectionResult {
  deployment_type: DeploymentType
  confidence: 'high' | 'medium' | 'low'
  detected_framework: string
  entry_point?: string
  listen_port?: number
  reasoning: string
  needs_dockerfile: boolean
  ambiguous_reason?: string
  detection_method: 'rule_based' | 'llm'
}

/** Deployment result from Vercel or Render */
export interface DeploymentResult {
  platform: 'vercel' | 'render'
  deployment_url: string
  deployment_id: string
  status: string
  message: string
}

/** Stage-specific structured payloads (all optional; see contract §5). */
export interface JobEventData {
  // analyze
  language?: string
  framework?: string
  entrypoint?: string
  port?: number
  package_manager?: string
  // generate
  dockerfile?: string
  // build / self_heal
  attempt?: number
  max_attempts?: number
  error_excerpt?: string
  error_summary?: string
  patch_summary?: string
  // deploy / done
  url?: string
  provider?: Provider
  duration_ms?: number
  reason?: string
  [key: string]: unknown
}

export interface Job {
  job_id: string
  status: Stage
  repo_url: string
  created_at: string
  logs: JobEvent[]
  result?: DockerfileResult
  error?: string
  repo_path?: string
  detection?: DetectionInfo
  deployment?: DeploymentResult
}

export interface DetectionInfo {
  deployment_type: DeploymentType
  needs_dockerfile: boolean
  detected_framework: string
  entry_point?: string
  listen_port?: number
  reasoning: string
  detection_method: string
}

export interface DockerfileResult {
  language: string
  framework: string
  entry_point: string
  port: number
  start_command: string
  dockerfile_content: string
  metadata?: {
    raw_response: {
      language: string
      framework: string
      entry_point: string
      port: number
      start_command: string
      dockerfile_content: string
    }
  }
}

export interface JobSummary {
  job_id: string
  repo_url: string
  status: Stage
  created_at: string
  deployment?: DeploymentResult
}

export interface CreateJobRequest {
  repo_url: string
  env_vars?: Record<string, string>
}

// ── Streaming ────────────────────────────────────────────────────────────
// A transport-agnostic contract so the mock stream and the real WebSocket
// client are interchangeable behind subscribeToJob().

export interface JobStreamHandlers {
  onEvent: (event: JobEvent) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (err: Error) => void
}

export interface JobStreamController {
  close: () => void
}

// ── Auto-deploy on Push ──────────────────────────────────────────────────
export interface AutoDeployConfig {
  id: string
  user_id: string
  repo_url: string
  branch: string
  is_active: boolean
  webhook_secret: string
  webhook_url: string
  auto_rollback: boolean
  created_at: string
  updated_at: string
}

export interface CreateAutoDeployRequest {
  repo_url: string
  branch?: string
  auto_rollback?: boolean
}

export interface UpdateAutoDeployRequest {
  branch?: string
  is_active?: boolean
  auto_rollback?: boolean
}

export interface WebhookEventRecord {
  id: string
  config_id?: string
  user_id: string
  repo_url: string
  branch: string
  commit_sha: string
  commit_message: string
  committer: string
  status: 'triggered' | 'skipped' | 'failed'
  job_id?: string
  error_message?: string
  created_at: string
}

export interface TestPushRequest {
  config_id?: string
  repo_url?: string
  branch?: string
  commit_message?: string
  committer?: string
}

// ── Secrets Management ───────────────────────────────────────────────────
export type SecretEnvironment = 'production' | 'staging' | 'development'
export type SecretRole = 'Admin' | 'Developer' | 'Viewer'

export interface SecretItem {
  id: string
  user_id: string
  key: string
  environment: SecretEnvironment
  masked_value: string
  version: number
  rotation_interval_days?: number
  last_rotated_at: string
  expires_at?: string | null
  status: 'active' | 'expiring_soon' | 'expired' | 'rotated'
  shared_roles: SecretRole[]
  created_at: string
  updated_at: string
}

export interface CreateSecretRequest {
  key: string
  value: string
  environment?: SecretEnvironment
  rotation_interval_days?: number
  shared_roles?: SecretRole[]
}

export interface UpdateSecretRequest {
  key?: string
  environment?: SecretEnvironment
  rotation_interval_days?: number
  shared_roles?: SecretRole[]
}

export interface RotateSecretRequest {
  new_value?: string
  auto_generate?: boolean
}

export interface RevealSecretResponse {
  id: string
  key: string
  environment: SecretEnvironment
  plain_value: string
  revealed_at: string
}

export interface SecretAuditLog {
  id: string
  user_id: string
  secret_id?: string
  secret_key: string
  environment: string
  action: 'create' | 'reveal' | 'rotate' | 'update' | 'delete' | 'share'
  actor: string
  ip_address: string
  details: string
  timestamp: string
}

export interface TeamMember {
  id: string
  user_id: string
  email: string
  name: string
  role: SecretRole
  status: 'active' | 'pending'
  joined_at: string
}

export interface InviteTeamMemberRequest {
  email: string
  name: string
  role: SecretRole
}

// ── Custom Domain Management ─────────────────────────────────────────────
export type DomainStatus = 'active' | 'pending_dns' | 'verifying' | 'ssl_issuing' | 'failed'
export type SSLStatus = 'issued' | 'pending' | 'renewing' | 'failed'
export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'pending'

export interface DNSRecord {
  type: 'CNAME' | 'A'
  host: string
  value: string
  ttl: number
  verified: boolean
}

export interface CustomDomainItem {
  id: string
  user_id: string
  domain: string
  job_id?: string
  target_url: string
  status: DomainStatus
  dns_record: DNSRecord
  dns_verified: boolean
  ssl_status: SSLStatus
  ssl_issuer: string
  ssl_expires_at?: string | null
  auto_ssl_renew: boolean
  health_status: HealthStatus
  latency_ms?: number
  uptime_percent: number
  http_status_code?: number
  last_checked_at?: string | null
  created_at: string
}

export interface CreateDomainRequest {
  domain: string
  job_id?: string
  target_url?: string
}

export interface DomainHealthCheckResponse {
  domain_id: string
  domain: string
  health_status: HealthStatus
  latency_ms: number
  http_status_code: number
  ssl_status: SSLStatus
  ssl_expires_days: number
  checked_at: string
}

