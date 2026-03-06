import { useCallback, useEffect, useState } from 'react'
import type { DashboardStats, InvoiceAgingBucket } from '../types/claim'
import type { Project } from '../shared/projects'

export function useProjects(token: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json() as { projects: Project[] }
      setProjects(data.projects)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, loading, error, refetch: fetchProjects }
}

export function computeStats(projects: Project[]): DashboardStats {
  return {
    totalProjects: projects.length,
    totalRevenue: projects.reduce((sum, project) => sum + (project.amount || 0), 0),
    overdueCount: projects.filter((project) => project.invoiceStatus === 'Overdue').length,
    activeCount: projects.filter((project) => !project.done && project.projectStatus !== 'Complete' && project.projectStatus !== 'Archived').length,
    missingContracts: projects.filter((project) => project.contractStatus === 'Missing').length,
    missingCOCs: projects.filter((project) => project.cocStatus === 'Missing').length,
  }
}

export function computeAging(projects: Project[]): InvoiceAgingBucket[] {
  const today = new Date().toISOString().slice(0, 10)
  const outstandingProjects = projects.filter(
    (project) => (project.invoiceStatus === 'Sent' || project.invoiceStatus === 'Overdue') && !project.paymentReceivedDate
  )

  const buckets: InvoiceAgingBucket[] = [
    { label: 'Current', range: 'Not due', count: 0, totalAmount: 0, color: 'text-aging-current bg-green-50', projects: [] },
    { label: 'Warning', range: '1-30 days overdue', count: 0, totalAmount: 0, color: 'text-aging-warning bg-yellow-50', projects: [] },
    { label: 'Late', range: '31-60 days overdue', count: 0, totalAmount: 0, color: 'text-aging-late bg-orange-50', projects: [] },
    { label: 'Critical', range: '61+ days overdue', count: 0, totalAmount: 0, color: 'text-aging-critical bg-red-50', projects: [] },
  ]

  for (const project of outstandingProjects) {
    const dueDate = project.dueDate ?? project.invoiceSentDate
    if (!dueDate) {
      buckets[0].count++
      buckets[0].totalAmount += project.amount || 0
      buckets[0].projects.push(project)
      continue
    }

    const msDiff = new Date(`${today}T00:00:00`).getTime() - new Date(`${dueDate}T00:00:00`).getTime()
    const daysPastDue = Math.max(0, Math.floor(msDiff / 86400000))
    const index = daysPastDue === 0 ? 0 : daysPastDue <= 30 ? 1 : daysPastDue <= 60 ? 2 : 3

    buckets[index].count++
    buckets[index].totalAmount += project.amount || 0
    buckets[index].projects.push(project)
  }

  return buckets
}
