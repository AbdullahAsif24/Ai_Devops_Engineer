import { useState, useEffect } from 'react'
import type { AutoDeployConfig, WebhookEventRecord } from '../types'
import {
  listAutoDeployConfigs,
  createAutoDeployConfig,
  updateAutoDeployConfig,
  deleteAutoDeployConfig,
  listWebhookEvents,
  triggerTestPush,
} from '../lib/api'
import {
  BoltIcon,
  CheckIcon,
  CopyIcon,
  GitBranchIcon,
  GitCommitIcon,
  PlusIcon,
  RefreshCwIcon,
  Spinner,
  TrashIcon,
} from './icons'

export function AutoDeployManager() {
  const [configs, setConfigs] = useState<AutoDeployConfig[]>([])
  const [events, setEvents] = useState<WebhookEventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [autoRollback, setAutoRollback] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [cfgList, evtList] = await Promise.all([
        listAutoDeployConfigs(),
        listWebhookEvents(),
      ])
      setConfigs(cfgList)
      setEvents(evtList)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!repoUrl.trim()) return
    try {
      const created = await createAutoDeployConfig({
        repo_url: repoUrl.trim(),
        branch: branch.trim() || 'main',
        auto_rollback: autoRollback,
      })
      setConfigs([created, ...configs])
      setRepoUrl('')
      setShowAddForm(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create auto-deploy config')
    }
  }

  async function handleToggleActive(config: AutoDeployConfig) {
    try {
      const updated = await updateAutoDeployConfig(config.id, {
        is_active: !config.is_active,
      })
      setConfigs(configs.map((c) => (c.id === config.id ? updated : c)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle auto-deploy')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove auto-deploy for this repository?')) return
    try {
      await deleteAutoDeployConfig(id)
      setConfigs(configs.filter((c) => c.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete config')
    }
  }

  async function handleTestPush(config: AutoDeployConfig) {
    setTestingConfigId(config.id)
    setTestResult(null)
    try {
      const evt = await triggerTestPush({
        config_id: config.id,
        repo_url: config.repo_url,
        branch: config.branch,
        commit_message: 'Simulated git push: update application frontend & dependencies',
        committer: 'devops-lead',
      })
      setEvents([evt, ...events])
      setTestResult(
        `✓ Simulated push received for commit ${evt.commit_sha}! Deployment triggered successfully.`,
      )
    } catch (err) {
      setTestResult(`✗ Test push error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setTestingConfigId(null)
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header and Add button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Auto-Deploy on Push</h2>
          <p className="mt-1 text-sm text-muted">
            Automatically trigger builds and deployments whenever changes are pushed to your GitHub
            branches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            title="Refresh"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add Repository Hook
          </button>
        </div>
      </div>

      {testResult && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl bg-ok-soft p-4 text-sm text-ok-text ring-1 ring-inset ring-ok/30"
        >
          <span>{testResult}</span>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="btn btn-ghost btn-sm text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Form Card */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="card p-5 sm:p-6 space-y-4 border-accent/40 shadow-pop">
          <h3 className="font-semibold text-ink">Configure New Auto-Deploy Hook</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                GitHub Repository URL
              </label>
              <input
                type="url"
                required
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Watched Branch
              </label>
              <div className="relative">
                <GitBranchIcon className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="main or master (use * for all)"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
                <input
                  type="checkbox"
                  checked={autoRollback}
                  onChange={(e) => setAutoRollback(e.target.checked)}
                  className="h-4 w-4 rounded text-accent"
                />
                Auto-rollback on failed builds
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Webhook Configuration
            </button>
          </div>
        </form>
      )}

      {/* Configured Hooks */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Active Webhooks</h3>
        {loading ? (
          <div className="card p-8 text-center text-muted">
            <Spinner className="mx-auto h-6 w-6 text-accent mb-2" />
            Loading webhook configurations...
          </div>
        ) : configs.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            <BoltIcon className="mx-auto h-8 w-8 text-muted mb-2 opacity-60" />
            <p className="font-medium text-ink">No auto-deploy hooks configured yet</p>
            <p className="text-xs text-muted mt-1">
              Add a GitHub repository above to enable automatic builds whenever code is pushed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <div key={config.id} className="card p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink text-base">{config.repo_url}</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-raised px-2 py-0.5 text-xs font-mono font-medium text-muted">
                        <GitBranchIcon className="h-3 w-3" />
                        {config.branch}
                      </span>
                      {config.auto_rollback && (
                        <span className="rounded-md bg-ok-soft px-2 py-0.5 text-[11px] font-medium text-ok-text">
                          Auto-Rollback
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Payload URL and secret ready for GitHub Settings → Webhooks
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(config)}
                      className={`btn btn-sm ${config.is_active ? 'btn-secondary text-ok-text' : 'btn-ghost'}`}
                    >
                      {config.is_active ? '● Enabled' : '○ Paused'}
                    </button>
                    <button
                      type="button"
                      disabled={testingConfigId === config.id}
                      onClick={() => handleTestPush(config)}
                      className="btn btn-secondary btn-sm"
                      title="Simulate push event"
                    >
                      {testingConfigId === config.id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <BoltIcon className="h-3.5 w-3.5 text-accent" />
                      )}
                      Test Push
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(config.id)}
                      className="btn btn-ghost btn-sm text-bad"
                      title="Delete webhook"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Webhook Configuration Details */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-line text-xs font-mono">
                  <div className="rounded-lg bg-raised p-2.5">
                    <div className="flex items-center justify-between text-muted mb-1 font-sans">
                      <span>Webhook URL</span>
                      <button
                        type="button"
                        onClick={() => copyText(`url-${config.id}`, config.webhook_url)}
                        className="hover:text-ink flex items-center gap-1 font-mono text-[11px]"
                      >
                        {copiedKey === `url-${config.id}` ? (
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
                    <p className="truncate text-ink">{config.webhook_url}</p>
                  </div>

                  <div className="rounded-lg bg-raised p-2.5">
                    <div className="flex items-center justify-between text-muted mb-1 font-sans">
                      <span>Secret Token (HMAC SHA-256)</span>
                      <button
                        type="button"
                        onClick={() => copyText(`sec-${config.id}`, config.webhook_secret)}
                        className="hover:text-ink flex items-center gap-1 font-mono text-[11px]"
                      >
                        {copiedKey === `sec-${config.id}` ? (
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
                    <p className="truncate text-ink">{config.webhook_secret}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Webhook Delivery & Push Events Feed */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Recent Push Events</h3>
        {events.length === 0 ? (
          <div className="card p-6 text-center text-xs text-muted">
            No push events received yet. Click &quot;Test Push&quot; above to simulate an automated trigger.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-raised/60 text-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Commit</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-raised/40 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      {evt.status === 'triggered' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[11px] font-semibold text-ok-text">
                          <CheckIcon className="h-3 w-3" />
                          Triggered
                        </span>
                      ) : evt.status === 'skipped' ? (
                        <span className="inline-flex items-center rounded-full bg-raised px-2.5 py-0.5 text-[11px] font-medium text-muted">
                          Skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-bad-soft px-2.5 py-0.5 text-[11px] font-semibold text-bad-text">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <span className="flex items-center gap-1">
                        <GitCommitIcon className="h-3 w-3 text-muted" />
                        {evt.commit_sha}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-ink max-w-xs truncate" title={evt.commit_message}>
                      {evt.commit_message}
                    </td>
                    <td className="px-4 py-3 text-muted">{evt.branch}</td>
                    <td className="px-4 py-3 text-muted font-sans">{evt.committer}</td>
                    <td className="px-4 py-3 text-muted font-sans">
                      {new Date(evt.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
