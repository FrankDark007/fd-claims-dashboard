import { useState } from 'react'
import type { Claim } from '../types/claim'
import StatusPill from './StatusPill'

interface ClaimsTableProps {
  claims: Claim[]
  loading: boolean
}

export default function ClaimsTable({ claims, loading }: ClaimsTableProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = claims.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.project.toLowerCase().includes(search.toLowerCase()) ||
      c.xactimateNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search clients, projects, Xactimate #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-faint bg-surface py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-faint bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <span className="text-sm text-muted">{filtered.length} claims</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-surface shadow-md">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-faint">
              <th className="px-4 py-3 font-semibold text-secondary">#</th>
              <th className="px-4 py-3 font-semibold text-secondary">Client</th>
              <th className="px-4 py-3 font-semibold text-secondary">Project</th>
              <th className="px-4 py-3 font-semibold text-secondary">Type</th>
              <th className="px-4 py-3 font-semibold text-secondary text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-secondary">Status</th>
              <th className="px-4 py-3 font-semibold text-secondary">Contract</th>
              <th className="px-4 py-3 font-semibold text-secondary">COC</th>
              <th className="px-4 py-3 font-semibold text-secondary">Invoice</th>
              <th className="px-4 py-3 font-semibold text-secondary">Rewrite</th>
              <th className="px-4 py-3 font-semibold text-secondary">Cam</th>
              <th className="px-4 py-3 font-semibold text-secondary">3D</th>
              <th className="px-4 py-3 font-semibold text-secondary">Date</th>
              <th className="px-4 py-3 font-semibold text-secondary"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-faint/50">
            {filtered.map((claim) => (
              <tr key={claim.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {claim.invoiceId || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{claim.clientName}</div>
                  {claim.xactimateNumber && (
                    <div className="text-xs text-muted">XA: {claim.xactimateNumber}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-secondary max-w-[160px] truncate">
                  {claim.project || '—'}
                </td>
                <td className="px-4 py-3">
                  <ProjectTypeBadge type={claim.projectType} />
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {claim.amount ? `$${claim.amount.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3"><StatusPill value={claim.status} /></td>
                <td className="px-4 py-3"><StatusPill value={claim.contract} /></td>
                <td className="px-4 py-3"><StatusPill value={claim.coc} /></td>
                <td className="px-4 py-3"><StatusPill value={claim.finalInvoice} /></td>
                <td className="px-4 py-3"><StatusPill value={claim.rewriteStatus} /></td>
                <td className="px-4 py-3">
                  {claim.companyCam ? (
                    <a href={claim.companyCam} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover" title="CompanyCam">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={claim.matterport} />
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {claim.dateAdded ? new Date(claim.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {claim.driveFolder && (
                      <a href={claim.driveFolder} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-muted hover:bg-surface-alt hover:text-foreground" title="Google Drive">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                      </a>
                    )}
                    <a href={claim.notionUrl} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-muted hover:bg-surface-alt hover:text-foreground" title="Open in Notion">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted">
            {search || filterStatus !== 'all' ? 'No claims match your filters' : 'No claims found'}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-muted text-xs">—</span>

  const styles: Record<string, string> = {
    'Water Mitigation': 'bg-blue-100 text-blue-700',
    'Pack-out': 'bg-purple-100 text-purple-700',
    'Mold Remediation': 'bg-red-100 text-red-700',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  )
}
