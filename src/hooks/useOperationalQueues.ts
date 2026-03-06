import { useCallback, useEffect, useState } from 'react'
import type { ProjectCommunication, ProjectTask } from '../shared/projects'

export function useAllTasks(token: string) {
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const json = await res.json() as { tasks: ProjectTask[] }
      setTasks(json.tasks)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, refetch: fetchTasks }
}

export function useAllCommunications(token: string) {
  const [communications, setCommunications] = useState<ProjectCommunication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/communications', {
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
  }, [token])

  useEffect(() => {
    fetchCommunications()
  }, [fetchCommunications])

  return { communications, loading, error, refetch: fetchCommunications }
}
