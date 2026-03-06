import type { ReactNode } from 'react'
import { BanknotesIcon, BellAlertIcon, CalendarDaysIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import StatusPill from '../StatusPill'
import type { Project } from '../../types/claim'
import type { InvoiceEvent } from '../../hooks/useProject'

interface FinancialsTabProps {
  project: Project
  invoiceEvents: InvoiceEvent[]
}

type FollowUpState = {
  tone: string
  label: string
  detail: string
}

export default function FinancialsTab({ project, invoiceEvents }: FinancialsTabProps) {
  const followUp = getFollowUpState(project)

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-6 py-5 shadow-sm ${followUp.tone}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Collections</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{followUp.label}</h3>
            <p className="mt-1 text-sm text-secondary">{followUp.detail}</p>
          </div>
          <BellAlertIcon className="size-6 shrink-0 opacity-70" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BanknotesIcon className="size-5 text-primary" />
            Invoice Summary
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Metric label="Amount" value={project.amount ? `$${project.amount.toLocaleString()}` : '—'} />
            <Metric label="Invoice Status" value={<StatusPill value={project.invoiceStatus} size="md" />} />
            <Metric label="Invoice Sent" value={formatDate(project.invoiceSentDate)} />
            <Metric label="Due Date" value={formatDate(project.dueDate)} />
            <Metric label="Payment Received" value={formatDate(project.paymentReceivedDate)} />
            <Metric label="Final Invoice" value={<StatusPill value={project.finalInvoiceStatus} size="md" />} />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDaysIcon className="size-5 text-primary" />
              Invoice Activity
            </div>
            {invoiceEvents.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No invoice events recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {invoiceEvents.slice(0, 6).map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${eventTone(event.type)}`}>
                          {eventLabel(event.type)}
                        </span>
                        <span className="text-sm font-medium text-foreground">${event.amount.toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm text-secondary">
                        {event.recipient || 'Internal update'}
                        {event.notes ? ` • ${event.notes}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <div>{formatDate(event.eventDate)}</div>
                      <div className="mt-1">{event.createdBy}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <ContactCard
            title="Project Manager"
            name={project.projectManagerName}
            email={project.pmEmail}
            phone={project.pmPhone}
          />
          <ContactCard
            title="Adjuster"
            name={project.adjusterName}
            email={project.adjusterEmail}
            phone={project.adjusterPhone}
          />
        </section>
      </div>
    </div>
  )
}

function getFollowUpState(project: Project): FollowUpState {
  if (project.invoiceStatus === 'Paid' || project.paymentReceivedDate) {
    return {
      tone: 'border-green-200 bg-green-50',
      label: 'Collected',
      detail: project.paymentReceivedDate
        ? `Payment received on ${formatDate(project.paymentReceivedDate)}.`
        : 'Payment has been marked as received.',
    }
  }

  if (project.invoiceStatus === 'Draft') {
    return {
      tone: 'border-gray-200 bg-gray-50',
      label: 'Invoice still in draft',
      detail: 'Collections follow-up starts after the invoice is sent.',
    }
  }

  if (!project.dueDate && project.invoiceSentDate) {
    return {
      tone: 'border-yellow-200 bg-yellow-50',
      label: 'Due date missing',
      detail: `Invoice was sent on ${formatDate(project.invoiceSentDate)} but no due date is set.`,
    }
  }

  if (!project.invoiceSentDate && !project.dueDate) {
    return {
      tone: 'border-gray-200 bg-gray-50',
      label: 'No follow-up date yet',
      detail: 'Set an invoice sent date to establish the default 30-day due date.',
    }
  }

  const dueDate = project.dueDate ?? project.invoiceSentDate
  if (!dueDate) {
    return {
      tone: 'border-gray-200 bg-gray-50',
      label: 'No follow-up date yet',
      detail: 'This project does not have a due date.',
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const days = Math.floor((new Date(`${dueDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000)

  if (days > 0) {
    return {
      tone: 'border-blue-200 bg-blue-50',
      label: `${days} day${days === 1 ? '' : 's'} until follow-up`,
      detail: `Due on ${formatDate(dueDate)}.`,
    }
  }

  if (days === 0) {
    return {
      tone: 'border-orange-200 bg-orange-50',
      label: 'Due today',
      detail: 'This invoice is due today and should be followed up immediately.',
    }
  }

  const overdueDays = Math.abs(days)
  return {
    tone: 'border-red-200 bg-red-50',
    label: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
    detail: `Invoice was due on ${formatDate(dueDate)}.`,
  }
}

function ContactCard({ title, name, email, phone }: { title: string; name: string; email: string; phone: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <UserCircleIcon className="size-5 text-primary" />
        {title}
      </div>
      <div className="mt-4 space-y-3">
        <Metric label="Name" value={name || '—'} />
        <Metric label="Email" value={email || '—'} />
        <Metric label="Phone" value={phone || '—'} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-2 text-sm text-foreground">{value}</div>
    </div>
  )
}

function formatDate(date: string | null) {
  if (!date) {
    return '—'
  }

  return new Date(date).toLocaleDateString('en-US', {
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

function eventTone(type: InvoiceEvent['type']) {
  switch (type) {
    case 'sent':
      return 'bg-blue-100 text-blue-700'
    case 'reminder':
      return 'bg-yellow-100 text-yellow-800'
    case 'paid':
      return 'bg-green-100 text-green-700'
    case 'disputed':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
