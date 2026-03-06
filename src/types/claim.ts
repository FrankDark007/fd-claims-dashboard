export type {
  DocumentStatus as ContractStatus,
  ProjectCommunication,
  DocumentStatus as COCStatus,
  DrylogStatus,
  FileCategory,
  FinalInvoiceStatus,
  InvoiceStatus,
  MatterportStatus,
  Project,
  ProjectStatus,
  ProjectTask,
  ProjectType,
  RewriteStatus,
  SessionUser as User,
  UserRecord,
} from '../shared/projects'
import type { Project } from '../shared/projects'

export interface DashboardStats {
  totalProjects: number
  totalRevenue: number
  overdueCount: number
  activeCount: number
  missingContracts: number
  missingCOCs: number
}

// Temporary compatibility alias while the remaining UI finishes moving off "Claim".
export type Claim = Project

export interface InvoiceAgingBucket {
  label: string
  range: string
  count: number
  totalAmount: number
  color: string // tailwind color class
  projects: Project[]
}

export interface ProjectActivity {
  id: string
  type: 'status_change' | 'file_upload' | 'email_sent' | 'email_received' | 'invoice_event' | 'note'
  description: string
  person?: string
  date: string
  metadata?: Record<string, unknown>
}
