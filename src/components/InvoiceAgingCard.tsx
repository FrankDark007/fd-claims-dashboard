import type { InvoiceAgingBucket } from '../types/claim'

interface InvoiceAgingCardProps {
  buckets: InvoiceAgingBucket[]
}

const bucketIcons = ['\u2713', '\u26A0', '\u23F0', '\uD83D\uDD25']

export default function InvoiceAgingCard({ buckets }: InvoiceAgingCardProps) {
  const totalOutstanding = buckets.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Invoice Aging</h3>
          <p className="text-sm text-muted">{totalCount} outstanding · ${totalOutstanding.toLocaleString()}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {buckets.map((bucket, i) => (
          <div
            key={bucket.label}
            className={`rounded-lg p-3 ${bucket.color}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{bucketIcons[i]}</span>
              <span className="text-xs font-medium uppercase tracking-wider">{bucket.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{bucket.count}</p>
            <p className="text-xs opacity-75">${bucket.totalAmount.toLocaleString()}</p>
            <p className="text-xs opacity-60">{bucket.range}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
