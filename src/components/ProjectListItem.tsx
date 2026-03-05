import { Link } from 'react-router-dom'
import type { Claim } from '../types/claim'
import StatusPill from './StatusPill'

interface ProjectListItemProps {
  project: Claim
}

const typeColors: Record<string, string> = {
  'Water Mitigation': 'bg-blue-100 text-blue-700',
  'Pack-out': 'bg-purple-100 text-purple-700',
  'Mold Remediation': 'bg-red-100 text-red-700',
}

function getProgress(project: Claim): { percent: number; label: string } {
  let steps = 0
  let done = 0

  // Contract
  steps++
  if (project.contract === 'Signed') done++

  // COC
  steps++
  if (project.coc === 'Signed') done++

  // Final Invoice
  steps++
  if (project.finalInvoice === 'Complete') done++

  // Payment
  steps++
  if (project.status === 'Paid') done++

  const percent = Math.round((done / steps) * 100)
  const labels = ['Contract', 'COC', 'Invoice', 'Paid']
  const label = done >= steps ? 'Complete' : labels[done] || 'Started'
  return { percent, label }
}

export default function ProjectListItem({ project }: ProjectListItemProps) {
  const progress = getProgress(project)

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {project.clientName}
            </p>
            {project.projectType && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[project.projectType] || 'bg-gray-100 text-gray-600'}`}>
                {project.projectType}
              </span>
            )}
          </div>
          <div className="ml-2 flex shrink-0 items-center gap-3">
            {project.amount && (
              <span className="text-sm font-medium text-foreground tabular-nums">
                ${project.amount.toLocaleString()}
              </span>
            )}
            <StatusPill value={project.status} />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{project.project || '\u2014'}</span>
            {project.dateAdded && (
              <span>
                {new Date(project.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="text-xs text-muted">{progress.label}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
