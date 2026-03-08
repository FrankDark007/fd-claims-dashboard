import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  LinkIcon,
  CameraIcon,
} from '@heroicons/react/20/solid'
import type { Project } from '../types/claim'
import { useProject, useProjectData } from '../hooks/useProject'
import { useProjectNotes } from '../hooks/useProjectNotes'
import { useProjectCommunications } from '../hooks/useProjectCommunications'
import { useProjectTasks } from '../hooks/useProjectTasks'
import StatusPill from '../components/StatusPill'
import OverviewTab from '../components/project/OverviewTab'
import FinancialsTab from '../components/project/FinancialsTab'
import ProgressTracker from '../components/project/ProgressTracker'
import FilesTab from '../components/project/FilesTab'
import TimelineTab from '../components/project/TimelineTab'
import NotesTab from '../components/project/NotesTab'
import EmailTab from '../components/project/EmailTab'
import TasksTab from '../components/project/TasksTab'

interface ProjectDetailPageProps {
  projects: Project[]
  token: string
  onProjectsRefresh: () => Promise<void>
}

type TabId = 'overview' | 'financials' | 'files' | 'timeline' | 'tasks' | 'notes' | 'email'

export default function ProjectDetailPage({ projects, token, onProjectsRefresh }: ProjectDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const {
    project: hydratedProject,
    loading: projectLoading,
    saveProject,
    refetch: refetchProject,
  } = useProject(id, token)
  const project = hydratedProject ?? projects.find((candidate) => candidate.id === id)
  const {
    data,
    loading: dataLoading,
    refetch,
    addInvoiceEvent,
    updateInvoiceEvent,
    removeInvoiceEvent,
  } = useProjectData(id, token)
  const {
    notes,
    loading: notesLoading,
    addNote,
    updateNote,
    removeNote,
  } = useProjectNotes(id, token)
  const {
    tasks,
    loading: tasksLoading,
    saveTasks,
  } = useProjectTasks(id, token)
  const {
    communications,
    loading: communicationsLoading,
    createCommunication,
    updateCommunication,
    deleteCommunication,
  } = useProjectCommunications(id, token)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const handleProjectSave = async (input: Parameters<typeof saveProject>[0]) => {
    await saveProject(input)
    await Promise.all([refetch(), onProjectsRefresh()])
  }

  const handleAddInvoiceEvent = async (input: Parameters<typeof addInvoiceEvent>[0]) => {
    await addInvoiceEvent(input)
    await Promise.all([refetchProject(), onProjectsRefresh()])
  }

  const handleUpdateInvoiceEvent = async (eventId: string, input: Parameters<typeof updateInvoiceEvent>[1]) => {
    await updateInvoiceEvent(eventId, input)
    await Promise.all([refetchProject(), onProjectsRefresh()])
  }

  const handleDeleteInvoiceEvent = async (eventId: string) => {
    await removeInvoiceEvent(eventId)
    await Promise.all([refetchProject(), onProjectsRefresh()])
  }

  const handleSaveTasks = async (input: Parameters<typeof saveTasks>[0]) => {
    await saveTasks(input)
  }

  if (!project && projectLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-lg font-semibold text-foreground">Project not found</h2>
        <p className="mt-2 text-secondary">The project you're looking for doesn't exist.</p>
        <Link to="/projects" className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary-hover">
          Back to projects
        </Link>
      </div>
    )
  }

  const tabs = [
    { name: 'Overview', id: 'overview', count: undefined },
    { name: 'Financials', id: 'financials', count: data.invoiceEvents.length || undefined },
    { name: 'Files', id: 'files', count: data.files.length || undefined },
    { name: 'Timeline', id: 'timeline', count: data.invoiceEvents.length + notes.length + communications.length || undefined },
    { name: 'Tasks', id: 'tasks', count: tasks.length || undefined },
    { name: 'Notes', id: 'notes', count: notes.length || undefined },
    { name: 'Comms', id: 'email', count: communications.length || undefined },
  ] satisfies Array<{ name: string; id: TabId; count?: number }>

  const quickStats = [
    {
      label: 'Billed',
      value: project.amount ? `$${project.amount.toLocaleString()}` : '—',
      detail: project.invoiceId ? `Invoice #${project.invoiceId}` : 'No invoice number',
    },
    {
      label: 'Due date',
      value: formatDate(project.dueDate),
      detail: project.invoiceStatus === 'Paid' ? 'Invoice settled' : project.invoiceStatus,
    },
    {
      label: 'Next follow-up',
      value: formatDate(project.nextFollowUpDate ?? project.dueDate),
      detail: project.invoiceStatus === 'Paid' ? 'No collection action needed' : 'Collections schedule',
    },
    {
      label: 'Docs ready',
      value: `${documentReadiness(project)}/4`,
      detail: 'Contract, COC, dry logs, Matterport',
    },
  ]

  return (
    <div className="space-y-8">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900">
        <ArrowLeftIcon className="size-4" />
        Back to projects
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 px-6 py-8 xl:grid-cols-[1.45fr_0.95fr] xl:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill value={project.projectStatus} size="md" />
              <StatusPill value={project.invoiceStatus} size="md" />
              {project.projectType ? (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${typeClasses(project.projectType)}`}>
                  {project.projectType}
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {project.clientName}
            </h2>
            <p className="mt-3 text-base text-slate-600">
              {project.projectName || 'Project workspace'}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MetaBlock label="Xactimate" lines={[project.xactimateNumber ? `XA ${project.xactimateNumber}` : 'No Xactimate #']} />
              <MetaBlock label="Contacts" lines={[project.projectManagerName || 'No PM assigned', project.adjusterName || 'No adjuster set']} />
              <MetaBlock label="Carrier" lines={[project.carrier || 'Carrier not set', project.adjusterEmail || project.pmEmail || 'No contact email']} />
              <MetaBlock label="Collections" lines={[project.nextFollowUpDate ? `Follow-up ${formatDate(project.nextFollowUpDate)}` : 'No explicit follow-up date', project.paymentReceivedDate ? `Paid ${formatDate(project.paymentReceivedDate)}` : `Due ${formatDate(project.dueDate)}`]} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {project.companyCamUrl ? (
                <a
                  href={project.companyCamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  <CameraIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-slate-400" />
                  CompanyCam
                </a>
              ) : null}

              {project.driveFolderUrl ? (
                <a
                  href={project.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  <LinkIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-slate-400" />
                  Drive folder
                </a>
              ) : null}

              <Menu as="div" className="relative sm:hidden">
                <MenuButton className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
                  More
                  <ChevronDownIcon aria-hidden="true" className="-mr-1 ml-1.5 size-5 text-slate-400" />
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-2xl bg-white py-2 shadow-lg outline outline-1 outline-black/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  {project.companyCamUrl ? (
                    <MenuItem>
                      <a href={project.companyCamUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-700 data-[focus]:bg-slate-100">
                        CompanyCam
                      </a>
                    </MenuItem>
                  ) : null}
                  {project.driveFolderUrl ? (
                    <MenuItem>
                      <a href={project.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-700 data-[focus]:bg-slate-100">
                        Drive folder
                      </a>
                    </MenuItem>
                  ) : null}
                </MenuItems>
              </Menu>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-600">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workflow progress</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Track the job from docs to payment</h3>
          </div>
        </div>
        <div className="mt-6">
          <ProgressTracker project={project} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 pt-2">
          <div className="grid grid-cols-1 sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              aria-label="Select a tab"
              className="col-start-1 row-start-1 w-full appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.name}</option>
              ))}
            </select>
            <ChevronDownIcon aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-slate-400" />
          </div>
          <div className="hidden sm:block">
            <nav aria-label="Tabs" className="-mb-px flex flex-wrap gap-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700'
                  }`}
                >
                  {tab.name}
                  {tab.count ? (
                    <span
                      className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        activeTab === tab.id
                          ? 'bg-primary-light text-primary'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab project={project} token={token} />}
          {activeTab === 'financials' && (
            <FinancialsTab
              project={project}
              invoiceEvents={data.invoiceEvents}
              onSaveProject={handleProjectSave}
              onCreateInvoiceEvent={handleAddInvoiceEvent}
            />
          )}
          {activeTab === 'files' && (
            <FilesTab
              project={project}
              files={data.files}
              loading={dataLoading}
              projectId={id!}
              token={token}
              onRefresh={refetch}
            />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab
              project={project}
              invoiceEvents={data.invoiceEvents}
              communications={communications}
              notes={notes}
              onCreateInvoiceEvent={handleAddInvoiceEvent}
              onUpdateInvoiceEvent={handleUpdateInvoiceEvent}
              onDeleteInvoiceEvent={handleDeleteInvoiceEvent}
            />
          )}
          {activeTab === 'tasks' && (
            <TasksTab
              projectType={project.projectType}
              tasks={tasks}
              loading={tasksLoading}
              onSave={handleSaveTasks}
            />
          )}
          {activeTab === 'notes' && (
            <NotesTab
              notes={notes}
              loading={notesLoading}
              onCreate={addNote}
              onUpdate={updateNote}
              onDelete={removeNote}
            />
          )}
          {activeTab === 'email' && (
            <EmailTab
              project={project}
              communications={communications}
              loading={communicationsLoading}
              token={token}
              onCreate={createCommunication}
              onUpdate={updateCommunication}
              onDelete={deleteCommunication}
              onRefreshCommunications={() => {
                void refetchProject()
                void onProjectsRefresh()
              }}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function MetaBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="mt-3 space-y-1">
        {lines.map((line) => (
          <p key={line} className="text-sm text-slate-700">{line}</p>
        ))}
      </div>
    </div>
  )
}

function formatDate(date: string | null) {
  if (!date) {
    return '—'
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

function documentReadiness(project: Project) {
  let ready = 0
  if (project.contractStatus === 'Signed') ready += 1
  if (project.cocStatus === 'Signed') ready += 1
  if (project.drylogStatus === 'Received') ready += 1
  if (project.matterportStatus === 'Has Scan') ready += 1
  return ready
}
