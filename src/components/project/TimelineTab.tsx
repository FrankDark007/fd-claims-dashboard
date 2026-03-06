import { useEffect, useState } from 'react'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { InvoiceEvent, Project, ProjectCommunication, ProjectNote } from '../../shared/projects'

interface TimelineTabProps {
  project: Project
  invoiceEvents: InvoiceEvent[]
  communications?: ProjectCommunication[]
  notes?: ProjectNote[]
  onCreateInvoiceEvent: (input: {
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
    recipient?: string
  }) => Promise<unknown>
  onUpdateInvoiceEvent: (eventId: string, input: {
    type?: 'sent' | 'reminder' | 'paid' | 'disputed'
    date?: string
    amount?: number
    notes?: string
    recipient?: string
  }) => Promise<unknown>
  onDeleteInvoiceEvent: (eventId: string) => Promise<void>
}

type TimelineItem = {
  id: string
  type: 'system' | 'status' | 'follow-up' | 'invoice' | 'note' | 'communication'
  title: string
  description: string
  person?: string
  date: string
  isCompleted?: boolean
  invoiceEvent?: InvoiceEvent
}

type EventDraft = {
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: string
  recipient: string
  notes: string
}

const EMPTY_DRAFT: EventDraft = {
  type: 'reminder',
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  recipient: '',
  notes: '',
}

export default function TimelineTab({
  project,
  invoiceEvents,
  communications = [],
  notes = [],
  onCreateInvoiceEvent,
  onUpdateInvoiceEvent,
  onDeleteInvoiceEvent,
}: TimelineTabProps) {
  const [editorMode, setEditorMode] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EventDraft>(buildDraft(project))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workingEventId, setWorkingEventId] = useState<string | null>(null)
  const timeline = buildTimeline(project, invoiceEvents, communications, notes)

  useEffect(() => {
    if (editorMode === 'create') {
      setDraft(buildDraft(project))
    }
  }, [editorMode, project])

  const openCreate = () => {
    setEditorMode('create')
    setEditingEventId(null)
    setDraft(buildDraft(project))
    setError(null)
  }

  const startEditing = (event: InvoiceEvent) => {
    setEditorMode('edit')
    setEditingEventId(event.id)
    setDraft({
      type: event.type,
      date: event.eventDate,
      amount: event.amount.toString(),
      recipient: event.recipient,
      notes: event.notes,
    })
    setError(null)
  }

  const closeEditor = () => {
    setEditorMode('closed')
    setEditingEventId(null)
    setDraft(buildDraft(project))
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(draft.amount)

    if (!Number.isFinite(amount)) {
      setError('Amount is required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (editorMode === 'edit' && editingEventId) {
        await onUpdateInvoiceEvent(editingEventId, {
          type: draft.type,
          date: draft.date,
          amount,
          recipient: draft.recipient || undefined,
          notes: draft.notes || undefined,
        })
      } else {
        await onCreateInvoiceEvent({
          type: draft.type,
          date: draft.date,
          amount,
          recipient: draft.recipient || undefined,
          notes: draft.notes || undefined,
        })
      }

      closeEditor()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice event')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    setWorkingEventId(eventId)
    setError(null)

    try {
      await onDeleteInvoiceEvent(eventId)
      if (editingEventId === eventId) {
        closeEditor()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete invoice event')
    } finally {
      setWorkingEventId(null)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDaysIcon className="size-5 text-primary" />
            Activity Timeline
          </div>
          <p className="mt-2 text-sm text-secondary">
            Track invoice touches, payment movement, follow-up dates, and internal notes from one feed.
          </p>
        </div>
        <div className="flex gap-2">
          {editorMode !== 'closed' && (
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-secondary hover:bg-gray-50"
            >
              <XMarkIcon className="size-4" />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <PlusIcon className="size-4" />
            Log Event
          </button>
        </div>
      </div>

      {editorMode !== 'closed' && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Type</span>
              <select
                value={draft.type}
                onChange={(currentEvent) => setDraft((current) => ({
                  ...current,
                  type: currentEvent.target.value as EventDraft['type'],
                }))}
                className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="sent">Invoice Sent</option>
                <option value="reminder">Reminder</option>
                <option value="paid">Paid</option>
                <option value="disputed">Disputed</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Date</span>
              <input
                type="date"
                value={draft.date}
                onChange={(currentEvent) => setDraft((current) => ({ ...current, date: currentEvent.target.value }))}
                className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(currentEvent) => setDraft((current) => ({ ...current, amount: currentEvent.target.value }))}
                className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Recipient</span>
              <input
                type="text"
                value={draft.recipient}
                onChange={(currentEvent) => setDraft((current) => ({ ...current, recipient: currentEvent.target.value }))}
                placeholder="Adjuster, PM, client, or carrier"
                className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Notes</span>
              <textarea
                rows={3}
                value={draft.notes}
                onChange={(currentEvent) => setDraft((current) => ({ ...current, notes: currentEvent.target.value }))}
                placeholder="Capture delivery method, dispute details, promised callback, or payment context."
                className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editorMode === 'edit' ? 'Save Event' : 'Add Event'}
            </button>
          </div>
        </form>
      )}

      {timeline.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-muted">No activity yet</p>
        </div>
      ) : (
        <ul role="list" className="mt-6 space-y-6">
          {timeline.map((item, idx) => (
            <li key={item.id} className="relative flex gap-x-4">
              <div
                className={`absolute left-0 top-0 flex w-6 justify-center ${
                  idx === timeline.length - 1 ? 'h-6' : '-bottom-6'
                }`}
              >
                <div className="w-px bg-gray-200" />
              </div>

              <div className="relative flex size-6 flex-none items-center justify-center bg-white">
                {item.isCompleted ? (
                  <CheckCircleIcon aria-hidden="true" className="size-6 text-primary" />
                ) : (
                  <div className={`size-2 rounded-full ${itemDot(item.type)}`} />
                )}
              </div>

              <div className="flex-auto rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${itemBadgeTone(item.type)}`}>
                        {item.title}
                      </span>
                      <time className="text-xs text-muted">{formatDate(item.date)}</time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{item.description}</p>
                    {item.person && <p className="mt-2 text-xs text-muted">{item.person}</p>}
                  </div>

                  {item.invoiceEvent && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(item.invoiceEvent!)}
                        className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-primary"
                        title="Edit invoice event"
                      >
                        <PencilSquareIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteEvent(item.invoiceEvent!.id)}
                        disabled={workingEventId === item.invoiceEvent.id}
                        className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                        title="Delete invoice event"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function buildTimeline(
  project: Project,
  invoiceEvents: InvoiceEvent[],
  communications: ProjectCommunication[],
  notes: ProjectNote[],
): TimelineItem[] {
  const items: TimelineItem[] = []

  if (project.createdAt) {
    items.push({
      id: 'created',
      type: 'system',
      title: 'Project Created',
      description: 'Project record opened in the dashboard.',
      date: project.createdAt,
      isCompleted: true,
    })
  }

  if (project.invoiceSentDate) {
    items.push({
      id: 'invoice-sent-date',
      type: 'status',
      title: 'Invoice Sent Date',
      description: `Invoice sent date is set to ${formatDate(project.invoiceSentDate)}.`,
      date: project.invoiceSentDate,
      isCompleted: true,
    })
  }

  if (project.dueDate) {
    items.push({
      id: 'invoice-due-date',
      type: 'status',
      title: 'Due Date',
      description: `Invoice is due on ${formatDate(project.dueDate)}.`,
      date: project.dueDate,
    })
  }

  if (project.nextFollowUpDate) {
    items.push({
      id: 'next-follow-up-date',
      type: 'follow-up',
      title: 'Next Follow-up',
      description: `Collections follow-up is scheduled for ${formatDate(project.nextFollowUpDate)}.`,
      date: project.nextFollowUpDate,
    })
  }

  if (project.paymentReceivedDate) {
    items.push({
      id: 'payment-received',
      type: 'status',
      title: 'Payment Received',
      description: `Payment received on ${formatDate(project.paymentReceivedDate)}.`,
      date: project.paymentReceivedDate,
      isCompleted: true,
    })
  }

  for (const invoiceEvent of invoiceEvents) {
    items.push({
      id: invoiceEvent.id,
      type: 'invoice',
      title: eventLabel(invoiceEvent.type),
      description: buildEventDescription(invoiceEvent),
      person: invoiceEvent.createdBy,
      date: invoiceEvent.eventDate,
      isCompleted: invoiceEvent.type === 'paid',
      invoiceEvent,
    })
  }

  for (const communication of communications) {
    items.push({
      id: communication.id,
      type: 'communication',
      title: communication.direction === 'outbound' ? 'Communication Sent' : 'Communication Received',
      description: buildCommunicationDescription(communication),
      person: communication.createdBy,
      date: communication.updatedAt,
      isCompleted: communication.status === 'replied' || communication.status === 'received',
    })
  }

  for (const note of notes) {
    items.push({
      id: note.id,
      type: 'note',
      title: note.pinned ? 'Pinned Note' : 'Note',
      description: note.body,
      person: note.createdBy,
      date: note.updatedAt,
      isCompleted: note.pinned,
    })
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function buildDraft(project: Project): EventDraft {
  return {
    ...EMPTY_DRAFT,
    amount: project.amount?.toString() ?? '',
    recipient: project.adjusterEmail || project.adjusterName || project.pmEmail || '',
  }
}

function buildEventDescription(event: InvoiceEvent) {
  const parts = [`$${event.amount.toLocaleString()}`]

  if (event.recipient) {
    parts.push(`Recipient: ${event.recipient}`)
  }

  if (event.notes) {
    parts.push(event.notes)
  }

  return parts.join(' • ')
}

function buildCommunicationDescription(communication: ProjectCommunication) {
  const parts = [
    `${communication.channel.toUpperCase()} • ${communication.counterpartName || 'Unknown contact'}`,
  ]

  if (communication.subject) {
    parts.push(communication.subject)
  }

  if (communication.body) {
    parts.push(communication.body)
  }

  if (communication.followUpDate) {
    parts.push(`Follow up ${formatDate(communication.followUpDate)}`)
  }

  return parts.join(' • ')
}

function formatDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function eventLabel(type: InvoiceEvent['type']) {
  switch (type) {
    case 'sent':
      return 'Invoice Sent'
    case 'reminder':
      return 'Reminder'
    case 'paid':
      return 'Paid'
    case 'disputed':
      return 'Disputed'
    default:
      return type
  }
}

function itemBadgeTone(type: TimelineItem['type']) {
  switch (type) {
    case 'invoice':
      return 'bg-blue-100 text-blue-700'
    case 'communication':
      return 'bg-violet-100 text-violet-700'
    case 'follow-up':
      return 'bg-amber-100 text-amber-700'
    case 'note':
      return 'bg-slate-200 text-slate-700'
    case 'status':
      return 'bg-emerald-100 text-emerald-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function itemDot(type: TimelineItem['type']) {
  switch (type) {
    case 'invoice':
      return 'bg-blue-500'
    case 'communication':
      return 'bg-violet-500'
    case 'follow-up':
      return 'bg-amber-500'
    case 'note':
      return 'bg-slate-500'
    case 'status':
      return 'bg-emerald-500'
    default:
      return 'bg-gray-300'
  }
}
