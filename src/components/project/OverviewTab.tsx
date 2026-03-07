import { useState } from 'react'
import {
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Project } from '../../types/claim'
import StatusPill from '../StatusPill'
import { useAiProjectSummary } from '../../hooks/useAI'

interface OverviewTabProps {
  project: Project
  token: string
}

function AiSummaryPanel({ project, token }: { project: Project; token: string }) {
  const [expanded, setExpanded] = useState(false)
  const { summary, loading, error, fetchSummary } = useAiProjectSummary(token)

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    if (next && !summary && !loading) {
      fetchSummary(project.id)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50/50">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-violet-600" />
          <span className="text-sm font-semibold text-violet-900">AI Analysis</span>
        </div>
        {expanded ? (
          <ChevronUpIcon className="size-4 text-violet-400" />
        ) : (
          <ChevronDownIcon className="size-4 text-violet-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-violet-200 px-5 py-4">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-violet-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              Analyzing project...
            </div>
          )}

          {error && (
            <p className="py-2 text-sm text-red-600">{error}</p>
          )}

          {summary && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Status</p>
                <p className="mt-1 text-sm text-slate-800">{summary.status}</p>
              </div>

              {summary.risks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Risk Flags</p>
                  <ul className="mt-1 space-y-1">
                    {summary.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-800">
                        <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Suggested Next Action</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{summary.nextAction}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Communication Summary</p>
                <p className="mt-1 text-sm text-slate-700">{summary.communicationSummary}</p>
              </div>

              <button
                type="button"
                onClick={() => fetchSummary(project.id)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 disabled:opacity-50"
              >
                <ArrowPathIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OverviewTab({ project, token }: OverviewTabProps) {
  return (
    <div>
      <AiSummaryPanel project={project} token={token} />
    <div className="rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-base/7 font-semibold text-foreground">Project Information</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-secondary">Operational record stored in the dashboard.</p>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <Row label="Client Name" value={project.clientName} />
          <Row label="Project" value={project.projectName || '—'} />
          <Row label="Project Type">
            {project.projectType ? (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                project.projectType === 'Water Mitigation' ? 'bg-blue-100 text-blue-700' :
                project.projectType === 'Pack-out' ? 'bg-purple-100 text-purple-700' :
                'bg-red-100 text-red-700'
              }`}>
                {project.projectType}
              </span>
            ) : '—'}
          </Row>
          <Row label="Invoice ID" value={project.invoiceId ? `#${project.invoiceId}` : '—'} />
          <Row label="Project Status">
            <StatusPill value={project.projectStatus} size="md" />
          </Row>
          <Row label="Xactimate #" value={project.xactimateNumber || '—'} />
          <Row label="Claim #" value={project.claimNumber || '—'} />
          <Row label="Carrier" value={project.carrier || '—'} />
          <Row label="Amount" value={project.amount ? `$${project.amount.toLocaleString()}` : '—'} />
          <Row label="Invoice Status">
            <StatusPill value={project.invoiceStatus} size="md" />
          </Row>
          <Row label="Contract">
            <StatusPill value={project.contractStatus} size="md" />
          </Row>
          <Row label="Certificate of Completion">
            <StatusPill value={project.cocStatus} size="md" />
          </Row>
          <Row label="Final Invoice">
            <StatusPill value={project.finalInvoiceStatus} size="md" />
          </Row>
          <Row label="Dry Log">
            <StatusPill value={project.drylogStatus} size="md" />
          </Row>
          <Row label="Rewrite Status">
            <StatusPill value={project.rewriteStatus} size="md" />
          </Row>
          <Row label="Matterport">
            <StatusPill value={project.matterportStatus} size="md" />
          </Row>
          <Row label="Client Email" value={project.clientEmail || '—'} />
          <Row label="Client Phone" value={project.clientPhone || '—'} />
          <Row label="Client Address" value={project.clientAddress || '—'} />
          <Row label="Project Manager" value={project.projectManagerName || '—'} />
          <Row label="PM Email" value={project.pmEmail || '—'} />
          <Row label="PM Phone" value={project.pmPhone || '—'} />
          <Row label="Adjuster" value={project.adjusterName || '—'} />
          <Row label="Adjuster Email" value={project.adjusterEmail || '—'} />
          <Row label="Adjuster Phone" value={project.adjusterPhone || '—'} />
          <Row label="CompanyCam">
            {project.companyCamUrl ? (
              <a href={project.companyCamUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-medium text-sm">
                Open CompanyCam
              </a>
            ) : '—'}
          </Row>
          <Row label="Drive Folder">
            {project.driveFolderUrl ? (
              <a href={project.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-medium text-sm">
                Open Google Drive
              </a>
            ) : '—'}
          </Row>
          <Row label="Invoice Sent" value={project.invoiceSentDate ? new Date(project.invoiceSentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
          <Row label="Due Date" value={project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
          <Row label="Next Follow-up" value={project.nextFollowUpDate ? new Date(project.nextFollowUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
          <Row label="Payment Received" value={project.paymentReceivedDate ? new Date(project.paymentReceivedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
          <Row label="Created" value={project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
          <Row label="Status">
            {project.done ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Done
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                Active
              </span>
            )}
          </Row>
          {project.notes && (
            <Row label="Notes" value={project.notes} />
          )}
        </dl>
      </div>
    </div>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm/6 font-medium text-foreground">{label}</dt>
      <dd className="mt-1 text-sm/6 text-secondary sm:col-span-2 sm:mt-0">
        {children || value}
      </dd>
    </div>
  )
}
