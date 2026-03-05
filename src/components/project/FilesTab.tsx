import { DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import type { ProjectFile } from '../../hooks/useProject'

interface FilesTabProps {
  files: ProjectFile[]
  loading: boolean
}

export default function FilesTab({ files, loading }: FilesTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow">
        <div className="px-6 py-14 text-center">
          <DocumentArrowUpIcon className="mx-auto size-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">No files yet</h3>
          <p className="mt-2 text-sm text-secondary">
            Upload contracts, certificates of completion, photos, and other project documents.
          </p>
          <p className="mt-4 text-xs text-muted">
            File management coming soon — Phase 3
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white shadow p-6">
      <p className="text-sm text-muted">{files.length} files</p>
    </div>
  )
}
