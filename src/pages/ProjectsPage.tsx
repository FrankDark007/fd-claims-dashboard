import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/20/solid'
import type { Project } from '../types/claim'
import StatusPill from '../components/StatusPill'
import CreateProjectModal from '../components/CreateProjectModal'
import { computePriorityScore, getPriorityLabel } from '../lib/priority'

interface ProjectsPageProps {
  projects: Project[]
  loading: boolean
  token: string
  onRefresh: () => void
}

export default function ProjectsPage({ projects, loading, token, onRefresh }: ProjectsPageProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProjectStatus, setFilterProjectStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCollections, setFilterCollections] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const filtered = projects
    .filter((project) => {
      const searchTerm = search.toLowerCase()
      const searchableFields = [
        project.clientName,
        project.projectName,
        project.xactimateNumber,
        project.claimNumber,
        project.carrier,
        project.projectManagerName,
        project.pmEmail,
        project.adjusterName,
        project.adjusterEmail,
        project.invoiceId?.toString() ?? '',
      ]
      const matchesSearch = searchableFields.some((field) => field.toLowerCase().includes(searchTerm))
      const matchesStatus = filterStatus === 'all' || project.invoiceStatus === filterStatus
      const matchesProjectStatus = filterProjectStatus === 'all' || project.projectStatus === filterProjectStatus
      const matchesType = filterType === 'all' || project.projectType === filterType

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

      return matchesSearch && matchesStatus && matchesProjectStatus && matchesType && matchesCollections
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

  const activeProjects = projects.filter((project) => project.projectStatus !== 'Complete' && project.projectStatus !== 'Archived').length
  const unpaidProjects = projects.filter((project) => project.invoiceStatus !== 'Paid').length
  const attentionProjects = projects.filter((project) => {
    const followUpDate = project.nextFollowUpDate ?? project.dueDate
    return project.invoiceStatus !== 'Paid' && followUpDate !== null && followUpDate <= today
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Projects board</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Work the entire claims pipeline from one table.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              Search by customer, carrier, claim, or contact details, then narrow the board by billing pressure,
              project status, and job type.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            <PlusIcon className="size-4" />
            Create project
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ToplineStat label="Active" value={activeProjects.toString()} detail="Open production work" />
          <ToplineStat label="Unpaid" value={unpaidProjects.toString()} detail="Projects not fully collected" />
          <ToplineStat label="Needs attention" value={attentionProjects.toString()} detail="Due now or overdue follow-up" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.8fr_repeat(4,minmax(0,1fr))]">
          <FilterField label="Search">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Client, claim #, adjuster, carrier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </FilterField>
          <FilterField label="Invoice status">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </FilterField>
          <FilterField label="Project status">
            <select
              value={filterProjectStatus}
              onChange={(e) => setFilterProjectStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All project states</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Complete">Complete</option>
              <option value="Archived">Archived</option>
            </select>
          </FilterField>
          <FilterField label="Project type">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All types</option>
              <option value="Water Mitigation">Water Mitigation</option>
              <option value="Pack-out">Pack-out</option>
              <option value="Mold Remediation">Mold Remediation</option>
            </select>
          </FilterField>
          <FilterField label="Collections">
            <select
              value={filterCollections}
              onChange={(e) => setFilterCollections(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All collections</option>
              <option value="needs-attention">Needs attention</option>
              <option value="upcoming">Upcoming follow-up</option>
              <option value="paid">Collected</option>
            </select>
          </FilterField>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Claims table</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">{filtered.length} matching projects</h3>
          </div>
          <Link to="/reports" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Open reports
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            {search || filterStatus !== 'all' || filterProjectStatus !== 'all' || filterType !== 'all' || filterCollections !== 'all'
              ? 'No projects match the current filters.'
              : 'No projects found.'}
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-slate-200 lg:hidden">
              {filtered.map((project) => {
                const priorityScore = computePriorityScore(project, null, today)
                const priorityInfo = getPriorityLabel(priorityScore)
                const followUp = project.nextFollowUpDate ?? project.dueDate
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block px-5 py-4 transition-colors active:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                        {getInitials(project.clientName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{project.clientName}</p>
                          {priorityScore > 0 && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityInfo.tone}`}>
                              {priorityInfo.text}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {project.projectName || project.projectType || 'Untitled project'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {project.claimNumber || 'No claim #'} · {project.carrier || 'Carrier not set'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusPill value={project.invoiceStatus} />
                          {project.amount && (
                            <span className="text-sm font-medium tabular-nums text-slate-700">
                              ${project.amount.toLocaleString()}
                            </span>
                          )}
                          {followUp && project.invoiceStatus !== 'Paid' && (
                            <span className={`text-xs font-semibold ${dateTone(followUp, project.invoiceStatus, today)}`}>
                              Follow-up {formatDate(followUp)}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="size-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3 font-semibold text-slate-900">Client</th>
                    <th className="px-3 py-3.5 font-semibold text-slate-900">Type</th>
                    <th className="px-3 py-3.5 font-semibold text-slate-900">Financials</th>
                    <th className="px-3 py-3.5 font-semibold text-slate-900">Documents</th>
                    <th className="px-3 py-3.5 font-semibold text-slate-900">Collections</th>
                    <th className="px-3 py-3.5 font-semibold text-slate-900">Project state</th>
                    <th className="py-3.5 pl-3 pr-6 text-right font-semibold text-slate-900">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filtered.map((project) => {
                    const priorityScore = computePriorityScore(project, null, today)
                    const priorityInfo = getPriorityLabel(priorityScore)
                    return (
                    <tr key={project.id} className="hover:bg-slate-50">
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                            {getInitials(project.clientName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link to={`/projects/${project.id}`} className="font-semibold text-slate-900 hover:text-primary">
                                {project.clientName}
                              </Link>
                              {priorityScore > 0 && (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityInfo.tone}`}>
                                  {priorityInfo.text}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-600">
                              {project.projectName || 'Untitled project'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {project.claimNumber || 'No claim #'} · {project.carrier || 'Carrier not set'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-2">
                          {project.projectType ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${typeClasses(project.projectType)}`}>
                              {project.projectType}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">Unassigned</span>
                          )}
                          <p className="text-xs text-slate-500">XA {project.xactimateNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-2">
                          <p className="font-medium tabular-nums text-slate-900">
                            {project.amount ? `$${project.amount.toLocaleString()}` : '—'}
                          </p>
                          <StatusPill value={project.invoiceStatus} />
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-2">
                          <StatusPill value={project.contractStatus} />
                          <StatusPill value={project.cocStatus} />
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-1">
                          <p className={`font-semibold ${dateTone(project.nextFollowUpDate ?? project.dueDate, project.invoiceStatus, today)}`}>
                            {formatDate(project.nextFollowUpDate ?? project.dueDate)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Due {formatDate(project.dueDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <StatusPill value={project.projectStatus} />
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <Link
                          to={`/projects/${project.id}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        token={token}
        onCreated={onRefresh}
      />
    </div>
  )
}

function ToplineStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function formatDate(date: string | null) {
  if (!date) {
    return '—'
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function dateTone(date: string | null, invoiceStatus: Project['invoiceStatus'], today: string) {
  if (!date || invoiceStatus === 'Paid') {
    return 'text-slate-500'
  }

  if (date < today) {
    return 'text-rose-700'
  }

  if (date === today) {
    return 'text-amber-700'
  }

  return 'text-slate-900'
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('')
}

function typeClasses(projectType: string) {
  if (projectType === 'Water Mitigation') {
    return 'bg-sky-100 text-sky-700'
  }

  if (projectType === 'Pack-out') {
    return 'bg-violet-100 text-violet-700'
  }

  if (projectType === 'Mold Remediation') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-slate-100 text-slate-700'
}
