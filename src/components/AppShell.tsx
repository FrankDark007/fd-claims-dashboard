import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import type { User } from '../types/claim'
import { useGmailAlerts } from '../hooks/useGmailAlerts'

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
]

const adminNavigation = [
  { name: 'Users', href: '/users', icon: UsersIcon },
]

interface AppShellProps {
  user: User
  token: string
  onLogout: () => void
  children: React.ReactNode
}

interface SidebarContentProps {
  allNav: typeof navigation
  isCurrentPath: (href: string) => boolean
  onNavigate: () => void
}

function SidebarContent({ allNav, isCurrentPath, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Operations</p>
          <span className="text-lg font-bold tracking-tight text-white">Flood Doctor</span>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">System status</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">D1 + R2 workflow live</p>
            <p className="mt-1 text-xs text-gray-400">Collections, documents, and timeline activity are synced in-app.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            Healthy
          </span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Workspace</p>
            <ul role="list" className="-mx-2 space-y-1">
              {allNav.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/'}
                    className={classNames(
                      isCurrentPath(item.href)
                        ? 'bg-white/5 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                    )}
                    onClick={onNavigate}
                  >
                    <item.icon aria-hidden="true" className="size-6 shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <NavLink
              to="/settings"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-white/5 hover:text-white"
              onClick={onNavigate}
            >
              <Cog6ToothIcon aria-hidden="true" className="size-6 shrink-0" />
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  )
}

export default function AppShell({ user, token, onLogout, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { unreadCount } = useGmailAlerts(token, { unreadOnly: true })

  const allNav = user.role === 'admin' ? [...navigation, ...adminNavigation] : navigation
  const initials = user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const routeMeta = getRouteMeta(location.pathname)
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  function isCurrentPath(href: string) {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <div>
      {/* Mobile sidebar */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
              <SidebarContent allNav={allNav} isCurrentPath={isCurrentPath} onNavigate={() => setSidebarOpen(false)} />
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
          <SidebarContent allNav={allNav} isCurrentPath={isCurrentPath} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex shrink-0 items-center gap-x-4 border-b border-gray-200/80 bg-white/90 px-4 py-4 backdrop-blur-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          <div aria-hidden="true" className="h-6 w-px bg-gray-900/10 lg:hidden" />

          <div className="flex flex-1 items-center justify-between gap-x-4 lg:gap-x-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Flood Doctor Ops</p>
                <span className="hidden items-center rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline-flex">
                  Live in D1
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="truncate text-lg font-semibold text-gray-950">{routeMeta.title}</h1>
                <div className="relative hidden md:block md:flex-1">
                  <MagnifyingGlassIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    name="search"
                    placeholder="Search clients, adjusters..."
                    aria-label="Search"
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
              <p className="mt-1 hidden text-sm text-gray-500 sm:block">{routeMeta.description}</p>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">Today</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{todayLabel}</p>
              </div>
              <button
                type="button"
                className="relative rounded-full p-1.5 text-gray-400 hover:text-gray-600"
                title={unreadCount > 0 ? `${unreadCount} unread email alerts` : 'No new email alerts'}
                onClick={() => {
                  // Navigate to dashboard where alerts panel lives
                  if (location.pathname !== '/') {
                    window.location.href = '/'
                  }
                }}
              >
                <BellIcon className="size-6" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <div aria-hidden="true" className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="relative flex items-center">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="hidden lg:flex lg:items-center">
                    <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-gray-900">
                      {user.displayName}
                    </span>
                    <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-gray-400" />
                  </span>
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline outline-1 outline-gray-900/5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  <MenuItem>
                    <NavLink
                      to="/settings"
                      className="block px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                    >
                      Settings
                    </NavLink>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={onLogout}
                      className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                    >
                      Sign out
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function getRouteMeta(pathname: string) {
  if (pathname === '/') {
    return {
      title: 'Dashboard',
      description: 'Collections, document readiness, and active project workload in one view.',
    }
  }

  if (pathname === '/projects') {
    return {
      title: 'Projects',
      description: 'Filter the full claims pipeline by billing state, project status, and follow-up pressure.',
    }
  }

  if (pathname.startsWith('/projects/')) {
    return {
      title: 'Project Workspace',
      description: 'Financials, files, timeline, tasks, and notes for the selected claim.',
    }
  }

  if (pathname === '/calendar') {
    return {
      title: 'Calendar',
      description: 'Track collection follow-ups, due dates, and invoice activity across the schedule.',
    }
  }

  if (pathname === '/reports') {
    return {
      title: 'Reports',
      description: 'Collections performance, document gaps, and project mix for operational review.',
    }
  }

  if (pathname === '/users') {
    return {
      title: 'Users',
      description: 'Manage access for the internal operations team.',
    }
  }

  return {
    title: 'Workspace',
    description: 'Flood Doctor claims operations.',
  }
}
