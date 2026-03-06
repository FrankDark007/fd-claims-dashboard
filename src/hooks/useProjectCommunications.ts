import { useCallback, useEffect, useState } from 'react'
import type { ProjectCommunication, ProjectCommunicationWriteInput } from '../shared/projects'

export function useProjectCommunications(projectId: string | undefined, token: string) {
  const [communications, setCommunications] = useState<ProjectCommunication[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunications = useCallback(async () => {
    if (!projectId) {
      setCommunications([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/communications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const json = await res.json() as { communications: ProjectCommunication[] }
      setCommunications(json.communications)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load communications')
    } finally {
      setLoading(false)
    }
  }, [projectId, token])

  useEffect(() => {
    fetchCommunications()
  }, [fetchCommunications])

  const createCommunication = useCallback(async (input: ProjectCommunicationWriteInput) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/communications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create communication' }))
      throw new Error((err as { error?: string }).error || 'Failed to create communication')
    }

    const json = await res.json() as { communication: ProjectCommunication }
    setCommunications((current) => [json.communication, ...current].sort(sortCommunications))
    return json.communication
  }, [projectId, token])

  const updateCommunication = useCallback(async (communicationId: string, input: ProjectCommunicationWriteInput) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/communications/${communicationId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update communication' }))
      throw new Error((err as { error?: string }).error || 'Failed to update communication')
    }

    const json = await res.json() as { communication: ProjectCommunication }
    setCommunications((current) => current
      .map((communication) => communication.id === communicationId ? json.communication : communication)
      .sort(sortCommunications))
    return json.communication
  }, [projectId, token])

  const deleteCommunication = useCallback(async (communicationId: string) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/communications/${communicationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete communication' }))
      throw new Error((err as { error?: string }).error || 'Failed to delete communication')
    }

    setCommunications((current) => current.filter((communication) => communication.id !== communicationId))
  }, [projectId, token])

  return {
    communications,
    loading,
    error,
    refetch: fetchCommunications,
    createCommunication,
    updateCommunication,
    deleteCommunication,
  }
}

function sortCommunications(a: ProjectCommunication, b: ProjectCommunication) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}
