import { useState, useRef, Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { FolderPlusIcon, DocumentArrowUpIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { BUSINESS_CATEGORIES } from '../shared/projects'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  token: string
  onCreated: (projectId?: string) => void
}

const PROJECT_TYPES = ['Water Mitigation', 'Pack-out', 'Mold Remediation']

type CreateMode = 'manual' | 'contract'

interface ExtractedInfo {
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
}

export default function CreateProjectModal({ open, onClose, token, onCreated }: CreateProjectModalProps) {
  const [mode, setMode] = useState<CreateMode>('contract')

  // Manual form state
  const [clientName, setClientName] = useState('')
  const [project, setProject] = useState('')
  const [projectType, setProjectType] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [xactimateNumber, setXactimateNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [companyCam, setCompanyCam] = useState('')
  const [driveFolder, setDriveFolder] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contract upload state
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedInfo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setClientName('')
    setProject('')
    setProjectType('')
    setBusinessCategory('')
    setAmount('')
    setXactimateNumber('')
    setNotes('')
    setCompanyCam('')
    setDriveFolder('')
    setError(null)
    setContractFile(null)
    setExtracted(null)
    setMode('contract')
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
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
          businessCategory: businessCategory || undefined,
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

      const data = await res.json() as { project: { id: string } }
      resetForm()
      onCreated(data.project?.id)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContractUpload = async () => {
    if (!contractFile) return
    if (contractFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', contractFile)

      const res = await fetch('/api/projects/create-from-contract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to process contract' }))
        throw new Error((err as { error: string }).error)
      }

      const data = await res.json() as {
        project: { id: string }
        extracted: ExtractedInfo
      }

      setExtracted(data.extracted)

      // If extraction found a name, go straight to success
      if (data.extracted.clientName) {
        resetForm()
        onCreated(data.project.id)
        onClose()
      } else {
        // Show what was extracted so user can review
        setExtracted(data.extracted)
        resetForm()
        onCreated(data.project.id)
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process contract')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!submitting && !uploading) {
      resetForm()
      onClose()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setContractFile(file)
      setError(null)
    } else {
      setError('Please upload a PDF file.')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setContractFile(file)
        setError(null)
      } else {
        setError('Please upload a PDF file.')
      }
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
                  {mode === 'contract' ? (
                    <DocumentArrowUpIcon className="size-6 text-primary" />
                  ) : (
                    <FolderPlusIcon className="size-6 text-primary" />
                  )}
                </div>
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900 text-center mb-2">
                  Create New Project
                </DialogTitle>

                {/* Mode toggle */}
                <div className="mb-5 flex rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMode('contract')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                      mode === 'contract'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Upload Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                      mode === 'manual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Manual Entry
                  </button>
                </div>

                {mode === 'contract' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Upload a signed contract PDF. Client name, email, phone, and address will be extracted automatically.
                    </p>

                    {!contractFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                          isDragging
                            ? 'border-primary bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <CloudArrowUpIcon className="mx-auto size-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500">PDF contracts only, up to 10MB</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-red-50">
                              <DocumentArrowUpIcon className="size-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[280px]">
                                {contractFile.name}
                              </p>
                              <p className="text-xs text-gray-500">{formatSize(contractFile.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setContractFile(null)}
                            className="text-sm text-gray-400 hover:text-gray-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {extracted && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
                        <p className="text-xs font-semibold text-green-800">Extracted info:</p>
                        {extracted.clientName && <p className="text-sm text-green-700">Name: {extracted.clientName}</p>}
                        {extracted.clientEmail && <p className="text-sm text-green-700">Email: {extracted.clientEmail}</p>}
                        {extracted.clientPhone && <p className="text-sm text-green-700">Phone: {extracted.clientPhone}</p>}
                        {extracted.clientAddress && <p className="text-sm text-green-700">Address: {extracted.clientAddress}</p>}
                        {!extracted.clientName && !extracted.clientEmail && !extracted.clientPhone && !extracted.clientAddress && (
                          <p className="text-sm text-amber-700">No client info could be extracted. You can edit the project manually after creation.</p>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={uploading}
                        className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleContractUpload}
                        disabled={uploading || !contractFile}
                        className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                      >
                        {uploading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </span>
                        ) : (
                          'Create from Contract'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleManualSubmit} className="space-y-4">
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

                    {/* Business Category */}
                    <div>
                      <label htmlFor="cp-biz" className="block text-sm font-medium text-gray-700">
                        Business
                      </label>
                      <select
                        id="cp-biz"
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      >
                        <option value="">Select...</option>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
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
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
