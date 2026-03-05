import type { Claim } from '../../types/claim'
import StatusPill from '../StatusPill'

interface OverviewTabProps {
  project: Claim
}

export default function OverviewTab({ project }: OverviewTabProps) {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-base/7 font-semibold text-foreground">Project Information</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-secondary">Details from Notion database.</p>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <Row label="Client Name" value={project.clientName} />
          <Row label="Project" value={project.project || '—'} />
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
          <Row label="Xactimate #" value={project.xactimateNumber || '—'} />
          <Row label="Amount" value={project.amount ? `$${project.amount.toLocaleString()}` : '—'} />
          <Row label="Invoice Status">
            <StatusPill value={project.status} size="md" />
          </Row>
          <Row label="Contract">
            <StatusPill value={project.contract} size="md" />
          </Row>
          <Row label="Certificate of Completion">
            <StatusPill value={project.coc} size="md" />
          </Row>
          <Row label="Final Invoice">
            <StatusPill value={project.finalInvoice} size="md" />
          </Row>
          <Row label="Rewrite Status">
            <StatusPill value={project.rewriteStatus} size="md" />
          </Row>
          <Row label="Matterport">
            <StatusPill value={project.matterport} size="md" />
          </Row>
          <Row label="CompanyCam">
            {project.companyCam ? (
              <a href={project.companyCam} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-medium text-sm">
                Open CompanyCam
              </a>
            ) : '—'}
          </Row>
          <Row label="Drive Folder">
            {project.driveFolder ? (
              <a href={project.driveFolder} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-medium text-sm">
                Open Google Drive
              </a>
            ) : '—'}
          </Row>
          <Row label="Date Added" value={project.dateAdded ? new Date(project.dateAdded).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
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
