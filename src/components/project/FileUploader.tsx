import { useState, useCallback, useRef } from 'react'
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FileUploaderProps {
  projectId: string
  token: string
  onUploadComplete: () => void
}

const CATEGORIES = [
  { value: 'contracts', label: 'Contracts' },
  { value: 'cocs', label: 'Certificates of Completion' },
  { value: 'photos', label: 'Photos' },
  { value: 'other', label: 'Other Documents' },
] as const

export default function FileUploader({ projectId, token, onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [category, setCategory] = useState<string>('other')
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setUploadQueue(prev => [...prev, ...files])
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadQueue(prev => [...prev, ...files])
    }
  }, [])

  const removeFromQueue = useCallback((index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index))
  }, [])

  const uploadFiles = useCallback(async () => {
    if (uploadQueue.length === 0) return
    setUploading(true)
    setError(null)

    try {
      for (const file of uploadQueue) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', category)

        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error((err as { error: string }).error || `Failed to upload ${file.name}`)
        }
      }

      setUploadQueue([])
      onUploadComplete()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [uploadQueue, category, projectId, token, onUploadComplete])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div>
        <label htmlFor="file-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="file-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-primary"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <CloudArrowUpIcon className="mx-auto size-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-500">PDF, images, documents up to 50MB</p>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''} ready to upload
          </h4>
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {uploadQueue.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between py-2 pl-3 pr-2 text-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium text-gray-700">{file.name}</span>
                  <span className="shrink-0 text-gray-400">{formatSize(file.size)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(i) }}
                  className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
              </>
            ) : (
              `Upload ${uploadQueue.length} file${uploadQueue.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  )
}
