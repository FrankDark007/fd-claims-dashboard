import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAiBriefing } from '../hooks/useAI'

interface AiBriefingProps {
  token: string
}

export default function AiBriefing({ token }: AiBriefingProps) {
  const { briefing, loading, error, fetchBriefing } = useAiBriefing(token)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (expanded && !briefing && !loading) {
      fetchBriefing()
    }
  }, [expanded, briefing, loading, fetchBriefing])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100">
            <SparklesIcon className="size-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">AI Briefing</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Today's priority actions</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {briefing && (
            <button
              type="button"
              onClick={() => void fetchBriefing(true)}
              disabled={loading}
              className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
              title="Refresh briefing"
            >
              <ArrowPathIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {expanded ? 'Collapse' : 'Show briefing'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6">
          {loading && !briefing && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                Analyzing projects...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {briefing && (
            <>
              <ul className="space-y-3">
                {briefing.items.map((item, index) => (
                  <li key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        item.priority <= 2 ? 'bg-rose-500' : item.priority <= 3 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}>
                        {item.priority}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                        {item.projectId && (
                          <Link
                            to={`/projects/${item.projectId}`}
                            className="mt-2 inline-block text-xs font-semibold text-violet-600 hover:text-violet-800"
                          >
                            Open project
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {briefing.stats.unpaidProjects} unpaid of {briefing.stats.activeProjects} active projects analyzed
                </span>
                <span>
                  {briefing.cached ? 'Cached' : 'Fresh'} · {new Date(briefing.generatedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
