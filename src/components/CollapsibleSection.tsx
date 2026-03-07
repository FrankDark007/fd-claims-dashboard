import { useState, type ReactNode } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface CollapsibleSectionProps {
  title: string
  summary?: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
}

export default function CollapsibleSection({
  title,
  summary,
  children,
  defaultOpen = false,
  icon,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            {summary && (
              <p className="mt-0.5 text-sm text-slate-500">{summary}</p>
            )}
          </div>
        </div>
        <ChevronDownIcon
          className={`size-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-slate-200 p-6 pt-4">
          {children}
        </div>
      </div>
    </section>
  )
}
