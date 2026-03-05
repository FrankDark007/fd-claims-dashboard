import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/20/solid'
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Claim } from '../types/claim'
import type { InvoiceEventWithProject } from '../hooks/useInvoiceEvents'
import { useInvoiceEvents } from '../hooks/useInvoiceEvents'
import AddInvoiceEventModal from '../components/calendar/AddInvoiceEventModal'

interface CalendarPageProps {
  claims: Claim[]
  token: string
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const EVENT_TYPE_CONFIG = {
  sent: { icon: PaperAirplaneIcon, color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  reminder: { icon: BellAlertIcon, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  paid: { icon: CurrencyDollarIcon, color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  disputed: { icon: ExclamationTriangleIcon, color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
} as const

interface DayData {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  events: (InvoiceEventWithProject & { clientName?: string })[]
  projectsAdded: Claim[]
}

function getDaysInMonth(year: number, month: number): DayData[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const days: DayData[] = []

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    const dateStr = formatDateStr(d)
    days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, events: [], projectsAdded: [] })
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDateStr(d)
    days.push({ date: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr, events: [], projectsAdded: [] })
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    const dateStr = formatDateStr(d)
    days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, events: [], projectsAdded: [] })
  }

  return days
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarPage({ claims, token }: CalendarPageProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  const { events, loading, addEvent } = useInvoiceEvents(token)

  // Build calendar data
  const days = useMemo(() => {
    const baseDays = getDaysInMonth(currentYear, currentMonth)

    // Build lookup maps
    const eventsByDate = new Map<string, (InvoiceEventWithProject & { clientName?: string })[]>()
    for (const event of events) {
      const dateKey = event.date.split('T')[0]
      if (!eventsByDate.has(dateKey)) eventsByDate.set(dateKey, [])
      const project = claims.find(c => c.id === event.projectId)
      eventsByDate.get(dateKey)!.push({ ...event, clientName: project?.clientName })
    }

    const projectsByDate = new Map<string, Claim[]>()
    for (const claim of claims) {
      if (claim.dateAdded) {
        const dateKey = claim.dateAdded.split('T')[0]
        if (!projectsByDate.has(dateKey)) projectsByDate.set(dateKey, [])
        projectsByDate.get(dateKey)!.push(claim)
      }
    }

    // Populate days
    for (const day of baseDays) {
      day.events = eventsByDate.get(day.dateStr) || []
      day.projectsAdded = projectsByDate.get(day.dateStr) || []
    }

    return baseDays
  }, [currentYear, currentMonth, events, claims])

  // Month summary stats
  const monthEvents = useMemo(() => {
    return events.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })
  }, [events, currentYear, currentMonth])

  const monthStats = useMemo(() => {
    const sent = monthEvents.filter(e => e.type === 'sent')
    const paid = monthEvents.filter(e => e.type === 'paid')
    return {
      sentCount: sent.length,
      sentAmount: sent.reduce((s, e) => s + e.amount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((s, e) => s + e.amount, 0),
      reminderCount: monthEvents.filter(e => e.type === 'reminder').length,
      disputedCount: monthEvents.filter(e => e.type === 'disputed').length,
    }
  }, [monthEvents])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setShowAddModal(true)
  }

  const handleAddEvent = async (params: {
    projectId: string
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
  }) => {
    await addEvent(params)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoice Calendar</h1>
          <p className="text-sm text-secondary mt-1">Track invoice events across all projects</p>
        </div>
        <button
          onClick={() => { setSelectedDate(undefined); setShowAddModal(true) }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
        >
          <PlusIcon className="size-4" />
          Add Event
        </button>
      </div>

      {/* Month Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <PaperAirplaneIcon className="size-4 text-blue-500" />
            Sent
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">{monthStats.sentCount}</p>
          <p className="text-xs text-gray-500">${monthStats.sentAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CurrencyDollarIcon className="size-4 text-green-500" />
            Paid
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">{monthStats.paidCount}</p>
          <p className="text-xs text-gray-500">${monthStats.paidAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BellAlertIcon className="size-4 text-yellow-500" />
            Reminders
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">{monthStats.reminderCount}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ExclamationTriangleIcon className="size-4 text-red-500" />
            Disputed
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">{monthStats.disputedCount}</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="rounded-md bg-white p-1.5 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ChevronLeftIcon className="size-5 text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-md bg-white p-1.5 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ChevronRightIcon className="size-5 text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {days.map((day) => (
                <div
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={classNames(
                    'min-h-[100px] p-1.5 cursor-pointer hover:bg-gray-50 transition-colors',
                    !day.isCurrentMonth && 'bg-gray-50/50',
                  )}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={classNames(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                        day.isToday && 'bg-primary text-white',
                        !day.isToday && day.isCurrentMonth && 'text-gray-900',
                        !day.isToday && !day.isCurrentMonth && 'text-gray-400',
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    {day.projectsAdded.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        +{day.projectsAdded.length} proj
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="mt-1 space-y-0.5">
                    {day.events.slice(0, 3).map((event) => {
                      const config = EVENT_TYPE_CONFIG[event.type]
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium border ${config.color}`}
                          title={`${event.clientName || 'Unknown'}: $${event.amount.toLocaleString()} — ${event.type}`}
                        >
                          <span className={`inline-block size-1.5 shrink-0 rounded-full ${config.dot}`} />
                          <span className="truncate">
                            {event.clientName ? event.clientName.split(' ')[0] : 'Unknown'}
                          </span>
                          <span className="ml-auto shrink-0">${event.amount >= 1000 ? `${(event.amount / 1000).toFixed(0)}k` : event.amount}</span>
                        </div>
                      )
                    })}
                    {day.events.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1">+{day.events.length - 3} more</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Events</h3>
            {events.length === 0 ? (
              <div className="rounded-lg bg-white shadow px-6 py-10 text-center">
                <CalendarDaysIcon className="mx-auto size-10 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-900">No invoice events yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Track when invoices are sent, paid, or disputed.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <ul className="divide-y divide-gray-100">
                  {events.slice(0, 20).map((event) => {
                    const config = EVENT_TYPE_CONFIG[event.type]
                    const Icon = config.icon
                    const project = claims.find(c => c.id === event.projectId)

                    return (
                      <li key={event.id} className="flex items-center gap-4 px-4 py-3">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {project ? (
                              <Link
                                to={`/projects/${project.id}`}
                                className="truncate text-sm font-medium text-gray-900 hover:text-primary"
                              >
                                {project.clientName}
                              </Link>
                            ) : (
                              <span className="truncate text-sm font-medium text-gray-900">Unknown Project</span>
                            )}
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
                              {event.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            ${event.amount.toLocaleString()} &middot;{' '}
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {event.notes && ` — ${event.notes}`}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-gray-900">
                          ${event.amount.toLocaleString()}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Event Modal */}
      <AddInvoiceEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        projects={claims}
        preselectedDate={selectedDate}
        onSubmit={handleAddEvent}
      />
    </div>
  )
}
