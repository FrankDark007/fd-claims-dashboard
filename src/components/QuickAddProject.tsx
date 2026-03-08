import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { BUSINESS_CATEGORIES, PROJECT_TYPES } from '../shared/projects'

interface QuickAddProjectProps {
  token: string
  onCreated: () => void
  onClose: () => void
}

export default function QuickAddProject({ token, onCreated, onClose }: QuickAddProjectProps) {
  const [clientName, setClientName] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [projectType, setProjectType] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          clientName: clientName.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
          businessCategory: businessCategory || undefined,
          projectType: projectType || undefined,
          amount: amount ? parseFloat(amount) : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create project' }))
        throw new Error((err as { error: string }).error)
      }

      setClientName('')
      setBusinessCategory('')
      setProjectType('')
      setAmount('')
      onCreated()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-sm font-semibold text-slate-900">Quick-add project</p>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <XMarkIcon className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name *"
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <select
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Business...</option>
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Type...</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !clientName.trim()}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Add project'}
          </button>
        </div>
      </form>
    </div>
  )
}
