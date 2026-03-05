import { CheckCircleIcon } from '@heroicons/react/24/solid'
import type { Claim } from '../../types/claim'
import type { InvoiceEvent } from '../../hooks/useProject'

interface TimelineTabProps {
  project: Claim
  invoiceEvents: InvoiceEvent[]
}

interface ActivityItem {
  id: string
  type: 'status' | 'invoice' | 'system'
  description: string
  person?: string
  date: string
  isCompleted?: boolean
}

function buildTimeline(project: Claim, invoiceEvents: InvoiceEvent[]): ActivityItem[] {
  const items: ActivityItem[] = []

  // Project creation
  if (project.dateAdded) {
    items.push({
      id: 'created',
      type: 'system',
      description: 'Project created',
      date: project.dateAdded,
    })
  }

  // Status milestones
  if (project.contract === 'Signed') {
    items.push({ id: 'contract', type: 'status', description: 'Contract signed', date: project.dateAdded || '', isCompleted: true })
  }
  if (project.coc === 'Signed') {
    items.push({ id: 'coc', type: 'status', description: 'Certificate of Completion signed', date: project.dateAdded || '', isCompleted: true })
  }
  if (project.status === 'Paid') {
    items.push({ id: 'paid', type: 'status', description: 'Invoice paid', date: project.dateAdded || '', isCompleted: true })
  }

  // Invoice events from KV
  for (const event of invoiceEvents) {
    items.push({
      id: event.id,
      type: 'invoice',
      description: `Invoice ${event.type}: $${event.amount.toLocaleString()}${event.notes ? ` — ${event.notes}` : ''}`,
      person: event.createdBy,
      date: event.date,
      isCompleted: event.type === 'paid',
    })
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return items
}

export default function TimelineTab({ project, invoiceEvents }: TimelineTabProps) {
  const timeline = buildTimeline(project, invoiceEvents)

  if (timeline.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow px-6 py-14 text-center">
        <p className="text-sm text-muted">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white shadow p-6">
      <ul role="list" className="space-y-6">
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
                <div className="size-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
              )}
            </div>
            <div className="flex-auto">
              <p className="text-sm/6 text-secondary">
                {item.person && <span className="font-medium text-foreground">{item.person} </span>}
                {item.description}
              </p>
              <time className="text-xs text-muted">
                {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
