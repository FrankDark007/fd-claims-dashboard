import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  BellAlertIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Project } from '../types/claim'
import type { InvoiceEventWithProject } from '../hooks/useInvoiceEvents'
import { useInvoiceEvents } from '../hooks/useInvoiceEvents'
import AddInvoiceEventModal from '../components/calendar/AddInvoiceEventModal'

interface CalendarPageProps {
  projects: Project[]
  token: string
  onProjectsRefresh: () => Promise<void>
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const EVENT_TYPE_CONFIG = {
  sent: { icon: PaperAirplaneIcon, color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  reminder: { icon: BellAlertIcon, color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  paid: { icon: CurrencyDollarIcon, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  disputed: { icon: ExclamationTriangleIcon, color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
} as const

interface DayData {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  events: (InvoiceEventWithProject & { clientName?: string })[]
  followUps: FollowUpCalendarItem[]
  projectsAdded: Project[]
}

interface FollowUpCalendarItem {
  projectId: string
  clientName: string
  projectName: string
  date: string
  kind: 'follow_up' | 'due_date'
  invoiceStatus: Project['invoiceStatus']
}

function getDaysInMonth(year: number, month: number): DayData[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const days: DayData[] = []

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    const dateStr = formatDateStr(d)
    days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, events: [], followUps: [], projectsAdded: [] })
  }

  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    const dateStr = formatDateStr(d)
    days.push({ date: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr, events: [], followUps: [], projectsAdded: [] })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    const dateStr = formatDateStr(d)
    days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr, events: [], followUps: [], projectsAdded: [] })
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

export default function CalendarPage({ projects, token, onProjectsRefresh }: CalendarPageProps) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [editingEvent, setEditingEvent] = useState<InvoiceEventWithProject | null>(null)

  const { events, loading, addEvent, updateEvent, removeEvent } = useInvoiceEvents(token)

  const days = useMemo(() => {
    const baseDays = getDaysInMonth(currentYear, currentMonth)

    const eventsByDate = new Map<string, (InvoiceEventWithProject & { clientName?: string })[]>()
    for (const event of events) {
      const dateKey = event.eventDate.split('T')[0]
      if (!eventsByDate.has(dateKey)) eventsByDate.set(dateKey, [])
      const project = projects.find((candidate) => candidate.id === event.projectId)
      eventsByDate.get(dateKey)!.push({ ...event, clientName: project?.clientName })
    }

    const followUpsByDate = new Map<string, FollowUpCalendarItem[]>()
    for (const project of projects) {
      if (project.invoiceStatus === 'Paid') {
        continue
      }

      const followUpDate = project.nextFollowUpDate ?? project.dueDate
      if (!followUpDate) {
        continue
      }

      const item: FollowUpCalendarItem = {
        projectId: project.id,
        clientName: project.clientName,
        projectName: project.projectName,
        date: followUpDate,
        kind: project.nextFollowUpDate ? 'follow_up' : 'due_date',
        invoiceStatus: project.invoiceStatus,
      }

      if (!followUpsByDate.has(followUpDate)) {
        followUpsByDate.set(followUpDate, [])
      }

      followUpsByDate.get(followUpDate)!.push(item)
    }

    const projectsByDate = new Map<string, Project[]>()
    for (const project of projects) {
      const dateKey = project.createdAt.split('T')[0]
      if (!projectsByDate.has(dateKey)) projectsByDate.set(dateKey, [])
      projectsByDate.get(dateKey)!.push(project)
    }

    for (const day of baseDays) {
      day.events = eventsByDate.get(day.dateStr) || []
      day.followUps = (followUpsByDate.get(day.dateStr) || []).sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'follow_up' ? -1 : 1
        }

        return a.clientName.localeCompare(b.clientName)
      })
      day.projectsAdded = projectsByDate.get(day.dateStr) || []
    }

    return baseDays
  }, [currentYear, currentMonth, events, projects])

  const monthEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.eventDate)
      return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth
    })
  }, [events, currentYear, currentMonth])

  const monthStats = useMemo(() => {
    const sent = monthEvents.filter((event) => event.type === 'sent')
    const paid = monthEvents.filter((event) => event.type === 'paid')
    const followUps = projects.filter((project) => {
      const date = project.nextFollowUpDate ?? project.dueDate
      if (!date || project.invoiceStatus === 'Paid') {
        return false
      }

      const scheduleDate = new Date(`${date}T00:00:00`)
      return scheduleDate.getFullYear() === currentYear && scheduleDate.getMonth() === currentMonth
    })

    return {
      sentCount: sent.length,
      sentAmount: sent.reduce((sum, event) => sum + event.amount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, event) => sum + event.amount, 0),
      reminderCount: monthEvents.filter((event) => event.type === 'reminder').length,
      disputedCount: monthEvents.filter((event) => event.type === 'disputed').length,
      followUpCount: followUps.length,
      overdueFollowUpCount: followUps.filter((project) => (project.nextFollowUpDate ?? project.dueDate ?? todayStr) < todayStr).length,
    }
  }, [currentMonth, currentYear, monthEvents, projects, todayStr])

  const upcomingFollowUps = useMemo(() => {
    return projects
      .filter((project) => project.invoiceStatus !== 'Paid')
      .map((project) => {
        const date = project.nextFollowUpDate ?? project.dueDate
        if (!date) {
          return null
        }

        return {
          project,
          date,
          kind: project.nextFollowUpDate ? 'Follow-up' : 'Due date',
          overdue: date < todayStr,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date) || a.project.clientName.localeCompare(b.project.clientName))
      .slice(0, 12)
  }, [projects, todayStr])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((year) => year - 1)
    } else {
      setCurrentMonth((month) => month - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((year) => year + 1)
    } else {
      setCurrentMonth((month) => month + 1)
    }
  }

  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const handleDayClick = (dateStr: string) => {
    setEditingEvent(null)
    setSelectedDate(dateStr)
    setShowAddModal(true)
  }

  const handleAddEvent = async (params: {
    projectId: string
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
    recipient?: string
  }) => {
    if (editingEvent) {
      await updateEvent(editingEvent.projectId, editingEvent.id, {
        type: params.type,
        date: params.date,
        amount: params.amount,
        notes: params.notes,
        recipient: params.recipient,
      })
    } else {
      await addEvent(params)
    }

    await onProjectsRefresh()
    setEditingEvent(null)
  }

  const handleDeleteEvent = async (event: InvoiceEventWithProject) => {
    await removeEvent(event.projectId, event.id)
    await onProjectsRefresh()
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Calendar</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Collections and invoice activity by day.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              See invoice sends, reminders, disputes, and payment dates in the same monthly grid as follow-up schedules.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null)
              setSelectedDate(undefined)
              setShowAddModal(true)
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            <PlusIcon className="size-4" />
            Add event
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Invoices sent" value={monthStats.sentCount.toString()} detail={`$${monthStats.sentAmount.toLocaleString()} sent`} />
          <MetricCard label="Invoices paid" value={monthStats.paidCount.toString()} detail={`$${monthStats.paidAmount.toLocaleString()} collected`} />
          <MetricCard label="Reminders / disputes" value={`${monthStats.reminderCount}/${monthStats.disputedCount}`} detail="Follow-up pressure this month" />
          <MetricCard label="Scheduled follow-ups" value={monthStats.followUpCount.toString()} detail={`${monthStats.overdueFollowUpCount} already overdue`} />
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                <time dateTime={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </time>
              </h3>
              <div className="flex items-center">
                <div className="relative flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="flex h-10 w-10 items-center justify-center rounded-l-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                  >
                    <span className="sr-only">Previous month</span>
                    <ChevronLeftIcon aria-hidden="true" className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="hidden px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 md:block"
                  >
                    Today
                  </button>
                  <span className="relative h-5 w-px bg-slate-200 md:hidden" />
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-10 w-10 items-center justify-center rounded-r-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                  >
                    <span className="sr-only">Next month</span>
                    <ChevronRightIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
                <Menu as="div" className="relative ml-4 md:hidden">
                  <MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-slate-400 hover:text-slate-600">
                    <span className="sr-only">Open menu</span>
                    <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-3 w-40 origin-top-right overflow-hidden rounded-2xl bg-white shadow-lg outline outline-1 outline-black/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
                  >
                    <div className="py-1">
                      <MenuItem>
                        <button
                          type="button"
                          onClick={goToToday}
                          className="block w-full px-4 py-2 text-left text-sm text-slate-700 data-[focus]:bg-slate-100 data-[focus]:outline-none"
                        >
                          Go to today
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(null)
                            setSelectedDate(undefined)
                            setShowAddModal(true)
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-slate-700 data-[focus]:bg-slate-100 data-[focus]:outline-none"
                        >
                          Create event
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            </header>

            <div className="grid grid-cols-7 gap-px border-b border-slate-200 bg-slate-200 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-white py-3">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {days.map((day) => (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => handleDayClick(day.dateStr)}
                  className={classNames(
                    'min-h-[138px] bg-white p-2 text-left align-top transition hover:bg-slate-50',
                    !day.isCurrentMonth && 'bg-slate-50 text-slate-400',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={classNames(
                        'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                        day.isToday && 'bg-primary text-white',
                        !day.isToday && day.isCurrentMonth && 'text-slate-900',
                        !day.isToday && !day.isCurrentMonth && 'text-slate-400',
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    {(day.projectsAdded.length > 0 || day.followUps.length + day.events.length > 0) ? (
                      <span className="text-[11px] font-medium text-slate-400">
                        {day.followUps.length + day.events.length + day.projectsAdded.length} items
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1">
                    {day.followUps.slice(0, 2).map((item) => (
                      <Link
                        key={`${item.projectId}-${item.kind}`}
                        to={`/projects/${item.projectId}`}
                        onClick={(event) => event.stopPropagation()}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                          item.kind === 'follow_up'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-orange-200 bg-orange-50 text-orange-700'
                        }`}
                        title={`${item.clientName}: ${item.kind === 'follow_up' ? 'Follow-up scheduled' : 'Due date'}`}
                      >
                        <span className={`inline-block size-1.5 shrink-0 rounded-full ${item.kind === 'follow_up' ? 'bg-amber-500' : 'bg-orange-500'}`} />
                        <span className="truncate">{item.clientName}</span>
                      </Link>
                    ))}
                    {day.events.slice(0, 2).map((event) => {
                      const config = EVENT_TYPE_CONFIG[event.type]
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-[11px] font-semibold ${config.color}`}
                          title={`${event.clientName || 'Unknown'}: $${event.amount.toLocaleString()} — ${event.type}`}
                        >
                          <span className={`inline-block size-1.5 shrink-0 rounded-full ${config.dot}`} />
                          <span className="truncate">{event.clientName || 'Unknown project'}</span>
                        </div>
                      )
                    })}
                    {day.followUps.length + day.events.length > 4 ? (
                      <p className="pl-1 text-[11px] text-slate-400">+{day.followUps.length + day.events.length - 4} more</p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Upcoming follow-ups</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">What needs attention next</h3>
                </div>
              </div>

              {upcomingFollowUps.length === 0 ? (
                <div className="py-10 text-center">
                  <BellAlertIcon className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-900">No follow-ups scheduled</p>
                  <p className="mt-1 text-sm text-slate-500">Set invoice sent or next follow-up dates in project financials.</p>
                </div>
              ) : (
                <ul className="mt-6 space-y-3">
                  {upcomingFollowUps.map(({ project, date, kind, overdue }) => (
                    <li key={`${project.id}-${kind}-${date}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link to={`/projects/${project.id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-primary">
                            {project.clientName}
                          </Link>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{kind}</p>
                          <p className="mt-2 text-sm text-slate-600">{project.projectName || project.projectType || 'Project detail'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${overdue ? 'text-rose-700' : 'text-slate-900'}`}>
                            {formatLongDate(date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{describeSchedule(date, todayStr)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent events</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">Latest invoice activity</h3>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="py-10 text-center">
                  <CalendarDaysIcon className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-900">No invoice events yet</p>
                  <p className="mt-1 text-sm text-slate-500">Track when invoices are sent, paid, or disputed.</p>
                </div>
              ) : (
                <ul className="mt-6 space-y-4">
                  {events.slice(0, 10).map((event) => {
                    const config = EVENT_TYPE_CONFIG[event.type]
                    const Icon = config.icon
                    const project = projects.find((candidate) => candidate.id === event.projectId)

                    return (
                      <li key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-4">
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border ${config.color}`}>
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {project ? (
                                <Link to={`/projects/${project.id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-primary">
                                  {project.clientName}
                                </Link>
                              ) : (
                                <span className="truncate text-sm font-semibold text-slate-900">Unknown project</span>
                              )}
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.color}`}>
                                {event.type}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              ${event.amount.toLocaleString()} on {formatLongDate(event.eventDate)}
                              {event.recipient ? ` · ${event.recipient}` : ''}
                            </p>
                            {event.notes ? (
                              <p className="mt-1 text-sm text-slate-500">{event.notes}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEvent(event)
                                setSelectedDate(event.eventDate)
                                setShowAddModal(true)
                              }}
                              className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-primary"
                              title="Edit event"
                            >
                              <PencilSquareIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteEvent(event)}
                              className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"
                              title="Delete event"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <AddInvoiceEventModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingEvent(null)
        }}
        projects={projects}
        preselectedDate={selectedDate}
        initialEvent={editingEvent ? {
          projectId: editingEvent.projectId,
          type: editingEvent.type,
          date: editingEvent.eventDate,
          amount: editingEvent.amount,
          recipient: editingEvent.recipient,
          notes: editingEvent.notes,
        } : null}
        title={editingEvent ? 'Edit Invoice Event' : 'Add Invoice Event'}
        submitLabel={editingEvent ? 'Save Event' : 'Add Event'}
        onSubmit={handleAddEvent}
      />
    </div>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  )
}

function formatLongDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function describeSchedule(date: string, today: string) {
  const diff = Math.floor(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000,
  )

  if (diff < 0) {
    const overdueDays = Math.abs(diff)
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`
  }

  if (diff === 0) {
    return 'Due today'
  }

  return `In ${diff} day${diff === 1 ? '' : 's'}`
}
