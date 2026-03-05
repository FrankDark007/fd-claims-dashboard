interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'yellow'
}

const colorStyles = {
  blue: 'bg-primary-light text-primary',
  green: 'bg-green-50 text-success',
  red: 'bg-red-50 text-emergency',
  yellow: 'bg-yellow-50 text-yellow-700',
}

export default function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  return (
    <div className="rounded-xl bg-surface p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
