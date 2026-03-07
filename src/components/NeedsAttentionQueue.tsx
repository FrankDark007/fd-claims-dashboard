import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { AttentionItem } from '../hooks/useNeedsAttention'
import SendReminderButton from './SendReminderButton'

interface NeedsAttentionQueueProps {
  items: AttentionItem[]
  token: string
  onCompleteTask: (taskId: string, projectId: string) => Promise<void>
  onDismissAlert: (alertId: string) => void
}

const urgencyStyles = {
  critical: 'border-l-rose-500 bg-rose-50/50',
  warning: 'border-l-amber-500 bg-amber-50/50',
  info: 'border-l-blue-500 bg-blue-50/50',
}

const urgencyDot = {
  critical: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

export default function NeedsAttentionQueue({
  items,
  token,
  onCompleteTask,
  onDismissAlert,
}: NeedsAttentionQueueProps) {
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())

  const handleComplete = useCallback(async (taskId: string, projectId: string, itemId: string) => {
    setCompletingIds((prev) => new Set(prev).add(itemId))
    try {
      await onCompleteTask(taskId, projectId)
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }, [onCompleteTask])

  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader count={0} />
        <div className="py-12 text-center text-sm text-slate-500">
          Nothing needs your attention right now. Nice work!
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeader count={items.length} />

      <ul className="mt-5 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border border-l-4 border-slate-200 p-4 transition hover:shadow-sm ${urgencyStyles[item.urgency]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${urgencyDot[item.urgency]}`} />
                  <Link
                    to={`/projects/${item.projectId}`}
                    className="text-sm font-semibold text-slate-900 hover:text-primary"
                  >
                    {item.title}
                  </Link>
                </div>
                {item.subtitle && (
                  <p className="mt-1 pl-4 text-xs text-slate-500">{item.subtitle}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {item.type === 'followup' && (
                  <SendReminderButton
                    projectId={item.projectId}
                    clientName={item.clientName}
                    claimNumber={item.context}
                    token={token}
                  />
                )}

                {item.type === 'task' && item.data.task && (
                  <button
                    type="button"
                    onClick={() => handleComplete(item.data.task!.id, item.projectId, item.id)}
                    disabled={completingIds.has(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <CheckIcon className="size-3.5" />
                    {completingIds.has(item.id) ? 'Saving...' : 'Complete'}
                  </button>
                )}

                {item.type === 'email' && (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/projects/${item.projectId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <EyeIcon className="size-3.5" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => item.data.alert && onDismissAlert(item.data.alert.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <XMarkIcon className="size-3.5" />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SectionHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Needs attention</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950">
          {count === 0 ? 'All clear' : `${count} item${count === 1 ? '' : 's'} need action`}
        </h3>
      </div>
      {count > 0 && (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
          {count}
        </span>
      )}
    </div>
  )
}
