import { Link } from 'react-router-dom'
import { EnvelopeIcon, CheckIcon } from '@heroicons/react/24/outline'
import type { GmailAlert } from '../hooks/useGmailAlerts'

interface GmailAlertPanelProps {
  alerts: GmailAlert[]
  loading: boolean
  onMarkAsRead: (alertIds: string[]) => void
}

const urgencyColors: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-rose-100 text-rose-700',
}

const urgencyLabels: Record<number, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
}

const roleLabels: Record<string, string> = {
  client: 'Client',
  adjuster: 'Adjuster',
  pm: 'PM',
  unknown: 'Unknown',
}

export default function GmailAlertPanel({ alerts, loading, onMarkAsRead }: GmailAlertPanelProps) {
  const unread = alerts.filter((a) => !a.read)
  const displayed = alerts.slice(0, 8)

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <EnvelopeIcon className="size-5 text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Gmail inbox</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="size-5 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Gmail inbox</p>
            {unread.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                {unread.length} new
              </span>
            )}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Inbound email alerts</h3>
          <p className="mt-2 text-sm text-slate-600">
            Emails automatically matched to projects by contact info.
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => onMarkAsRead(unread.map((a) => a.id))}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <CheckIcon className="size-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No email alerts yet. Inbound emails will appear here when matched to projects.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {displayed.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-2xl border p-4 transition ${
                alert.read
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-primary/30 bg-primary/[0.03]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${alert.read ? 'text-slate-700' : 'text-slate-950'}`}>
                      {alert.subject || '(No subject)'}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${urgencyColors[alert.urgency] || urgencyColors[1]}`}>
                      {urgencyLabels[alert.urgency] || 'Low'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{alert.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      From: <strong className="text-slate-700">{alert.fromName || alert.fromAddress}</strong>
                      {alert.matchRole !== 'unknown' && (
                        <span className="ml-1 text-slate-400">({roleLabels[alert.matchRole]})</span>
                      )}
                    </span>
                    {alert.clientName && (
                      <Link
                        to={`/projects/${alert.projectId}`}
                        className="font-semibold text-primary hover:text-primary-hover"
                      >
                        {alert.clientName}
                      </Link>
                    )}
                    <span>{formatAlertTime(alert.createdAt)}</span>
                  </div>
                </div>
                {!alert.read && (
                  <button
                    onClick={() => onMarkAsRead([alert.id])}
                    className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    title="Mark as read"
                  >
                    <CheckIcon className="size-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatAlertTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
