import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function EmailTab() {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-6 py-14 text-center">
        <EnvelopeIcon className="mx-auto size-12 text-gray-400" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Email integration coming soon</h3>
        <p className="mt-2 text-sm text-secondary">
          Connect your Gmail accounts to send and receive emails with adjusters directly from this project.
        </p>
        <p className="mt-4 text-xs text-muted">
          Gmail integration coming in Phase 5
        </p>
      </div>
    </div>
  )
}
