import { useState } from 'react'
import { EnvelopeIcon, XMarkIcon, ClipboardIcon, CheckIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { useAiDraftEmail } from '../hooks/useAI'

interface SendReminderButtonProps {
  projectId: string
  clientName: string
  claimNumber?: string
  token: string
}

export default function SendReminderButton({ projectId, clientName, claimNumber, token }: SendReminderButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { draft, loading, error, generateDraft } = useAiDraftEmail(token)

  const handleClick = async () => {
    setOpen(true)
    if (!draft) {
      await generateDraft(projectId, 'reminder')
    }
  }

  const handleCopy = async () => {
    if (!draft) return
    const text = `Subject: ${draft.subject}\nTo: ${draft.to}\n\n${draft.body}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const gmailUrl = draft
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(draft.to)}&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
    : null

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
      >
        <EnvelopeIcon className="size-3.5" />
        Send reminder
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Send Reminder</h3>
            <p className="mt-1 text-sm text-slate-500">
              {clientName}{claimNumber ? ` · ${claimNumber}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Generating draft...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {draft && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">To</label>
                  <p className="mt-1 text-sm text-slate-900">{draft.to}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</label>
                  <p className="mt-1 text-sm text-slate-900">{draft.subject}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Body</label>
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                    {draft.body}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {copied ? <CheckIcon className="size-4 text-emerald-600" /> : <ClipboardIcon className="size-4" />}
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </button>
                {gmailUrl && (
                  <a
                    href={gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                  >
                    <ArrowTopRightOnSquareIcon className="size-4" />
                    Open in Gmail
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
