import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import type { Project } from '../types/claim'
import StatusPill from '../components/StatusPill'
import CreateProjectModal from '../components/CreateProjectModal'

interface ProjectsPageProps {
  projects: Project[]
  loading: boolean
  token: string
  onRefresh: () => void
}

export default function ProjectsPage({ projects, loading, token, onRefresh }: ProjectsPageProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCollections, setFilterCollections] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const filtered = projects
    .filter((project) => {
      const matchesSearch =
      project.clientName.toLowerCase().includes(search.toLowerCase()) ||
      project.projectName.toLowerCase().includes(search.toLowerCase()) ||
      project.xactimateNumber.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === 'all' || project.invoiceStatus === filterStatus

      const followUpDate = project.nextFollowUpDate ?? project.dueDate
      const matchesCollections = (() => {
        if (filterCollections === 'all') {
          return true
        }

        if (filterCollections === 'needs-attention') {
          return project.invoiceStatus !== 'Paid' && followUpDate !== null && followUpDate <= today
        }

        if (filterCollections === 'upcoming') {
          return project.invoiceStatus !== 'Paid' && followUpDate !== null && followUpDate > today
        }

        if (filterCollections === 'paid') {
          return project.invoiceStatus === 'Paid'
        }

        return true
      })()

      return matchesSearch && matchesStatus && matchesCollections
    })
    .sort((a, b) => {
      const aFollowUp = a.nextFollowUpDate ?? a.dueDate ?? '9999-12-31'
      const bFollowUp = b.nextFollowUpDate ?? b.dueDate ?? '9999-12-31'

      if (a.invoiceStatus !== 'Paid' && b.invoiceStatus === 'Paid') {
        return -1
      }

      if (a.invoiceStatus === 'Paid' && b.invoiceStatus !== 'Paid') {
        return 1
      }

      return aFollowUp.localeCompare(bFollowUp) || a.clientName.localeCompare(b.clientName)
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-secondary mt-1">{projects.length} total projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
          >
            <PlusIcon className="size-4" />
            Create Project
          </button>
        </div>
      </div>

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
        <select
          value={filterCollections}
          onChange={(e) => setFilterCollections(e.target.value)}
          className="rounded-lg border border-faint bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Collections</option>
          <option value="needs-attention">Needs Attention</option>
          <option value="upcoming">Upcoming Follow-up</option>
          <option value="paid">Collected</option>
        </select>
        <span className="text-sm text-muted">{filtered.length} projects</span>
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
              <th className="px-4 py-3 font-semibold text-secondary">Due</th>
              <th className="px-4 py-3 font-semibold text-secondary">Next Follow-up</th>
              <th className="px-4 py-3 font-semibold text-secondary"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-faint/50">
            {filtered.map((project) => (
              <tr key={project.id} className="hover:bg-surface-alt transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {project.invoiceId || '\u2014'}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{project.clientName}</div>
                  {project.xactimateNumber && (
                    <div className="text-xs text-muted">XA: {project.xactimateNumber}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-secondary max-w-[160px] truncate">
                  {project.projectName || '\u2014'}
                </td>
                <td className="px-4 py-3">
                  {project.projectType ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.projectType === 'Water Mitigation' ? 'bg-blue-100 text-blue-700' :
                      project.projectType === 'Pack-out' ? 'bg-purple-100 text-purple-700' :
                      project.projectType === 'Mold Remediation' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {project.projectType}
                    </span>
                  ) : <span className="text-muted text-xs">{'\u2014'}</span>}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {project.amount ? `$${project.amount.toLocaleString()}` : '\u2014'}
                </td>
                <td className="px-4 py-3"><StatusPill value={project.invoiceStatus} /></td>
                <td className="px-4 py-3"><StatusPill value={project.contractStatus} /></td>
                <td className="px-4 py-3"><StatusPill value={project.cocStatus} /></td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  <span className={project.dueDate && project.dueDate < today && project.invoiceStatus !== 'Paid' ? 'font-semibold text-red-700' : 'text-muted'}>
                    {formatDate(project.dueDate)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  <span className={followUpTone(project, today)}>
                    {formatDate(project.nextFollowUpDate)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted">
            {search || filterStatus !== 'all' ? 'No projects match your filters' : 'No projects found'}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        token={token}
        onCreated={onRefresh}
      />
    </div>
  )
}

function formatDate(date: string | null) {
  if (!date) {
    return '\u2014'
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function followUpTone(project: Project, today: string) {
  const nextFollowUpDate = project.nextFollowUpDate
  if (!nextFollowUpDate || project.invoiceStatus === 'Paid') {
    return 'text-muted'
  }

  if (nextFollowUpDate < today) {
    return 'font-semibold text-red-700'
  }

  if (nextFollowUpDate === today) {
    return 'font-semibold text-amber-700'
  }

  return 'text-muted'
}
