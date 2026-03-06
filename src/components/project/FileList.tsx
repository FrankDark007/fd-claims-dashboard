import { useState } from 'react'
import {
  DocumentTextIcon,
  PhotoIcon,
  DocumentCheckIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { ProjectFile } from '../../hooks/useProject'
import ShareLinkModal from './ShareLinkModal'

interface FileListProps {
  files: ProjectFile[]
  projectId: string
  token: string
  onDelete: (fileId: string) => void
}

const CATEGORY_CONFIG = {
  contracts: {
    label: 'Contracts',
    icon: DocumentTextIcon,
    color: 'bg-blue-50 text-blue-700',
  },
  cocs: {
    label: 'Certificates of Completion',
    icon: DocumentCheckIcon,
    color: 'bg-green-50 text-green-700',
  },
  drylogs: {
    label: 'Dry Logs',
    icon: DocumentTextIcon,
    color: 'bg-cyan-50 text-cyan-700',
  },
  invoices: {
    label: 'Invoices',
    icon: DocumentTextIcon,
    color: 'bg-violet-50 text-violet-700',
  },
  photos: {
    label: 'Photos',
    icon: PhotoIcon,
    color: 'bg-amber-50 text-amber-700',
  },
  correspondence: {
    label: 'Correspondence',
    icon: DocumentTextIcon,
    color: 'bg-indigo-50 text-indigo-700',
  },
  other: {
    label: 'Other Documents',
    icon: DocumentIcon,
    color: 'bg-gray-50 text-gray-700',
  },
} as const

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function FileList({ files, projectId, token, onDelete }: FileListProps) {
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const grouped = files.reduce<Record<string, ProjectFile[]>>((acc, file) => {
    const cat = file.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(file)
    return acc
  }, {})

  const handleDownload = async (file: ProjectFile) => {
    const res = await fetch(`/api/projects/${projectId}/files?fileId=${file.id}&download=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return
    }

    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(href)
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeleting(fileId)
    try {
      const res = await fetch(`/api/projects/${projectId}/files?fileId=${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        onDelete(fileId)
      }
    } finally {
      setDeleting(null)
    }
  }

  const categories = ['contracts', 'cocs', 'drylogs', 'invoices', 'photos', 'correspondence', 'other'] as const

  return (
    <>
      <div className="space-y-6">
        {categories.map((cat) => {
          const catFiles = grouped[cat]
          if (!catFiles || catFiles.length === 0) return null

          const config = CATEGORY_CONFIG[cat]
          const Icon = config.icon

          return (
            <div key={cat}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Icon className="size-5 text-gray-400" />
                {config.label}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {catFiles.length}
                </span>
              </h3>

              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {catFiles.map((file) => (
                  <li key={file.id} className="flex items-center gap-4 px-4 py-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                      <Icon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(file.sizeBytes)} &middot; {formatDate(file.uploadedAt)} &middot; {file.uploadedBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(file)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => setShareFile({ id: file.id, name: file.originalName })}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Share"
                      >
                        <ShareIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        disabled={deleting === file.id}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {shareFile && (
        <ShareLinkModal
          open={!!shareFile}
          onClose={() => setShareFile(null)}
          projectId={projectId}
          fileId={shareFile.id}
          fileName={shareFile.name}
          token={token}
        />
      )}
    </>
  )
}
