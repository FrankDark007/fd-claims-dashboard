import { useState } from 'react'
import { BookmarkIcon, CheckIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ProjectNote } from '../../shared/projects'

interface NotesTabProps {
  notes: ProjectNote[]
  loading: boolean
  onCreate: (input: { body: string; pinned?: boolean }) => Promise<unknown>
  onUpdate: (noteId: string, input: { body?: string; pinned?: boolean }) => Promise<unknown>
  onDelete: (noteId: string) => Promise<void>
}

export default function NotesTab({ notes, loading, onCreate, onUpdate, onDelete }: NotesTabProps) {
  const [draft, setDraft] = useState('')
  const [pinNew, setPinNew] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [workingNoteId, setWorkingNoteId] = useState<string | null>(null)

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onCreate({ body: draft.trim(), pinned: pinNew })
      setDraft('')
      setPinNew(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = (note: ProjectNote) => {
    setEditingId(note.id)
    setEditingBody(note.body)
    setError(null)
  }

  const saveEdit = async (noteId: string) => {
    if (!editingBody.trim()) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onUpdate(noteId, { body: editingBody.trim() })
      setEditingId(null)
      setEditingBody('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update note')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePinned = async (note: ProjectNote) => {
    setWorkingNoteId(note.id)
    setError(null)
    try {
      await onUpdate(note.id, { pinned: !note.pinned })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update note')
    } finally {
      setWorkingNoteId(null)
    }
  }

  const deleteNote = async (noteId: string) => {
    setWorkingNoteId(noteId)
    setError(null)
    try {
      await onDelete(noteId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete note')
    } finally {
      setWorkingNoteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Project Notes</h3>
          <label className="inline-flex items-center gap-2 text-sm text-secondary">
            <input
              type="checkbox"
              checked={pinNew}
              onChange={(event) => setPinNew(event.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Pin note
          </label>
        </div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder="Add follow-up details, adjuster updates, or internal handoff notes..."
          className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !draft.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Timeline Notes</h4>
          <span className="text-sm text-secondary">{notes.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center text-secondary">No notes yet.</div>
        ) : (
          <ul className="mt-5 space-y-4">
            {notes.map((note) => {
              const isEditing = editingId === note.id
              return (
                <li key={note.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        {note.pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                            <BookmarkIcon className="size-3.5" />
                            Pinned
                          </span>
                        )}
                        <span>{note.createdBy}</span>
                        <span>•</span>
                        <span>{formatDate(note.updatedAt)}</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editingBody}
                          onChange={(event) => setEditingBody(event.target.value)}
                          rows={4}
                          className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void togglePinned(note)}
                        disabled={workingNoteId === note.id}
                        className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-amber-600 disabled:opacity-50"
                        title={note.pinned ? 'Unpin note' : 'Pin note'}
                      >
                        <BookmarkIcon className="size-4" />
                      </button>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(note.id)}
                            className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-green-600"
                            title="Save note"
                          >
                            <CheckIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditingBody('')
                            }}
                            className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-gray-600"
                            title="Cancel edit"
                          >
                            <XMarkIcon className="size-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(note)}
                          className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-primary"
                          title="Edit note"
                        >
                          <PencilSquareIcon className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteNote(note.id)}
                        disabled={workingNoteId === note.id}
                        className="rounded-md p-2 text-gray-400 hover:bg-white hover:text-red-600 disabled:opacity-50"
                        title="Delete note"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
