import {
  PhoneArrowUpRightIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

interface KpiCard {
  label: string
  value: number | string
  sublabel: string
  icon: typeof PhoneArrowUpRightIcon
  tone: 'rose' | 'amber' | 'blue' | 'slate'
  onClick?: () => void
}

interface TodayFocusBarProps {
  userName: string
  followUpsDueCount: number
  overdueTasksCount: number
  unreadAlertCount: number
  outstandingBalance: number
  onCardClick?: (section: 'followups' | 'tasks' | 'emails' | 'balance') => void
}

const toneStyles = {
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

const iconBg = {
  rose: 'bg-rose-100 text-rose-600',
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-blue-100 text-blue-600',
  slate: 'bg-slate-100 text-slate-600',
}

export default function TodayFocusBar({
  userName,
  followUpsDueCount,
  overdueTasksCount,
  unreadAlertCount,
  outstandingBalance,
  onCardClick,
}: TodayFocusBarProps) {
  const greeting = getGreeting()
  const firstName = userName.split(' ')[0] || userName
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const cards: KpiCard[] = [
    {
      label: 'Follow-ups due',
      value: followUpsDueCount,
      sublabel: followUpsDueCount === 0 ? 'all clear' : 'need outreach',
      icon: PhoneArrowUpRightIcon,
      tone: followUpsDueCount > 0 ? 'amber' : 'slate',
      onClick: () => onCardClick?.('followups'),
    },
    {
      label: 'Tasks overdue',
      value: overdueTasksCount,
      sublabel: overdueTasksCount === 0 ? 'on track' : 'action needed',
      icon: ClipboardDocumentCheckIcon,
      tone: overdueTasksCount > 0 ? 'rose' : 'slate',
      onClick: () => onCardClick?.('tasks'),
    },
    {
      label: 'Email alerts',
      value: unreadAlertCount,
      sublabel: unreadAlertCount === 0 ? 'inbox clear' : unreadAlertCount === 1 ? 'new alert' : 'new alerts',
      icon: EnvelopeIcon,
      tone: unreadAlertCount > 0 ? 'blue' : 'slate',
      onClick: () => onCardClick?.('emails'),
    },
    {
      label: 'Outstanding',
      value: `$${outstandingBalance.toLocaleString()}`,
      sublabel: 'balance owed',
      icon: BanknotesIcon,
      tone: 'slate',
      onClick: () => onCardClick?.('balance'),
    },
  ]

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-950">
          {greeting}, {firstName}
        </h2>
        <p className="text-sm text-slate-500">{today}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className={`group rounded-2xl border p-4 text-left transition hover:shadow-md ${toneStyles[card.tone]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                {card.label}
              </span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg[card.tone]}`}>
                <card.icon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
              {card.value}
            </p>
            <p className="mt-0.5 text-xs opacity-75">{card.sublabel}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
