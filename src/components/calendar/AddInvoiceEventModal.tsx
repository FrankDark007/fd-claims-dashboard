import { useEffect, useState, Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import type { Project } from '../../types/claim'

interface AddInvoiceEventModalProps {
  open: boolean
  onClose: () => void
  projects: Project[]
  preselectedProjectId?: string
  preselectedDate?: string
  initialEvent?: {
    projectId: string
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    recipient?: string
    notes?: string
  } | null
  title?: string
  submitLabel?: string
  onSubmit: (params: {
    projectId: string
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
    recipient?: string
  }) => Promise<void>
}

const EVENT_TYPES = [
  { value: 'sent', label: 'Invoice Sent', color: 'bg-blue-100 text-blue-700' },
  { value: 'reminder', label: 'Reminder Sent', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'paid', label: 'Payment Received', color: 'bg-green-100 text-green-700' },
  { value: 'disputed', label: 'Disputed', color: 'bg-red-100 text-red-700' },
] as const

export default function AddInvoiceEventModal({
  open,
  onClose,
  projects,
  preselectedProjectId,
  preselectedDate,
  initialEvent = null,
  title = 'Add Invoice Event',
  submitLabel = 'Add Event',
  onSubmit,
}: AddInvoiceEventModalProps) {
  const [projectId, setProjectId] = useState(preselectedProjectId || '')
  const [type, setType] = useState<'sent' | 'reminder' | 'paid' | 'disputed'>('sent')
  const [date, setDate] = useState(preselectedDate || new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-fill amount from selected project
  const selectedProject = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (!open) {
      return
    }

    if (initialEvent) {
      setProjectId(initialEvent.projectId)
      setType(initialEvent.type)
      setDate(initialEvent.date)
      setAmount(initialEvent.amount.toString())
      setRecipient(initialEvent.recipient || '')
      setNotes(initialEvent.notes || '')
      return
    }

    setProjectId(preselectedProjectId || '')
    setType('sent')
    setDate(preselectedDate || new Date().toISOString().split('T')[0])
    setRecipient('')
    setNotes('')
    setAmount('')
  }, [open, preselectedProjectId, preselectedDate, initialEvent])

  useEffect(() => {
    if (!open || !selectedProject) {
      return
    }

    if (!amount && selectedProject.amount) {
      setAmount(selectedProject.amount.toString())
    }

    if (!recipient) {
      setRecipient(selectedProject.adjusterEmail || selectedProject.adjusterName || selectedProject.pmEmail || '')
    }
  }, [open, selectedProject, amount, recipient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !amount) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        projectId,
        type,
        date,
        amount: parseFloat(amount),
        recipient: recipient || undefined,
        notes: notes || undefined,
      })
      // Reset form
      setProjectId('')
      setType('sent')
      setAmount('')
      setRecipient('')
      setNotes('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CurrencyDollarIcon className="size-6 text-green-600" />
                </div>
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900 text-center mb-5">
                  {title}
                </DialogTitle>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Project selector */}
                  <div>
                    <label htmlFor="event-project" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <select
                      id="event-project"
                      value={projectId}
                      onChange={(e) => {
                        if (initialEvent) {
                          return
                        }
                        setProjectId(e.target.value)
                        const p = projects.find(proj => proj.id === e.target.value)
                        if (p?.amount && !amount) setAmount(p.amount.toString())
                      }}
                      required
                      disabled={Boolean(initialEvent)}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                    >
                      <option value="">Select a project...</option>
                      {projects
                        .filter(p => !p.done)
                        .sort((a, b) => a.clientName.localeCompare(b.clientName))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.clientName} {p.projectName ? `— ${p.projectName}` : ''} {p.amount ? `($${p.amount.toLocaleString()})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Event type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map((et) => (
                        <button
                          key={et.value}
                          type="button"
                          onClick={() => setType(et.value)}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                            type === et.value
                              ? `${et.color} ring-2 ring-offset-1 ring-gray-400`
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {et.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date + Amount row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        id="event-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="event-amount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                        <input
                          id="event-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          placeholder={selectedProject?.amount?.toString() || '0.00'}
                          className="block w-full rounded-md border-gray-300 py-2 pl-7 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="event-recipient" className="block text-sm font-medium text-gray-700">
                      Recipient <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="event-recipient"
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Adjuster, PM, carrier, or client"
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="event-notes" className="block text-sm font-medium text-gray-700">
                      Notes <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      id="event-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Sent via email, check #1234, etc."
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !projectId || !amount}
                      className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : submitLabel}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
