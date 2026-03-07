import { useEffect, useMemo, useState } from 'react'
import {
  ChatBubbleBottomCenterTextIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PhoneIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
  Project,
  ProjectCommunication,
  ProjectCommunicationWriteInput,
} from '../../shared/projects'
import { useAiDraftEmail, useAiSendEmail } from '../../hooks/useAI'

interface EmailTabProps {
  project: Project
  communications: ProjectCommunication[]
  loading: boolean
  token: string
  onCreate: (input: ProjectCommunicationWriteInput) => Promise<unknown>
  onUpdate: (communicationId: string, input: ProjectCommunicationWriteInput) => Promise<unknown>
  onDelete: (communicationId: string) => Promise<void>
  onRefreshCommunications?: () => void
}

type Draft = {
  channel: CommunicationChannel
  direction: CommunicationDirection
  counterpartName: string
  counterpartRole: string
  counterpartAddress: string
  subject: string
  body: string
  status: CommunicationStatus
  followUpDate: string
}

const STATUS_OPTIONS: CommunicationStatus[] = ['planned', 'sent', 'received', 'replied', 'left_voicemail', 'no_response']
const CHANNEL_OPTIONS: CommunicationChannel[] = ['email', 'phone', 'text', 'meeting']
const DIRECTION_OPTIONS: CommunicationDirection[] = ['outbound', 'inbound']

type AiTemplateType = 'reminder' | 'document_request' | 'escalation' | 'payment_confirmation'

const AI_TEMPLATE_OPTIONS: { value: AiTemplateType; label: string }[] = [
  { value: 'reminder', label: 'Invoice Reminder' },
  { value: 'document_request', label: 'Document Request' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'payment_confirmation', label: 'Payment Thank You' },
]

export default function EmailTab({ project, communications, loading, token, onCreate, onUpdate, onDelete, onRefreshCommunications }: EmailTabProps) {
  const [draft, setDraft] = useState<Draft>(buildDefaultDraft(project))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aiTemplateType, setAiTemplateType] = useState<AiTemplateType>('reminder')
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const { loading: aiDrafting, error: aiError, generateDraft } = useAiDraftEmail(token)
  const { loading: aiSending, error: sendError, sendEmail } = useAiSendEmail(token)

  useEffect(() => {
    if (!editingId) {
      setDraft(buildDefaultDraft(project))
    }
  }, [editingId, project])

  const quickTemplates = useMemo(() => buildTemplates(project), [project])
  const dueSoonCount = communications.filter((communication) => {
    const followUpDate = communication.followUpDate
    return followUpDate && followUpDate <= new Date().toISOString().slice(0, 10)
  }).length

  const saveCommunication = async () => {
    if (!draft.subject.trim() && !draft.body.trim()) {
      setError('Add a subject or message body before saving.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload: ProjectCommunicationWriteInput = {
        channel: draft.channel,
        direction: draft.direction,
        counterpartName: draft.counterpartName,
        counterpartRole: draft.counterpartRole,
        counterpartAddress: draft.counterpartAddress,
        subject: draft.subject,
        body: draft.body,
        status: draft.status,
        followUpDate: draft.followUpDate || null,
      }

      if (editingId) {
        await onUpdate(editingId, payload)
        setEditingId(null)
      } else {
        await onCreate(payload)
      }

      setDraft(buildDefaultDraft(project))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save communication')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (communication: ProjectCommunication) => {
    setEditingId(communication.id)
    setDraft({
      channel: communication.channel,
      direction: communication.direction,
      counterpartName: communication.counterpartName,
      counterpartRole: communication.counterpartRole,
      counterpartAddress: communication.counterpartAddress,
      subject: communication.subject,
      body: communication.body,
      status: communication.status,
      followUpDate: communication.followUpDate ?? '',
    })
    setError(null)
  }

  const removeCommunication = async (communicationId: string) => {
    setWorkingId(communicationId)
    setError(null)
    try {
      await onDelete(communicationId)
      if (editingId === communicationId) {
        setEditingId(null)
        setDraft(buildDefaultDraft(project))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete communication')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Communication Center</h3>
            <p className="mt-1 text-sm text-secondary">
              Log adjuster, PM, client, and carrier contact so collections and document follow-up stay visible.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Logged touches" value={communications.length.toString()} />
            <SummaryCard label="Need follow-up" value={dueSoonCount.toString()} />
            <SummaryCard label="Latest contact" value={communications[0] ? formatShortDate(communications[0].updatedAt) : '—'} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {quickTemplates.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => {
                setEditingId(null)
                setDraft({
                  ...buildDefaultDraft(project),
                  ...template.input,
                })
              }}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-white"
            >
              {template.label}
            </button>
          ))}

          <span className="mx-1 text-slate-300">|</span>

          <select
            value={aiTemplateType}
            onChange={(e) => setAiTemplateType(e.target.value as AiTemplateType)}
            className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 focus:border-violet-400 focus:outline-none"
          >
            {AI_TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={aiDrafting}
            onClick={async () => {
              setEditingId(null)
              setSendSuccess(null)
              const result = await generateDraft(project.id, aiTemplateType)
              if (result) {
                setDraft({
                  ...buildDefaultDraft(project),
                  channel: 'email',
                  direction: 'outbound',
                  subject: result.subject,
                  body: result.body,
                  counterpartAddress: result.to,
                  status: 'planned',
                })
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-100 px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-200 disabled:opacity-50"
          >
            <SparklesIcon className={`size-4 ${aiDrafting ? 'animate-spin' : ''}`} />
            {aiDrafting ? 'Drafting...' : 'Draft with AI'}
          </button>
        </div>

        {aiError && (
          <p className="mt-2 text-sm text-red-600">{aiError}</p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-foreground">{editingId ? 'Edit communication' : 'Log communication'}</h4>
            <p className="mt-1 text-sm text-secondary">Use this as the manual record until direct Gmail syncing exists.</p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setDraft(buildDefaultDraft(project))
                setError(null)
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-secondary hover:bg-gray-50"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Channel">
            <select
              value={draft.channel}
              onChange={(event) => setDraft((current) => ({ ...current, channel: event.target.value as CommunicationChannel }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option} value={option}>{labelize(option)}</option>
              ))}
            </select>
          </Field>

          <Field label="Direction">
            <select
              value={draft.direction}
              onChange={(event) => setDraft((current) => ({ ...current, direction: event.target.value as CommunicationDirection }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DIRECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>{labelize(option)}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as CommunicationStatus }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{labelize(option)}</option>
              ))}
            </select>
          </Field>

          <Field label="Follow-up date">
            <input
              type="date"
              value={draft.followUpDate}
              onChange={(event) => setDraft((current) => ({ ...current, followUpDate: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Contact name">
            <input
              type="text"
              value={draft.counterpartName}
              onChange={(event) => setDraft((current) => ({ ...current, counterpartName: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Role">
            <input
              type="text"
              value={draft.counterpartRole}
              onChange={(event) => setDraft((current) => ({ ...current, counterpartRole: event.target.value }))}
              placeholder="Adjuster, PM, carrier, client"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>

          <Field label="Address or phone">
            <input
              type="text"
              value={draft.counterpartAddress}
              onChange={(event) => setDraft((current) => ({ ...current, counterpartAddress: event.target.value }))}
              placeholder="email@carrier.com or (555) 555-5555"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Subject">
            <input
              type="text"
              value={draft.subject}
              onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Invoice reminder for claim 12345"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Message or call notes">
            <textarea
              rows={5}
              value={draft.body}
              onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
              placeholder="Capture the message sent, response received, or the call summary."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {sendError && <p className="mt-4 text-sm text-red-700">{sendError}</p>}
        {sendSuccess && <p className="mt-4 text-sm text-emerald-700">{sendSuccess}</p>}

        <div className="mt-6 flex justify-end gap-3">
          {draft.channel === 'email' && draft.direction === 'outbound' && draft.counterpartAddress.includes('@') && (
            <button
              type="button"
              disabled={aiSending || !draft.subject.trim() || !draft.body.trim()}
              onClick={async () => {
                setSendSuccess(null)
                const result = await sendEmail({
                  projectId: project.id,
                  to: draft.counterpartAddress,
                  subject: draft.subject,
                  body: draft.body,
                })
                if (result?.success) {
                  setSendSuccess(`Email sent to ${draft.counterpartAddress}`)
                  setDraft(buildDefaultDraft(project))
                  onRefreshCommunications?.()
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="size-4" />
              {aiSending ? 'Sending...' : 'Send Email'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void saveCommunication()}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Save Communication' : 'Log Communication'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ChatBubbleBottomCenterTextIcon className="size-5 text-primary" />
          Communication History
        </div>
        <p className="mt-2 text-sm text-secondary">Most recent updates first, including planned callbacks and received replies.</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : communications.length === 0 ? (
          <div className="py-12 text-center">
            <EnvelopeIcon className="mx-auto size-12 text-gray-300" />
            <h4 className="mt-4 text-sm font-semibold text-foreground">No communication logged yet</h4>
            <p className="mt-2 text-sm text-secondary">Start with a reminder, document request, or phone call note.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {communications.map((communication) => (
              <li key={communication.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${channelTone(communication.channel)}`}>
                        {labelize(communication.channel)}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(communication.status)}`}>
                        {labelize(communication.status)}
                      </span>
                      <span className="text-xs text-muted">{formatDateTime(communication.updatedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {communication.subject || '(No subject)'}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      {communication.direction === 'outbound' ? 'To' : 'From'} {communication.counterpartName || 'Unknown contact'}
                      {communication.counterpartRole ? ` · ${communication.counterpartRole}` : ''}
                      {communication.counterpartAddress ? ` · ${communication.counterpartAddress}` : ''}
                    </p>
                    {communication.body ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{communication.body}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>Logged by {communication.createdBy}</span>
                      {communication.followUpDate ? <span>Follow up {formatDate(communication.followUpDate)}</span> : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(communication)}
                      className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-primary"
                      title="Edit communication"
                    >
                      <PencilSquareIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCommunication(communication.id)}
                      disabled={workingId === communication.id}
                      className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                      title="Delete communication"
                    >
                      {communication.channel === 'phone' ? <PhoneIcon className="hidden" /> : null}
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
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

function buildDefaultDraft(project: Project): Draft {
  return {
    channel: 'email',
    direction: 'outbound',
    counterpartName: project.adjusterName || project.projectManagerName || '',
    counterpartRole: project.adjusterName ? 'Adjuster' : project.projectManagerName ? 'Project Manager' : '',
    counterpartAddress: project.adjusterEmail || project.pmEmail || project.adjusterPhone || project.pmPhone || '',
    subject: project.invoiceStatus === 'Paid'
      ? `Project update for ${project.clientName}`
      : `Invoice follow-up for ${project.clientName}`,
    body: '',
    status: 'planned',
    followUpDate: project.nextFollowUpDate ?? project.dueDate ?? '',
  }
}

function buildTemplates(project: Project) {
  const dueDate = project.nextFollowUpDate ?? project.dueDate ?? ''

  return [
    {
      label: 'Invoice Reminder',
      input: {
        channel: 'email',
        direction: 'outbound',
        counterpartName: project.adjusterName || project.carrier || '',
        counterpartRole: project.adjusterName ? 'Adjuster' : 'Carrier',
        counterpartAddress: project.adjusterEmail || '',
        subject: `Invoice reminder for ${project.clientName}`,
        body: `Following up on the outstanding invoice${project.invoiceId ? ` #${project.invoiceId}` : ''} for ${project.clientName}.${project.amount ? ` Current balance: $${project.amount.toLocaleString()}.` : ''}`,
        status: 'planned',
        followUpDate: dueDate,
      } satisfies Partial<Draft>,
    },
    {
      label: 'Document Request',
      input: {
        channel: 'email',
        direction: 'outbound',
        counterpartName: project.projectManagerName || project.adjusterName || '',
        counterpartRole: project.projectManagerName ? 'Project Manager' : 'Adjuster',
        counterpartAddress: project.pmEmail || project.adjusterEmail || '',
        subject: `Requested project documents for ${project.clientName}`,
        body: 'Requested the missing contract / COC / dry logs needed to close the billing package.',
        status: 'planned',
        followUpDate: dueDate,
      } satisfies Partial<Draft>,
    },
    {
      label: 'Phone Check-In',
      input: {
        channel: 'phone',
        direction: 'outbound',
        counterpartName: project.adjusterName || project.projectManagerName || '',
        counterpartRole: project.adjusterName ? 'Adjuster' : 'Project Manager',
        counterpartAddress: project.adjusterPhone || project.pmPhone || '',
        subject: `Phone follow-up for ${project.clientName}`,
        body: 'Called to confirm next action, payment timing, or missing documentation.',
        status: 'left_voicemail',
        followUpDate: dueDate,
      } satisfies Partial<Draft>,
    },
  ]
}

function statusTone(status: CommunicationStatus) {
  switch (status) {
    case 'replied':
    case 'received':
      return 'bg-emerald-100 text-emerald-700'
    case 'left_voicemail':
    case 'no_response':
      return 'bg-amber-100 text-amber-700'
    case 'sent':
      return 'bg-sky-100 text-sky-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function channelTone(channel: CommunicationChannel) {
  switch (channel) {
    case 'phone':
      return 'bg-violet-100 text-violet-700'
    case 'text':
      return 'bg-amber-100 text-amber-700'
    case 'meeting':
      return 'bg-cyan-100 text-cyan-700'
    default:
      return 'bg-sky-100 text-sky-700'
  }
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateTime: string) {
  return new Date(dateTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateTime: string) {
  return new Date(dateTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
