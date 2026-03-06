import { useEffect, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { ProjectTask, ProjectType, ProjectTaskWriteInput } from '../../shared/projects'
import { buildProjectTaskTemplate } from '../../shared/projects'

interface TasksTabProps {
  projectType: ProjectType | null
  tasks: ProjectTask[]
  loading: boolean
  onSave: (tasks: ProjectTaskWriteInput[]) => Promise<unknown>
}

interface EditableTask {
  id?: string
  title: string
  completed: boolean
  assignee: string
  dueDate: string
  notes: string
}

function toEditableTask(task?: Partial<ProjectTask>): EditableTask {
  return {
    id: task?.id,
    title: task?.title ?? '',
    completed: task?.completed ?? false,
    assignee: task?.assignee ?? '',
    dueDate: task?.dueDate ?? '',
    notes: task?.notes ?? '',
  }
}

export default function TasksTab({ projectType, tasks, loading, onSave }: TasksTabProps) {
  const [draftTasks, setDraftTasks] = useState<EditableTask[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraftTasks(tasks.map((task) => toEditableTask(task)))
  }, [tasks])

  const completedCount = draftTasks.filter((task) => task.completed).length
  const progress = draftTasks.length === 0 ? 0 : Math.round((completedCount / draftTasks.length) * 100)

  const updateTask = (index: number, patch: Partial<EditableTask>) => {
    setDraftTasks((current) => current.map((task, taskIndex) => (
      taskIndex === index ? { ...task, ...patch } : task
    )))
  }

  const addTask = () => {
    setDraftTasks((current) => [...current, toEditableTask()])
  }

  const removeTask = (index: number) => {
    setDraftTasks((current) => current.filter((_, taskIndex) => taskIndex !== index))
  }

  const moveTask = (index: number, direction: -1 | 1) => {
    setDraftTasks((current) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [task] = next.splice(index, 1)
      next.splice(targetIndex, 0, task)
      return next
    })
  }

  const applyTemplate = () => {
    const template = buildProjectTaskTemplate(projectType).map((task) => toEditableTask(task))
    setDraftTasks((current) => [...template, ...current])
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await onSave(draftTasks.map((task, index) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        assignee: task.assignee,
        dueDate: task.dueDate || null,
        notes: task.notes,
        sortOrder: index,
      })))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save tasks')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Project Tasks</h3>
            <p className="mt-1 text-sm text-secondary">
              Keep project operations, document collection, and billing follow-up in one checklist.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-gray-50"
            >
              <ClipboardDocumentListIcon className="size-4" />
              Apply Template
            </button>
            <button
              type="button"
              onClick={addTask}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              <PlusIcon className="size-4" />
              Add Task
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total Tasks" value={draftTasks.length.toString()} />
          <SummaryCard label="Completed" value={completedCount.toString()} />
          <SummaryCard label="Progress" value={`${progress}%`} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : draftTasks.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircleIcon className="mx-auto size-12 text-gray-300" />
            <h4 className="mt-4 text-sm font-semibold text-foreground">No tasks yet</h4>
            <p className="mt-2 text-sm text-secondary">
              Start with a project-type template or add custom tasks for this job.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {draftTasks.map((task, index) => (
              <li key={task.id ?? `draft-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                  <div className="flex items-start gap-3 xl:w-16 xl:flex-col xl:items-center">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) => updateTask(index, { completed: event.target.checked })}
                      className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex gap-1 xl:flex-col">
                      <button
                        type="button"
                        onClick={() => moveTask(index, -1)}
                        disabled={index === 0}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-foreground disabled:opacity-40"
                        title="Move up"
                      >
                        <ArrowUpIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTask(index, 1)}
                        disabled={index === draftTasks.length - 1}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-foreground disabled:opacity-40"
                        title="Move down"
                      >
                        <ArrowDownIcon className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Task
                      </label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(event) => updateTask(index, { title: event.target.value })}
                        placeholder="Call adjuster about contract status"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Assignee
                      </label>
                      <input
                        type="text"
                        value={task.assignee}
                        onChange={(event) => updateTask(index, { assignee: event.target.value })}
                        placeholder="Frank"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(event) => updateTask(index, { dueDate: event.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Notes
                      </label>
                      <textarea
                        value={task.notes}
                        onChange={(event) => updateTask(index, { notes: event.target.value })}
                        rows={3}
                        placeholder="Context, follow-up script, or handoff details..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end xl:justify-start">
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-red-600"
                      title="Delete task"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Tasks'}
          </button>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
