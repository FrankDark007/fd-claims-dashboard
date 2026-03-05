import { useState, Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { LinkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ShareLinkModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  fileId: string
  fileName: string
  token: string
}

const EXPIRY_OPTIONS = [
  { value: 24, label: '24 hours' },
  { value: 72, label: '3 days' },
  { value: 168, label: '7 days' },
  { value: 720, label: '30 days' },
]

export default function ShareLinkModal({ open, onClose, projectId, fileId, fileName, token }: ShareLinkModalProps) {
  const [expiresInHours, setExpiresInHours] = useState(72)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createShareLink = async () => {
    setCreating(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, expiresInHours }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create link' }))
        throw new Error((err as { error: string }).error)
      }

      const data = await res.json() as { shareUrl: string }
      setShareUrl(data.shareUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setShareUrl(null)
    setCopied(false)
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
                <div>
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
                    <LinkIcon className="size-6 text-primary" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                      Share File
                    </DialogTitle>
                    <p className="mt-1 text-sm text-gray-500 truncate">{fileName}</p>
                  </div>
                </div>

                {!shareUrl ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
                        Link expires after
                      </label>
                      <select
                        id="expiry"
                        value={expiresInHours}
                        onChange={(e) => setExpiresInHours(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                      >
                        {EXPIRY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createShareLink}
                        disabled={creating}
                        className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                      >
                        {creating ? 'Creating...' : 'Create Link'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 p-3">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 border-0 bg-transparent text-sm text-gray-700 focus:ring-0"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <CheckIcon className="size-5 text-green-600" />
                        ) : (
                          <ClipboardDocumentIcon className="size-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Anyone with this link can download the file. Link expires in{' '}
                      {EXPIRY_OPTIONS.find(o => o.value === expiresInHours)?.label || `${expiresInHours}h`}.
                    </p>
                    <button
                      onClick={handleClose}
                      className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
                    >
                      Done
                    </button>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
