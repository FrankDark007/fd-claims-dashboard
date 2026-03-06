import { useCallback, useEffect, useState } from 'react'
import type { ProjectNote } from '../shared/projects'

export function useProjectNotes(projectId: string | undefined, token: string) {
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!projectId) {
      setNotes([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json() as { notes: ProjectNote[] }
      setNotes(data.notes)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [projectId, token])

  const addNote = useCallback(async (input: { body: string; pinned?: boolean }) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create note' }))
      throw new Error((err as { error?: string }).error || 'Failed to create note')
    }

    const data = await res.json() as { note: ProjectNote }
    setNotes((current) => [data.note, ...current].sort(sortNotes))
    return data.note
  }, [projectId, token])

  const updateNote = useCallback(async (noteId: string, input: { body?: string; pinned?: boolean }) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update note' }))
      throw new Error((err as { error?: string }).error || 'Failed to update note')
    }

    const data = await res.json() as { note: ProjectNote }
    setNotes((current) => current.map((note) => note.id === noteId ? data.note : note).sort(sortNotes))
    return data.note
  }, [projectId, token])

  const removeNote = useCallback(async (noteId: string) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete note' }))
      throw new Error((err as { error?: string }).error || 'Failed to delete note')
    }

    setNotes((current) => current.filter((note) => note.id !== noteId))
  }, [projectId, token])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return { notes, loading, error, refetch: fetchNotes, addNote, updateNote, removeNote }
}

function sortNotes(a: ProjectNote, b: ProjectNote) {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1
  }

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}
