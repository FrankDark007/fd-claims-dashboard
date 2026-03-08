import { type ReactNode, useEffect, useState } from 'react'
import {
  BanknotesIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  FINAL_INVOICE_STATUSES,
  INVOICE_STATUSES,
  type InvoiceEvent,
  type Project,
  type ProjectWriteInput,
} from '../../shared/projects'

interface FinancialsTabProps {
  project: Project
  invoiceEvents: InvoiceEvent[]
  onSaveProject: (input: ProjectWriteInput) => Promise<unknown>
  onCreateInvoiceEvent: (input: {
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
    recipient?: string
  }) => Promise<unknown>
}

interface FinancialFormState {
  invoiceId: string
  amount: string
  invoiceStatus: Project['invoiceStatus']
  finalInvoiceStatus: Project['finalInvoiceStatus']
  invoiceSentDate: string
  dueDate: string
  nextFollowUpDate: string
  paymentReceivedDate: string
  carrier: string
}

interface ContactFormState {
  projectManagerName: string
  pmEmail: string
  pmPhone: string
  adjusterName: string
  adjusterEmail: string
  adjusterPhone: string
}

type FollowUpState = {
  tone: string
  label: string
  detail: string
}

export default function FinancialsTab({
  project,
  invoiceEvents,
  onSaveProject,
  onCreateInvoiceEvent,
}: FinancialsTabProps) {
  const [financialForm, setFinancialForm] = useState<FinancialFormState>(buildFinancialForm(project))
  const [contactForm, setContactForm] = useState<ContactFormState>(buildContactForm(project))
  const [savingSection, setSavingSection] = useState<'financials' | 'contacts' | 'actions' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    setFinancialForm(buildFinancialForm(project))
    setContactForm(buildContactForm(project))
  }, [project])

  const lastReminder = invoiceEvents.find((event) => event.type === 'reminder') ?? null
  const followUp = getFollowUpState(project, lastReminder?.eventDate ?? null)

  const saveFinancials = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingSection('financials')
    setError(null)
    setSuccessMessage(null)

    try {
      await onSaveProject({
        invoiceId: parseNumberField(financialForm.invoiceId),
        amount: parseNumberField(financialForm.amount),
        invoiceStatus: financialForm.invoiceStatus,
        finalInvoiceStatus: financialForm.finalInvoiceStatus,
        invoiceSentDate: parseDateField(financialForm.invoiceSentDate),
        dueDate: parseDateField(financialForm.dueDate),
        nextFollowUpDate: parseDateField(financialForm.nextFollowUpDate),
        paymentReceivedDate: parseDateField(financialForm.paymentReceivedDate),
        carrier: financialForm.carrier,
      })
      setSuccessMessage('Financial details saved.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save financial details')
    } finally {
      setSavingSection(null)
    }
  }

  const saveContacts = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingSection('contacts')
    setError(null)
    setSuccessMessage(null)

    try {
      await onSaveProject(contactForm)
      setSuccessMessage('Contacts saved.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save contacts')
    } finally {
      setSavingSection(null)
    }
  }

  const updateFollowUpDate = async (nextFollowUpDate: string | null, successLabel: string) => {
    setSavingSection('actions')
    setError(null)
    setSuccessMessage(null)

    try {
      await onSaveProject({ nextFollowUpDate })
      setSuccessMessage(successLabel)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update follow-up date')
    } finally {
      setSavingSection(null)
    }
  }

  const logReminder = async () => {
    setSavingSection('actions')
    setError(null)
    setSuccessMessage(null)

    try {
      await onCreateInvoiceEvent({
        type: 'reminder',
        date: new Date().toISOString().slice(0, 10),
        amount: project.amount ?? 0,
        recipient: project.adjusterEmail || project.adjusterName || project.pmEmail || project.projectManagerName,
        notes: 'Collections follow-up logged from the project detail view.',
      })
      setSuccessMessage('Reminder logged and next follow-up moved out seven days.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log reminder')
    } finally {
      setSavingSection(null)
    }
  }

  const markPaid = async () => {
    setSavingSection('actions')
    setError(null)
    setSuccessMessage(null)

    try {
      await onCreateInvoiceEvent({
        type: 'paid',
        date: new Date().toISOString().slice(0, 10),
        amount: project.amount ?? 0,
        recipient: project.clientName,
        notes: 'Payment recorded from the project detail view.',
      })
      setSuccessMessage('Payment recorded.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSavingSection(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-6 py-5 shadow-sm ${followUp.tone}`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Collections</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{followUp.label}</h3>
            <p className="mt-1 text-sm text-secondary">{followUp.detail}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[23rem]">
            <ActionButton
              label="Follow Up Today"
              onClick={() => void updateFollowUpDate(new Date().toISOString().slice(0, 10), 'Next follow-up set for today.')}
              disabled={savingSection === 'actions'}
            />
            <ActionButton
              label="Push 7 Days"
              onClick={() => void updateFollowUpDate(addDaysFromToday(7), 'Next follow-up pushed out seven days.')}
              disabled={savingSection === 'actions'}
            />
            <ActionButton
              label="Log Reminder"
              onClick={() => void logReminder()}
              disabled={savingSection === 'actions'}
            />
            <ActionButton
              label="Mark Paid"
              onClick={() => void markPaid()}
              disabled={savingSection === 'actions' || project.invoiceStatus === 'Paid'}
            />
          </div>
        </div>
        {(error || successMessage) && (
          <p className={`mt-4 text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>
            {error ?? successMessage}
          </p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
        <form onSubmit={saveFinancials} className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BanknotesIcon className="size-5 text-primary" />
            Invoice Summary
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InputField
              label="Invoice ID"
              value={financialForm.invoiceId}
              onChange={(value) => setFinancialForm((current) => ({ ...current, invoiceId: value }))}
              inputMode="numeric"
            />
            <InputField
              label="Amount"
              value={financialForm.amount}
              onChange={(value) => setFinancialForm((current) => ({ ...current, amount: value }))}
              inputMode="decimal"
              placeholder="0.00"
            />
            <SelectField
              label="Invoice Status"
              value={financialForm.invoiceStatus ?? ''}
              onChange={(value) => setFinancialForm((current) => ({
                ...current,
                invoiceStatus: value === '' ? null : value as Project['invoiceStatus'],
              }))}
              options={INVOICE_STATUSES}
            />
            <SelectField
              label="Final Invoice"
              value={financialForm.finalInvoiceStatus ?? ''}
              onChange={(value) => setFinancialForm((current) => ({
                ...current,
                finalInvoiceStatus: value === '' ? null : value as Project['finalInvoiceStatus'],
              }))}
              options={FINAL_INVOICE_STATUSES}
            />
            <DateField
              label="Invoice Sent"
              value={financialForm.invoiceSentDate}
              onChange={(value) => setFinancialForm((current) => ({ ...current, invoiceSentDate: value }))}
            />
            <DateField
              label="Due Date"
              value={financialForm.dueDate}
              onChange={(value) => setFinancialForm((current) => ({ ...current, dueDate: value }))}
            />
            <DateField
              label="Next Follow-up"
              value={financialForm.nextFollowUpDate}
              onChange={(value) => setFinancialForm((current) => ({ ...current, nextFollowUpDate: value }))}
            />
            <DateField
              label="Payment Received"
              value={financialForm.paymentReceivedDate}
              onChange={(value) => setFinancialForm((current) => ({ ...current, paymentReceivedDate: value }))}
            />
            <InputField
              label="Carrier"
              value={financialForm.carrier}
              onChange={(value) => setFinancialForm((current) => ({ ...current, carrier: value }))}
            />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDaysIcon className="size-5 text-primary" />
              Recent Activity
            </div>
            {invoiceEvents.length === 0 ? (
              <p className="mt-3 text-sm text-secondary">No invoice events recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {invoiceEvents.slice(0, 4).map((event) => (
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

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={savingSection === 'financials'}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
            >
              {savingSection === 'financials' ? 'Saving...' : 'Save Financials'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BellAlertIcon className="size-5 text-primary" />
              Collections Snapshot
            </div>
            <div className="mt-4 space-y-3">
              <Metric label="Outstanding" value={project.invoiceStatus === 'Paid' ? '$0' : formatCurrency(project.amount)} />
              <Metric label="Due Date" value={formatDate(project.dueDate)} />
              <Metric label="Next Follow-up" value={formatDate(project.nextFollowUpDate)} />
              <Metric label="Last Reminder" value={formatDate(lastReminder?.eventDate ?? null)} />
            </div>
          </div>

          <form onSubmit={saveContacts} className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCircleIcon className="size-5 text-primary" />
              Contacts
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <PhoneIcon className="size-4 text-primary" />
                  Project Manager
                </div>
                <div className="mt-3 grid gap-4">
                  <InputField
                    label="Name"
                    value={contactForm.projectManagerName}
                    onChange={(value) => setContactForm((current) => ({ ...current, projectManagerName: value }))}
                  />
                  <InputField
                    label="Email"
                    value={contactForm.pmEmail}
                    onChange={(value) => setContactForm((current) => ({ ...current, pmEmail: value }))}
                    type="email"
                  />
                  <InputField
                    label="Phone"
                    value={contactForm.pmPhone}
                    onChange={(value) => setContactForm((current) => ({ ...current, pmPhone: value }))}
                    type="tel"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <PhoneIcon className="size-4 text-primary" />
                  Adjuster
                </div>
                <div className="mt-3 grid gap-4">
                  <InputField
                    label="Name"
                    value={contactForm.adjusterName}
                    onChange={(value) => setContactForm((current) => ({ ...current, adjusterName: value }))}
                  />
                  <InputField
                    label="Email"
                    value={contactForm.adjusterEmail}
                    onChange={(value) => setContactForm((current) => ({ ...current, adjusterEmail: value }))}
                    type="email"
                  />
                  <InputField
                    label="Phone"
                    value={contactForm.adjusterPhone}
                    onChange={(value) => setContactForm((current) => ({ ...current, adjusterPhone: value }))}
                    type="tel"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={savingSection === 'contacts'}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
              >
                {savingSection === 'contacts' ? 'Saving...' : 'Save Contacts'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function buildFinancialForm(project: Project): FinancialFormState {
  return {
    invoiceId: project.invoiceId?.toString() ?? '',
    amount: project.amount?.toString() ?? '',
    invoiceStatus: project.invoiceStatus,
    finalInvoiceStatus: project.finalInvoiceStatus,
    invoiceSentDate: project.invoiceSentDate ?? '',
    dueDate: project.dueDate ?? '',
    nextFollowUpDate: project.nextFollowUpDate ?? '',
    paymentReceivedDate: project.paymentReceivedDate ?? '',
    carrier: project.carrier,
  }
}

function buildContactForm(project: Project): ContactFormState {
  return {
    projectManagerName: project.projectManagerName,
    pmEmail: project.pmEmail,
    pmPhone: project.pmPhone,
    adjusterName: project.adjusterName,
    adjusterEmail: project.adjusterEmail,
    adjusterPhone: project.adjusterPhone,
  }
}

function getFollowUpState(project: Project, lastReminderDate: string | null): FollowUpState {
  if (project.invoiceStatus === 'Paid' || project.paymentReceivedDate) {
    return {
      tone: 'border-green-200 bg-green-50',
      label: 'Collected',
      detail: project.paymentReceivedDate
        ? `Payment received on ${formatDate(project.paymentReceivedDate)}.`
        : 'Payment has been marked as received.',
    }
  }

  if (!project.invoiceSentDate) {
    return {
      tone: 'border-gray-200 bg-gray-50',
      label: 'Invoice still in draft',
      detail: 'Set the invoice sent date to start aging and follow-up scheduling.',
    }
  }

  const nextFollowUpDate = project.nextFollowUpDate ?? project.dueDate
  if (!nextFollowUpDate) {
    return {
      tone: 'border-yellow-200 bg-yellow-50',
      label: 'No follow-up scheduled',
      detail: 'This project has an invoice sent date but no collections follow-up date.',
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const daysUntilFollowUp = dateDiffInDays(nextFollowUpDate, today)
  const reminderDetail = lastReminderDate ? ` Last reminder: ${formatDate(lastReminderDate)}.` : ''

  if (daysUntilFollowUp > 0) {
    return {
      tone: 'border-blue-200 bg-blue-50',
      label: `${daysUntilFollowUp} day${daysUntilFollowUp === 1 ? '' : 's'} until next follow-up`,
      detail: `Next follow-up is scheduled for ${formatDate(nextFollowUpDate)}.${reminderDetail}`,
    }
  }

  if (daysUntilFollowUp === 0) {
    return {
      tone: 'border-orange-200 bg-orange-50',
      label: 'Follow up today',
      detail: `Collections touchpoint is due today.${reminderDetail}`,
    }
  }

  const overdueDays = Math.abs(daysUntilFollowUp)
  return {
    tone: 'border-red-200 bg-red-50',
    label: `${overdueDays} day${overdueDays === 1 ? '' : 's'} past follow-up`,
    detail: `Next follow-up was scheduled for ${formatDate(nextFollowUpDate)}.${reminderDetail}`,
  }
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Unset</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  )
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
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

function parseDateField(value: string): string | null {
  return value.trim() === '' ? null : value
}

function parseNumberField(value: string): number | null {
  if (value.trim() === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

function formatCurrency(amount: number | null) {
  if (amount == null) {
    return '—'
  }

  return `$${amount.toLocaleString()}`
}

function dateDiffInDays(targetDate: string, startDate: string) {
  return Math.floor(
    (new Date(`${targetDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86400000
  )
}

function addDaysFromToday(days: number) {
  const today = new Date()
  today.setDate(today.getDate() + days)
  return today.toISOString().slice(0, 10)
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
