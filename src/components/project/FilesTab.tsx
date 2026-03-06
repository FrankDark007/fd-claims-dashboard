import { useState, useCallback } from 'react'
import { DocumentArrowUpIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { Project } from '../../shared/projects'
import type { ProjectFile } from '../../hooks/useProject'
import FileUploader from './FileUploader'
import FileList from './FileList'

interface FilesTabProps {
  project: Project
  files: ProjectFile[]
  loading: boolean
  projectId: string
  token: string
  onRefresh: () => void
}

const CHECKLIST_ITEMS = [
  { key: 'contracts', label: 'Contract', statusField: 'contractStatus' },
  { key: 'cocs', label: 'Certificate of Completion', statusField: 'cocStatus' },
  { key: 'drylogs', label: 'Dry Logs', statusField: 'drylogStatus' },
  { key: 'invoices', label: 'Invoice Backup', statusField: 'finalInvoiceStatus' },
  { key: 'photos', label: 'Photos / Matterport', statusField: 'matterportStatus' },
] as const

export default function FilesTab({ project, files, loading, projectId, token, onRefresh }: FilesTabProps) {
  const [showUploader, setShowUploader] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<string>('other')

  const handleUploadComplete = useCallback(() => {
    setShowUploader(false)
    onRefresh()
  }, [onRefresh])

  const handleDelete = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const fileCounts = files.reduce<Record<string, number>>((acc, file) => {
    acc[file.category] = (acc[file.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Files {files.length > 0 && <span className="text-sm font-normal text-gray-500">({files.length})</span>}
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Track required documents, upload by category, and share project files with expiring links.
            </p>
          </div>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            <PlusIcon className="size-4" />
            Upload Files
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {CHECKLIST_ITEMS.map((item) => {
            const count = fileCounts[item.key] ?? 0
            const status = project[item.statusField]
            const statusTone = count > 0 || (status && status !== 'Missing' && status !== 'Not Started')
              ? 'border-green-200 bg-green-50'
              : 'border-amber-200 bg-amber-50'

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setUploadCategory(item.key)
                  setShowUploader(true)
                }}
                className={`rounded-2xl border p-4 text-left transition hover:shadow-sm ${statusTone}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{count}</p>
                <p className="mt-1 text-sm text-secondary">
                  {status ? `Status: ${status}` : 'Upload missing items'}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Uploader (toggled) */}
      {showUploader && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <FileUploader
            projectId={projectId}
            token={token}
            onUploadComplete={handleUploadComplete}
            initialCategory={uploadCategory}
          />
        </div>
      )}

      {/* File list or empty state */}
      {files.length === 0 && !showUploader ? (
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-14 text-center">
            <DocumentArrowUpIcon className="mx-auto size-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-semibold text-foreground">No files yet</h3>
            <p className="mt-2 text-sm text-secondary">
              Upload contracts, certificates of completion, photos, and other project documents.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              <PlusIcon className="size-4" />
              Upload your first file
            </button>
          </div>
        </div>
      ) : files.length > 0 ? (
        <FileList
          files={files}
          projectId={projectId}
          token={token}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  )
}
