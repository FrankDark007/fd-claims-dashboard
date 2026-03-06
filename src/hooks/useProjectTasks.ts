import { useCallback, useEffect, useState } from 'react'
import type { ProjectTask, ProjectTaskWriteInput } from '../shared/projects'

export function useProjectTasks(projectId: string | undefined, token: string) {
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
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
  }, [projectId, token])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const saveTasks = useCallback(async (nextTasks: ProjectTaskWriteInput[]) => {
    if (!projectId) {
      throw new Error('Project ID required')
    }

    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks: nextTasks }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save tasks' }))
      throw new Error((err as { error?: string }).error || 'Failed to save tasks')
    }

    const json = await res.json() as { tasks: ProjectTask[] }
    setTasks(json.tasks)
    setError(null)
    return json.tasks
  }, [projectId, token])

  return { tasks, loading, error, saveTasks, refetch: fetchTasks }
}
