import { useState, Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { FolderPlusIcon } from '@heroicons/react/24/outline'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  token: string
  onCreated: () => void
}

const PROJECT_TYPES = ['Water Mitigation', 'Pack-out', 'Mold Remediation']

export default function CreateProjectModal({ open, onClose, token, onCreated }: CreateProjectModalProps) {
  const [clientName, setClientName] = useState('')
  const [project, setProject] = useState('')
  const [projectType, setProjectType] = useState('')
  const [amount, setAmount] = useState('')
  const [xactimateNumber, setXactimateNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [companyCam, setCompanyCam] = useState('')
  const [driveFolder, setDriveFolder] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setClientName('')
    setProject('')
    setProjectType('')
    setAmount('')
    setXactimateNumber('')
    setNotes('')
    setCompanyCam('')
    setDriveFolder('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName.trim().replace(/\b\w/g, c => c.toUpperCase()),
          projectName: project.trim() || undefined,
          projectType: projectType || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          xactimateNumber: xactimateNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          companyCamUrl: companyCam.trim() || undefined,
          driveFolderUrl: driveFolder.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create project' }))
        throw new Error((err as { error: string }).error)
      }

      resetForm()
      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      resetForm()
      onClose()
    }
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
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <FolderPlusIcon className="size-6 text-primary" />
                </div>
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900 text-center mb-5">
                  Create New Project
                </DialogTitle>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Client Name — required */}
                  <div>
                    <label htmlFor="cp-client" className="block text-sm font-medium text-gray-700">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cp-client"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      placeholder="e.g., John Smith"
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                    />
                  </div>

                  {/* Project + Type row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cp-project" className="block text-sm font-medium text-gray-700">
                        Project / Address
                      </label>
                      <input
                        id="cp-project"
                        type="text"
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        placeholder="123 Main St"
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="cp-type" className="block text-sm font-medium text-gray-700">
                        Project Type
                      </label>
                      <select
                        id="cp-type"
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      >
                        <option value="">Select...</option>
                        {PROJECT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Amount + Xactimate row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cp-amount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                        <input
                          id="cp-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="block w-full rounded-md border-gray-300 py-2 pl-7 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="cp-xact" className="block text-sm font-medium text-gray-700">
                        Xactimate #
                      </label>
                      <input
                        id="cp-xact"
                        type="text"
                        value={xactimateNumber}
                        onChange={(e) => setXactimateNumber(e.target.value)}
                        placeholder="XA-12345"
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Links row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cp-cam" className="block text-sm font-medium text-gray-700">
                        CompanyCam URL
                      </label>
                      <input
                        id="cp-cam"
                        type="url"
                        value={companyCam}
                        onChange={(e) => setCompanyCam(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="cp-drive" className="block text-sm font-medium text-gray-700">
                        Drive Folder URL
                      </label>
                      <input
                        id="cp-drive"
                        type="url"
                        value={driveFolder}
                        onChange={(e) => setDriveFolder(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="cp-notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="cp-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Initial notes about this project..."
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !clientName.trim()}
                      className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Project'}
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
