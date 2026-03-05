import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color: 'blue' | 'green' | 'red' | 'yellow'
  linkText?: string
  linkHref?: string
}

const iconBgColors = {
  blue: 'bg-primary',
  green: 'bg-success',
  red: 'bg-emergency',
  yellow: 'bg-warning',
}

export default function StatsCard({ title, value, subtitle, icon, color, linkText, linkHref }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
      <dt>
        <div className={`absolute rounded-md p-3 ${iconBgColors[color]}`}>
          <span className="size-6 text-white">{icon}</span>
        </div>
        <p className="ml-16 truncate text-sm font-medium text-secondary">{title}</p>
      </dt>
      <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {subtitle && (
          <p className="ml-2 text-sm text-muted">{subtitle}</p>
        )}
        {linkText && linkHref && (
          <div className="absolute inset-x-0 bottom-0 bg-surface-alt px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href={linkHref} className="font-medium text-primary hover:text-primary-hover">
                {linkText}
              </a>
            </div>
          </div>
        )}
      </dd>
    </div>
  )
}
