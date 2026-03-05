import type { Claim } from '../types/claim'
import ClaimsTable from '../components/ClaimsTable'

interface ClaimsPageProps {
  claims: Claim[]
  loading: boolean
}

export default function ClaimsPage({ claims, loading }: ClaimsPageProps) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claims</h1>
          <p className="text-sm text-secondary mt-1">Manage all client claims and invoices</p>
        </div>
        <a
          href="https://www.notion.so/3a496fa362994550910a04937d747166"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open in Notion
        </a>
      </div>
      <ClaimsTable claims={claims} loading={loading} />
    </div>
  )
}
