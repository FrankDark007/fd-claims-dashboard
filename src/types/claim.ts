export type ContractStatus = 'Missing' | 'Requested' | 'Signed'
export type COCStatus = 'Missing' | 'Requested' | 'Signed'
export type FinalInvoiceStatus = 'Not Started' | 'Drafting' | 'Review' | 'Complete'
export type MatterportStatus = 'N/A' | 'Missing' | 'Has Scan'
export type RewriteStatus = 'Not Started' | 'In Progress' | 'Review' | 'Done'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue'
export type ProjectType = 'Water Mitigation' | 'Pack-out' | 'Mold Remediation'

export interface Claim {
  id: string
  notionUrl: string
  clientName: string
  invoiceId: number | null
  project: string
  projectType: ProjectType | null
  amount: number | null
  status: InvoiceStatus | null
  contract: ContractStatus | null
  coc: COCStatus | null
  finalInvoice: FinalInvoiceStatus | null
  companyCam: string
  matterport: MatterportStatus | null
  rewriteStatus: RewriteStatus | null
  xactimateNumber: string
  dateAdded: string | null
  driveFolder: string
  notes: string
  done: boolean
}

export interface User {
  userId: string
  username: string
  displayName: string
  role: 'admin' | 'member'
  email: string | null
}

export interface UserRecord {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'member'
  email?: string
  createdAt: string
}

export interface DashboardStats {
  totalClaims: number
  totalRevenue: number
  overdueCount: number
  activeCount: number
  missingContracts: number
  missingCOCs: number
}

// Project is just an alias for Claim — we're renaming the concept
export type Project = Claim

export interface InvoiceAgingBucket {
  label: string
  range: string
  count: number
  totalAmount: number
  color: string // tailwind color class
  projects: Claim[]
}

export interface ProjectActivity {
  id: string
  type: 'status_change' | 'file_upload' | 'email_sent' | 'email_received' | 'invoice_event' | 'note'
  description: string
  person?: string
  date: string
  metadata?: Record<string, unknown>
}
