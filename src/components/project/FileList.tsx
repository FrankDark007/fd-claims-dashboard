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
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const visibleFiles = files.filter((file) => {
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
    const searchTerm = search.trim().toLowerCase()
    const matchesSearch = searchTerm.length === 0
      || file.originalName.toLowerCase().includes(searchTerm)
      || file.uploadedBy.toLowerCase().includes(searchTerm)

    return matchesCategory && matchesSearch
  })

  const grouped = visibleFiles.reduce<Record<string, ProjectFile[]>>((acc, file) => {
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
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <label htmlFor="file-search" className="sr-only">Search files</label>
            <input
              id="file-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search file names or uploader..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_CONFIG[category].label}
                </option>
              ))}
            </select>
            <span className="text-sm text-secondary">{visibleFiles.length} files</span>
          </div>
        </div>

        {categories.map((cat) => {
          const catFiles = grouped[cat]
          if (!catFiles || catFiles.length === 0) return null

          const config = CATEGORY_CONFIG[cat]
          const Icon = config.icon
          const latestFile = [...catFiles].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]

          return (
            <div key={cat}>
              <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Icon className="size-5 text-gray-400" />
                    {config.label}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {catFiles.length}
                    </span>
                  </h3>
                  {latestFile && (
                    <p className="mt-2 text-xs text-gray-500">
                      Latest upload: {latestFile.originalName} on {formatDate(latestFile.uploadedAt)}
                    </p>
                  )}
                </div>
                {latestFile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleDownload(latestFile)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowDownTrayIcon className="size-4" />
                      Download latest
                    </button>
                    <button
                      onClick={() => setShareFile({ id: latestFile.id, name: latestFile.originalName })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <ShareIcon className="size-4" />
                      Share latest
                    </button>
                  </div>
                )}
              </div>

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

        {visibleFiles.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-secondary">
            No files match the current search or category filter.
          </div>
        )}
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
