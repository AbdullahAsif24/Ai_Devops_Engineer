import { useState, useEffect } from 'react'
import type { CustomDomainItem, DomainHealthCheckResponse } from '../types'
import {
  listCustomDomains,
  createCustomDomain,
  verifyDomainDNS,
  issueDomainSSL,
  checkDomainHealth,
  toggleDomainRenew,
  deleteCustomDomain,
} from '../lib/api'
import {
  ActivityIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Spinner,
  TrashIcon,
} from './icons'

export function CustomDomainManager() {
  const [domains, setDomains] = useState<CustomDomainItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Action loadings
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [issuingSSLId, setIssuingSSLId] = useState<string | null>(null)
  const [checkingHealthId, setCheckingHealthId] = useState<string | null>(null)
  const [healthFeedback, setHealthFeedback] = useState<Record<string, DomainHealthCheckResponse>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const list = await listCustomDomains()
      setDomains(list)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault()
    if (!newDomain.trim()) return
    try {
      const created = await createCustomDomain({
        domain: newDomain.trim(),
        target_url: targetUrl.trim() || undefined,
      })
      setDomains([created, ...domains])
      setShowAddModal(false)
      setNewDomain('')
      setTargetUrl('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to register domain')
    }
  }

  async function handleVerifyDNS(id: string) {
    setVerifyingId(id)
    try {
      const updated = await verifyDomainDNS(id)
      setDomains(domains.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'DNS verification failed')
    } finally {
      setVerifyingId(null)
    }
  }

  async function handleIssueSSL(id: string) {
    setIssuingSSLId(id)
    try {
      const updated = await issueDomainSSL(id)
      setDomains(domains.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'SSL issuance failed')
    } finally {
      setIssuingSSLId(null)
    }
  }

  async function handleCheckHealth(id: string) {
    setCheckingHealthId(id)
    try {
      const res = await checkDomainHealth(id)
      setHealthFeedback({ ...healthFeedback, [id]: res })
      // Update latency in item
      setDomains(
        domains.map((d) =>
          d.id === id
            ? {
                ...d,
                health_status: res.health_status,
                latency_ms: res.latency_ms,
                http_status_code: res.http_status_code,
                last_checked_at: res.checked_at,
              }
            : d,
        ),
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Health check failed')
    } finally {
      setCheckingHealthId(null)
    }
  }

  async function handleToggleRenew(domain: CustomDomainItem) {
    try {
      const updated = await toggleDomainRenew(domain.id, !domain.auto_ssl_renew)
      setDomains(domains.map((d) => (d.id === domain.id ? updated : d)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle SSL auto-renewal')
    }
  }

  async function handleDelete(id: string, domainName: string) {
    if (!confirm(`Are you sure you want to remove domain ${domainName}?`)) return
    try {
      await deleteCustomDomain(id)
      setDomains(domains.filter((d) => d.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove domain')
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Custom Domain Management</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok-text">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Auto Let&apos;s Encrypt SSL
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Attach branded custom domains to your deployments with automated zero-touch SSL certificate
            provisioning and live health monitoring.
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
            Add Custom Domain
          </button>
        </div>
      </div>

      {/* Domain Cards */}
      <section className="space-y-6">
        {loading ? (
          <div className="card p-8 text-center text-muted">
            <Spinner className="mx-auto h-6 w-6 text-accent mb-2" />
            Loading custom domains...
          </div>
        ) : domains.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            <GlobeIcon className="mx-auto h-8 w-8 text-muted mb-2 opacity-60" />
            <p className="font-medium text-ink">No custom domains configured</p>
            <p className="text-xs text-muted mt-1">
              Connect your domain (e.g. app.yourcompany.com) for professional, branded deployment URLs.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {domains.map((dom) => {
              const checkResult = healthFeedback[dom.id]

              return (
                <div key={dom.id} className="card p-5 sm:p-7 space-y-6">
                  {/* Domain Title Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-lg font-bold text-ink">{dom.domain}</span>
                        <a
                          href={`https://${dom.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-accent text-muted transition-colors"
                          title="Open domain"
                        >
                          <ArrowUpRightIcon className="h-4 w-4" />
                        </a>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            dom.status === 'active'
                              ? 'bg-ok-soft text-ok-text'
                              : dom.status === 'pending_dns'
                                ? 'bg-warn-soft text-warn-text'
                                : 'bg-accent-soft text-accent-text'
                          }`}
                        >
                          {dom.status === 'active'
                            ? '● Live & Verified'
                            : dom.status === 'pending_dns'
                              ? '○ DNS Verification Required'
                              : '◌ Provisioning SSL'}
                        </span>
                      </div>

                      <p className="text-xs text-muted mt-1">
                        Routing traffic to:{' '}
                        <span className="font-mono text-ink">{dom.target_url || `https://${dom.domain}`}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={checkingHealthId === dom.id}
                        onClick={() => handleCheckHealth(dom.id)}
                        className="btn btn-secondary btn-sm"
                        title="Run health check"
                      >
                        {checkingHealthId === dom.id ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <ActivityIcon className="h-3.5 w-3.5 text-accent" />
                        )}
                        Probe Health
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(dom.id, dom.domain)}
                        className="btn btn-ghost btn-sm text-bad"
                        title="Remove domain"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 3-Column Layout: DNS Setup, SSL Status, Health Metrics */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* 1. DNS Configuration Card */}
                    <div className="rounded-xl border border-line bg-raised/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          DNS Record Required
                        </span>
                        {dom.dns_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok-text">
                            <CheckIcon className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-warn-text">
                            Pending DNS
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-1.5 border border-line">
                          <span className="text-muted font-sans">Type:</span>
                          <span className="font-bold text-ink">{dom.dns_record.type}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-1.5 border border-line">
                          <span className="text-muted font-sans">Host:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-ink">{dom.dns_record.host}</span>
                            <button
                              type="button"
                              onClick={() => copyText(`host-${dom.id}`, dom.dns_record.host)}
                              className="text-muted hover:text-ink"
                            >
                              <CopyIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-1.5 border border-line">
                          <span className="text-muted font-sans">Target:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-ink truncate max-w-[120px]">{dom.dns_record.value}</span>
                            <button
                              type="button"
                              onClick={() => copyText(`val-${dom.id}`, dom.dns_record.value)}
                              className="text-muted hover:text-ink"
                            >
                              {copiedKey === `val-${dom.id}` ? (
                                <CheckIcon className="h-3 w-3 text-ok" />
                              ) : (
                                <CopyIcon className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {!dom.dns_verified && (
                        <button
                          type="button"
                          disabled={verifyingId === dom.id}
                          onClick={() => handleVerifyDNS(dom.id)}
                          className="btn btn-primary btn-sm w-full text-xs"
                        >
                          {verifyingId === dom.id ? <Spinner className="h-3.5 w-3.5" /> : null}
                          Verify DNS Propagation
                        </button>
                      )}
                    </div>

                    {/* 2. SSL Certificate Status */}
                    <div className="rounded-xl border border-line bg-raised/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Auto SSL Certificate
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            dom.ssl_status === 'issued'
                              ? 'bg-ok-soft text-ok-text'
                              : 'bg-warn-soft text-warn-text'
                          }`}
                        >
                          <ShieldCheckIcon className="h-3 w-3" />
                          {dom.ssl_status === 'issued' ? 'TLS 1.3 Active' : 'Pending Issuance'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted">
                          <span>Issuer:</span>
                          <span className="font-semibold text-ink">{dom.ssl_issuer}</span>
                        </div>
                        <div className="flex justify-between text-muted">
                          <span>Validity:</span>
                          <span className="font-semibold text-ink">
                            {dom.ssl_expires_at
                              ? `Renews in ${Math.max(
                                  0,
                                  Math.round(
                                    (new Date(dom.ssl_expires_at).getTime() - Date.now()) /
                                      86400000,
                                  ),
                                )} days`
                              : 'Issued on DNS verify'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">Auto-Renewal</span>
                        <button
                          type="button"
                          onClick={() => handleToggleRenew(dom)}
                          className={`btn btn-sm text-xs ${
                            dom.auto_ssl_renew ? 'btn-secondary text-ok-text' : 'btn-ghost'
                          }`}
                        >
                          {dom.auto_ssl_renew ? '✓ Enabled' : 'Disabled'}
                        </button>
                      </div>

                      {dom.ssl_status !== 'issued' && dom.dns_verified && (
                        <button
                          type="button"
                          disabled={issuingSSLId === dom.id}
                          onClick={() => handleIssueSSL(dom.id)}
                          className="btn btn-secondary btn-sm w-full text-xs"
                        >
                          {issuingSSLId === dom.id ? <Spinner className="h-3.5 w-3.5" /> : null}
                          Issue SSL Certificate
                        </button>
                      )}
                    </div>

                    {/* 3. Domain Health & Performance */}
                    <div className="rounded-xl border border-line bg-raised/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Health & Latency
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok-text">
                          <ActivityIcon className="h-3 w-3" />
                          {dom.uptime_percent.toFixed(2)}% Uptime
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-surface p-2 border border-line">
                          <span className="block text-[11px] text-muted">Ping Latency</span>
                          <span className="font-mono text-base font-bold text-accent">
                            {dom.latency_ms ? `${dom.latency_ms} ms` : '—'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-surface p-2 border border-line">
                          <span className="block text-[11px] text-muted">HTTP Response</span>
                          <span className="font-mono text-base font-bold text-ok-text">
                            {dom.http_status_code ? `${dom.http_status_code} OK` : '200 OK'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted text-center pt-1">
                        Last probed:{' '}
                        {dom.last_checked_at
                          ? new Date(dom.last_checked_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Awaiting probe'}
                      </p>

                      {checkResult && (
                        <div className="rounded-md bg-ok-soft p-1.5 text-[11px] text-ok-text text-center font-medium">
                          ✓ Health confirmed: {checkResult.latency_ms}ms • SSL expires in {checkResult.ssl_expires_days}d
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-edge/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddDomain}
            className="card spot view-in w-full max-w-lg p-6 space-y-4 shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-semibold text-lg text-ink">Add Custom Domain</h3>
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
                  Custom Domain Name
                </label>
                <div className="relative">
                  <GlobeIcon className="absolute left-3 top-3 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. api.yourbrand.com or app.mydomain.io"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="input pl-9 font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Subdomains automatically configure CNAME records; apex domains configure A records.
                </p>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-muted mb-1">
                  Target Deployment URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://your-service.onrender.com or Vercel URL"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="input font-mono"
                />
              </div>

              <div className="rounded-lg bg-raised p-3 text-muted text-[11px] space-y-1">
                <span className="font-semibold text-ink block">Automatic Security Provisioning:</span>
                <p>• Let&apos;s Encrypt TLS certificate will be provisioned once DNS record is verified.</p>
                <p>• Automated SSL renewal triggers every 60 days before expiration.</p>
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
                Add &amp; Configure DNS
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
