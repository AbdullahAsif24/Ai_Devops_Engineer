import { useState, useEffect } from 'react'
import type {
  SecretItem,
  SecretEnvironment,
  SecretAuditLog,
  TeamMember,
  SecretRole,
} from '../types'
import {
  listSecrets,
  createSecret,
  revealSecret,
  rotateSecret,
  deleteSecret,
  listSecretAuditLogs,
  listTeamMembers,
  inviteTeamMember,
  removeTeamMember,
} from '../lib/api'
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Spinner,
  TrashIcon,
  UsersIcon,
} from './icons'

type Tab = 'vault' | 'team' | 'audit'

export function SecretsManager() {
  const [tab, setTab] = useState<Tab>('vault')
  const [envFilter, setEnvFilter] = useState<SecretEnvironment | 'all'>('all')
  const [secrets, setSecrets] = useState<SecretItem[]>([])
  const [auditLogs, setAuditLogs] = useState<SecretAuditLog[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newEnv, setNewEnv] = useState<SecretEnvironment>('production')
  const [newRotationDays, setNewRotationDays] = useState(30)

  // Reveal state
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({})
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Rotate state
  const [rotatingSecret, setRotatingSecret] = useState<SecretItem | null>(null)
  const [rotateNewValue, setRotateNewValue] = useState('')
  const [autoGenRotate, setAutoGenRotate] = useState(true)
  const [rotateLoading, setRotateLoading] = useState(false)

  // Team invite state
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<SecretRole>('Developer')
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [secList, logs, team] = await Promise.all([
        listSecrets(),
        listSecretAuditLogs(),
        listTeamMembers(),
      ])
      setSecrets(secList)
      setAuditLogs(logs)
      setTeamMembers(team)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newKey.trim() || !newValue.trim()) return
    try {
      const created = await createSecret({
        key: newKey.trim(),
        value: newValue.trim(),
        environment: newEnv,
        rotation_interval_days: newRotationDays > 0 ? newRotationDays : undefined,
      })
      setSecrets([created, ...secrets])
      setShowAddModal(false)
      setNewKey('')
      setNewValue('')
      const logs = await listSecretAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create secret')
    }
  }

  async function handleReveal(id: string) {
    if (revealedSecrets[id]) {
      // Toggle back off
      const next = { ...revealedSecrets }
      delete next[id]
      setRevealedSecrets(next)
      return
    }

    setRevealingId(id)
    try {
      const res = await revealSecret(id)
      setRevealedSecrets({ ...revealedSecrets, [id]: res.plain_value })
      const logs = await listSecretAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reveal secret')
    } finally {
      setRevealingId(null)
    }
  }

  async function handleRotateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rotatingSecret) return
    setRotateLoading(true)
    try {
      const updated = await rotateSecret(rotatingSecret.id, {
        new_value: autoGenRotate ? undefined : rotateNewValue.trim(),
        auto_generate: autoGenRotate,
      })
      setSecrets(secrets.map((s) => (s.id === updated.id ? updated : s)))
      setRotatingSecret(null)
      setRotateNewValue('')
      const logs = await listSecretAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to rotate secret')
    } finally {
      setRotateLoading(false)
    }
  }

  async function handleDelete(id: string, keyName: string) {
    if (!confirm(`Are you sure you want to permanently delete secret ${keyName}?`)) return
    try {
      await deleteSecret(id)
      setSecrets(secrets.filter((s) => s.id !== id))
      const logs = await listSecretAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete secret')
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) return
    try {
      const created = await inviteTeamMember({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      setTeamMembers([...teamMembers, created])
      setShowInviteModal(false)
      setInviteName('')
      setInviteEmail('')
      const logs = await listSecretAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite team member')
    }
  }

  async function handleRemoveTeam(id: string) {
    if (!confirm('Revoke this team member access?')) return
    try {
      await removeTeamMember(id)
      setTeamMembers(teamMembers.filter((m) => m.id !== id))
      const logs = await listSecretAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke member')
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const filteredSecrets = secrets.filter(
    (s) => envFilter === 'all' || s.environment === envFilter,
  )

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Secrets Management</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-text">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              AES-256 Encrypted
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Store encrypted secrets, schedule automated key rotations, isolate environments, and share
            with role-based team permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4" />
            New Secret
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('vault')}
            className={`btn btn-sm ${tab === 'vault' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <KeyIcon className="h-4 w-4" />
            Secrets Vault ({secrets.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('team')}
            className={`btn btn-sm ${tab === 'team' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <UsersIcon className="h-4 w-4" />
            Team Sharing ({teamMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('audit')}
            className={`btn btn-sm ${tab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {tab === 'vault' && (
          <div className="flex items-center gap-1 rounded-lg border border-line bg-raised p-1 text-xs">
            {(['all', 'production', 'staging', 'development'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvFilter(env)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  envFilter === env
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: SECRETS VAULT */}
      {tab === 'vault' && (
        <section className="space-y-4">
          {loading ? (
            <div className="card p-8 text-center text-muted">
              <Spinner className="mx-auto h-6 w-6 text-accent mb-2" />
              Loading encrypted vault...
            </div>
          ) : filteredSecrets.length === 0 ? (
            <div className="card p-8 text-center text-muted">
              <LockIcon className="mx-auto h-8 w-8 text-muted mb-2 opacity-60" />
              <p className="font-medium text-ink">No secrets found in this environment</p>
              <p className="text-xs text-muted mt-1">
                Add API keys, tokens, or connection strings securely with automated rotation policies.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSecrets.map((secret) => {
                const isRevealed = !!revealedSecrets[secret.id]
                const displayVal = isRevealed ? revealedSecrets[secret.id] : secret.masked_value

                return (
                  <div key={secret.id} className="card p-5 space-y-3 sm:p-6 transition-all hover:border-line-strong">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-base font-bold text-ink tracking-tight">
                            {secret.key}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                              secret.environment === 'production'
                                ? 'bg-accent-soft text-accent-text'
                                : secret.environment === 'staging'
                                  ? 'bg-warn-soft text-warn-text'
                                  : 'bg-raised text-muted'
                            }`}
                          >
                            {secret.environment}
                          </span>
                          <span className="rounded-md bg-raised px-2 py-0.5 text-[11px] font-mono font-medium text-muted">
                            v{secret.version}
                          </span>
                          {secret.status === 'expiring_soon' && (
                            <span className="rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn-text">
                              Expires Soon
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted pt-0.5">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {secret.rotation_interval_days
                              ? `${secret.rotation_interval_days}-day rotation schedule`
                              : 'No rotation set'}
                          </span>
                          <span>•</span>
                          <span>
                            Last rotated:{' '}
                            {new Date(secret.last_rotated_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={revealingId === secret.id}
                          onClick={() => handleReveal(secret.id)}
                          className={`btn btn-sm ${isRevealed ? 'btn-secondary text-accent font-semibold' : 'btn-ghost'}`}
                          title={isRevealed ? 'Hide plain text' : 'Reveal plain text (audited)'}
                        >
                          {revealingId === secret.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : isRevealed ? (
                            <EyeOffIcon className="h-3.5 w-3.5" />
                          ) : (
                            <EyeIcon className="h-3.5 w-3.5" />
                          )}
                          {isRevealed ? 'Mask' : 'Reveal'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRotatingSecret(secret)}
                          className="btn btn-secondary btn-sm"
                          title="Rotate secret value"
                        >
                          <RefreshCwIcon className="h-3.5 w-3.5" />
                          Rotate
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(secret.id, secret.key)}
                          className="btn btn-ghost btn-sm text-bad"
                          title="Delete secret"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Value Field Box */}
                    <div className="flex items-center justify-between rounded-lg bg-raised px-3.5 py-2.5 font-mono text-xs text-ink">
                      <span className={`truncate select-all ${isRevealed ? 'text-accent font-semibold' : 'text-muted'}`}>
                        {displayVal}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(`val-${secret.id}`, displayVal)}
                        className="ml-3 hover:text-ink flex items-center gap-1 font-mono text-[11px] shrink-0"
                      >
                        {copiedKey === `val-${secret.id}` ? (
                          <>
                            <CheckIcon className="h-3 w-3 text-ok" />
                            Copied
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    {isRevealed && (
                      <p className="text-[11px] text-muted italic flex items-center gap-1 font-sans">
                        <ShieldCheckIcon className="h-3 w-3 text-ok" />
                        Decrypted securely. Action logged in immutable security audit log.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: TEAM SHARING & ACCESS */}
      {tab === 'team' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-ink">Team Members & Permissions</h3>
              <p className="text-xs text-muted">
                Role-based access determines who can decrypt, rotate, or deploy with vault secrets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary btn-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Invite Teammate
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-raised/60 text-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-raised/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">{member.name}</td>
                    <td className="px-4 py-3 font-mono text-muted">{member.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          member.role === 'Admin'
                            ? 'bg-ok-soft text-ok-text'
                            : member.role === 'Developer'
                              ? 'bg-accent-soft text-accent-text'
                              : 'bg-raised text-muted'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {member.role === 'Admin'
                        ? 'Full access: create, reveal, rotate, delete, invite'
                        : member.role === 'Developer'
                          ? 'Deploy injection, view masked, request rotation'
                          : 'Read-only audit view, no reveals permitted'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-ok-text text-[11px]">
                        ● Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeam(member.id)}
                          className="hover:text-bad text-muted text-xs"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: AUDIT LOG */}
      {tab === 'audit' && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-ink">Security Audit Trail</h3>
            <p className="text-xs text-muted">
              Tamper-evident log of all secret creations, reveals, rotations, updates, and permission changes.
            </p>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-raised/60 text-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Secret Key</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-raised/40 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          log.action === 'rotate'
                            ? 'bg-ok-soft text-ok-text'
                            : log.action === 'reveal'
                              ? 'bg-warn-soft text-warn-text'
                              : log.action === 'delete'
                                ? 'bg-bad-soft text-bad-text'
                                : 'bg-accent-soft text-accent-text'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-ink">{log.secret_key}</td>
                    <td className="px-4 py-3 capitalize text-muted">{log.environment}</td>
                    <td className="px-4 py-3 font-sans text-ink">{log.actor}</td>
                    <td className="px-4 py-3 font-sans text-muted max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-muted font-sans">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add Secret Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-edge/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreate}
            className="card spot view-in w-full max-w-lg p-6 space-y-4 shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-semibold text-lg text-ink">Add Encrypted Secret</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-ghost btn-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                  Key Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STRIPE_API_KEY, DATABASE_URL"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="input font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                  Secret Plain Value
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Paste confidential token, private key, or connection string..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                    Environment Scope
                  </label>
                  <select
                    value={newEnv}
                    onChange={(e) => setNewEnv(e.target.value as SecretEnvironment)}
                    className="input capitalize"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                    Rotation Schedule
                  </label>
                  <select
                    value={newRotationDays}
                    onChange={(e) => setNewRotationDays(Number(e.target.value))}
                    className="input"
                  >
                    <option value={30}>Every 30 Days (Recommended)</option>
                    <option value={60}>Every 60 Days</option>
                    <option value={90}>Every 90 Days</option>
                    <option value={0}>Manual Rotation Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Encrypt & Save to Vault
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rotate Secret Modal */}
      {rotatingSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-edge/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleRotateSubmit}
            className="card spot view-in w-full max-w-lg p-6 space-y-4 shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-semibold text-lg text-ink">
                Rotate Secret: {rotatingSecret.key} (v{rotatingSecret.version})
              </h3>
              <button
                type="button"
                onClick={() => setRotatingSecret(null)}
                className="btn btn-ghost btn-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted">
              Rotation bumps this secret to <strong>version v{rotatingSecret.version + 1}</strong>,
              archives the prior version for auditing, and resets the rotation timer.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="rotateType"
                    checked={autoGenRotate}
                    onChange={() => setAutoGenRotate(true)}
                    className="text-accent"
                  />
                  Auto-generate cryptographically secure token (Recommended)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="rotateType"
                    checked={!autoGenRotate}
                    onChange={() => setAutoGenRotate(false)}
                    className="text-accent"
                  />
                  Enter new secret manually
                </label>
              </div>

              {!autoGenRotate && (
                <div className="pt-2">
                  <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                    New Plain Value
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter newly rotated API token..."
                    value={rotateNewValue}
                    onChange={(e) => setRotateNewValue(e.target.value)}
                    className="input font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setRotatingSecret(null)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={rotateLoading} className="btn btn-primary btn-sm">
                {rotateLoading ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCwIcon className="h-3.5 w-3.5" />}
                Confirm Key Rotation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-edge/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleInvite}
            className="card spot view-in w-full max-w-md p-6 space-y-4 shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-semibold text-lg text-ink">Invite Team Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="btn btn-ghost btn-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan@company.dev"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                  Permission Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as SecretRole)}
                  className="input"
                >
                  <option value="Developer">Developer (Deployment use, masked view)</option>
                  <option value="Admin">Admin (Full rotate, reveal, and modify)</option>
                  <option value="Viewer">Viewer (Security audit only)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Grant Access & Send Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
