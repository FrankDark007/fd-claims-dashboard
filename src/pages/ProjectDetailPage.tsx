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

const tabs = [
  { name: 'Overview', id: 'overview' },
  { name: 'Financials', id: 'financials' },
  { name: 'Files', id: 'files' },
  { name: 'Timeline', id: 'timeline' },
  { name: 'Tasks', id: 'tasks' },
  { name: 'Notes', id: 'notes' },
  { name: 'Email', id: 'email' },
]

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
  const [activeTab, setActiveTab] = useState('overview')

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

  return (
    <div>
      {/* Back link */}
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeftIcon className="size-4" />
        Back to projects
      </Link>

      {/* Page heading */}
      <div className="lg:flex lg:items-center lg:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl/7 font-bold text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            {project.clientName}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            {project.projectName && (
              <div className="mt-2 flex items-center text-sm text-secondary">
                {project.projectName}
              </div>
            )}
            {project.projectType && (
              <div className="mt-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  project.projectType === 'Water Mitigation' ? 'bg-blue-100 text-blue-700' :
                  project.projectType === 'Pack-out' ? 'bg-purple-100 text-purple-700' :
                  project.projectType === 'Mold Remediation' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.projectType}
                </span>
              </div>
            )}
            {project.amount && (
              <div className="mt-2 flex items-center text-sm text-secondary">
                ${project.amount.toLocaleString()}
              </div>
            )}
            <div className="mt-2">
              <StatusPill value={project.invoiceStatus} size="md" />
            </div>
            {(project.nextFollowUpDate || project.dueDate) && project.invoiceStatus !== 'Paid' && (
              <div className="mt-2 flex items-center text-sm text-secondary">
                Follow-up {formatDate(project.nextFollowUpDate ?? project.dueDate)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex lg:ml-4 lg:mt-0">
          {project.companyCamUrl && (
            <span className="ml-3 hidden sm:block">
              <a
                href={project.companyCamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <CameraIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-gray-400" />
                CompanyCam
              </a>
            </span>
          )}

          {project.driveFolderUrl && (
            <span className="ml-3 hidden sm:block">
              <a
                href={project.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <LinkIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-gray-400" />
                Drive
              </a>
            </span>
          )}

          {/* Mobile dropdown */}
          <Menu as="div" className="relative ml-3 sm:hidden">
            <MenuButton className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              More
              <ChevronDownIcon aria-hidden="true" className="-mr-1 ml-1.5 size-5 text-gray-400" />
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-1 outline-black/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
            >
              {project.companyCamUrl && (
                <MenuItem>
                  <a href={project.companyCamUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                    CompanyCam
                  </a>
                </MenuItem>
              )}
              {project.driveFolderUrl && (
                <MenuItem>
                  <a href={project.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                    Drive Folder
                  </a>
                </MenuItem>
              )}
            </MenuItems>
          </Menu>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="mb-6">
        <ProgressTracker project={project} />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="hidden sm:block">
          <nav aria-label="Tabs" className="isolate flex divide-x divide-gray-200 rounded-lg bg-white shadow">
            {tabs.map((tab, tabIdx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                } ${tabIdx === 0 ? 'rounded-l-lg' : ''} ${
                  tabIdx === tabs.length - 1 ? 'rounded-r-lg' : ''
                } group relative min-w-0 flex-1 overflow-hidden px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10`}
              >
                <span>{tab.name}</span>
                <span
                  aria-hidden="true"
                  className={`${
                    activeTab === tab.id ? 'bg-primary' : 'bg-transparent'
                  } absolute inset-x-0 bottom-0 h-0.5`}
                />
              </button>
            ))}
          </nav>
        </div>
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab project={project} />}
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
        {activeTab === 'email' && <EmailTab />}
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
  })
}
