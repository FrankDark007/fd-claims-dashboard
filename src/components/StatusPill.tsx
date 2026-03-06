const colorMap: Record<string, string> = {
  // Contract / COC
  Missing: 'bg-red-100 text-red-700',
  Requested: 'bg-yellow-100 text-yellow-800',
  Signed: 'bg-green-100 text-green-700',

  // Final Invoice
  'Not Started': 'bg-gray-100 text-gray-600',
  Drafting: 'bg-yellow-100 text-yellow-800',
  Review: 'bg-orange-100 text-orange-700',
  Complete: 'bg-green-100 text-green-700',

  // Matterport
  'N/A': 'bg-gray-100 text-gray-500',
  'Has Scan': 'bg-green-100 text-green-700',

  // Rewrite Status
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Done: 'bg-green-100 text-green-700',
  Received: 'bg-green-100 text-green-700',

  // Invoice Status
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',

  // Project Status
  Active: 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-800',
  Archived: 'bg-gray-100 text-gray-600',
}

interface StatusPillProps {
  value: string | null
  size?: 'sm' | 'md'
}

export default function StatusPill({ value, size = 'sm' }: StatusPillProps) {
  if (!value) return <span className="text-muted text-xs">—</span>

  const colors = colorMap[value] || 'bg-gray-100 text-gray-600'
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors} ${sizeClasses}`}>
      {value}
    </span>
  )
}
