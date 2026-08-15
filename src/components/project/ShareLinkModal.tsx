import { useState, useEffect, Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowTopRightOnSquareIcon, LinkIcon, ClipboardDocumentIcon, CheckIcon, EyeIcon } from '@heroicons/react/24/outline'

interface ShareLinkView {
  id: string
  ipAddress: string
  userAgent: string
  viewedAt: string
}

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
  { value: 2160, label: '90 days' },
  { value: 4320, label: '6 months' },
  { value: 8760, label: '1 year' },
]

export default function ShareLinkModal({ open, onClose, projectId, fileId, fileName, token }: ShareLinkModalProps) {
  const [expiresInHours, setExpiresInHours] = useState(720) // default 30 days
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [views, setViews] = useState<ShareLinkView[]>([])
  const [showViews, setShowViews] = useState(false)
  const [loadingViews, setLoadingViews] = useState(false)

  // Load view history when modal opens
  useEffect(() => {
    if (!open || !projectId || !fileId || !token) return

    const controller = new AbortController()
    setViews([])
    setLoadingViews(true)
    fetch(`/api/projects/${projectId}/share?fileId=${encodeURIComponent(fileId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load view history')
        return res.json()
      })
      .then((data) => setViews((data as { views: ShareLinkView[] }).views || []))
      .catch(() => {
        if (!controller.signal.aborted) setViews([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingViews(false)
      })

    return () => controller.abort()
  }, [open, projectId, fileId, token])

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

      const data = await res.json() as { shareUrl: string; expiresAt: string }
      setShareUrl(data.shareUrl)
      setExpiresAt(data.expiresAt)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed. Select the link and copy it manually.')
    }
  }

  const handleClose = () => {
    setShareUrl(null)
    setExpiresAt(null)
    setCopied(false)
    setError(null)
    setShowViews(false)
    setViews([])
    onClose()
  }

  const formatViewDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const parseUserAgent = (ua: string) => {
    if (!ua) return 'Unknown'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'Mac'
    if (ua.includes('Linux')) return 'Linux'
    return 'Other'
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
                      <p className="mt-1 text-xs text-gray-400">
                        Adjusters may take months to review. 30 days or longer recommended.
                      </p>
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
                    {expiresAt && (
                      <p className="text-center text-xs text-gray-500">
                        Expires on {new Date(expiresAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <ArrowTopRightOnSquareIcon className="size-4" />
                          Open Link
                        </span>
                      </a>
                      <button
                        onClick={handleClose}
                        className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                {/* View History Section */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowViews(!showViews)}
                    className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <EyeIcon className="size-4" />
                      View History
                      {views.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {views.length}
                        </span>
                      )}
                    </span>
                    <svg
                      className={`size-4 transition-transform ${showViews ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {showViews && (
                    <div className="mt-3">
                      {loadingViews ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      ) : views.length === 0 ? (
                        <p className="py-3 text-center text-sm text-gray-400">No views recorded yet.</p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="pb-2 pr-3 text-left font-medium text-gray-500">When</th>
                                <th className="pb-2 pr-3 text-left font-medium text-gray-500">Network</th>
                                <th className="pb-2 text-left font-medium text-gray-500">Device</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {views.map((view) => (
                                <tr key={view.id}>
                                  <td className="py-1.5 pr-3 text-gray-700">{formatViewDate(view.viewedAt)}</td>
                                  <td className="py-1.5 pr-3 font-mono text-gray-600">{view.ipAddress || '—'}</td>
                                  <td className="py-1.5 text-gray-600">{parseUserAgent(view.userAgent)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
