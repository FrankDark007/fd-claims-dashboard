import { useState, useCallback } from 'react'
import { DocumentArrowUpIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { ProjectFile } from '../../hooks/useProject'
import FileUploader from './FileUploader'
import FileList from './FileList'

interface FilesTabProps {
  files: ProjectFile[]
  loading: boolean
  projectId: string
  token: string
  onRefresh: () => void
}

export default function FilesTab({ files, loading, projectId, token, onRefresh }: FilesTabProps) {
  const [showUploader, setShowUploader] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Header with upload button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Files {files.length > 0 && <span className="text-sm font-normal text-gray-500">({files.length})</span>}
        </h3>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
        >
          <PlusIcon className="size-4" />
          Upload Files
        </button>
      </div>

      {/* Uploader (toggled) */}
      {showUploader && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <FileUploader
            projectId={projectId}
            token={token}
            onUploadComplete={handleUploadComplete}
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
