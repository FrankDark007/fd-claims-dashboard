export const PROJECT_TYPES = ['Water Mitigation', 'Pack-out', 'Mold Remediation'] as const
export const PROJECT_STATUSES = ['Active', 'On Hold', 'Complete', 'Archived'] as const
export const DOCUMENT_STATUSES = ['Missing', 'Requested', 'Signed'] as const
export const FINAL_INVOICE_STATUSES = ['Not Started', 'Drafting', 'Review', 'Complete'] as const
export const DRYLOG_STATUSES = ['Missing', 'Requested', 'Received', 'N/A'] as const
export const MATTERPORT_STATUSES = ['N/A', 'Missing', 'Has Scan'] as const
export const REWRITE_STATUSES = ['Not Started', 'In Progress', 'Review', 'Done'] as const
export const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue'] as const
export const BUSINESS_CATEGORIES = ['Flood Doctor', 'Restoration Doctor', 'Galaxy Restoration'] as const
export const FILE_CATEGORIES = ['contracts', 'cocs', 'drylogs', 'invoices', 'photos', 'correspondence', 'other'] as const
export const INVOICE_EVENT_TYPES = ['sent', 'reminder', 'paid', 'disputed'] as const
export const COMMUNICATION_CHANNELS = ['email', 'phone', 'text', 'meeting'] as const
export const COMMUNICATION_DIRECTIONS = ['inbound', 'outbound'] as const
export const COMMUNICATION_STATUSES = ['planned', 'sent', 'received', 'replied', 'left_voicemail', 'no_response'] as const

export type ProjectType = typeof PROJECT_TYPES[number]
export type ProjectStatus = typeof PROJECT_STATUSES[number]
export type DocumentStatus = typeof DOCUMENT_STATUSES[number]
export type FinalInvoiceStatus = typeof FINAL_INVOICE_STATUSES[number]
export type DrylogStatus = typeof DRYLOG_STATUSES[number]
export type MatterportStatus = typeof MATTERPORT_STATUSES[number]
export type RewriteStatus = typeof REWRITE_STATUSES[number]
export type InvoiceStatus = typeof INVOICE_STATUSES[number]
export type BusinessCategory = typeof BUSINESS_CATEGORIES[number]
export type FileCategory = typeof FILE_CATEGORIES[number]
export type InvoiceEventType = typeof INVOICE_EVENT_TYPES[number]
export type CommunicationChannel = typeof COMMUNICATION_CHANNELS[number]
export type CommunicationDirection = typeof COMMUNICATION_DIRECTIONS[number]
export type CommunicationStatus = typeof COMMUNICATION_STATUSES[number]

export interface SessionUser {
  userId: string
  username: string
  displayName: string
  role: 'admin' | 'member'
  email: string | null
}

export interface UserRecord extends SessionUser {
  id: string
  createdAt: string
}

export interface Project {
  id: string
  invoiceId: number | null
  clientName: string
  projectName: string
  projectType: ProjectType | null
  projectStatus: ProjectStatus | null
  invoiceStatus: InvoiceStatus | null
  amount: number | null
  contractStatus: DocumentStatus | null
  cocStatus: DocumentStatus | null
  finalInvoiceStatus: FinalInvoiceStatus | null
  drylogStatus: DrylogStatus | null
  rewriteStatus: RewriteStatus | null
  matterportStatus: MatterportStatus | null
  companyCamUrl: string
  driveFolderUrl: string
  xactimateNumber: string
  claimNumber: string
  businessCategory: string
  carrier: string
  projectManagerName: string
  pmEmail: string
  pmPhone: string
  adjusterName: string
  adjusterEmail: string
  adjusterPhone: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  invoiceSentDate: string | null
  dueDate: string | null
  nextFollowUpDate: string | null
  paymentReceivedDate: string | null
  notes: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectFile {
  id: string
  projectId: string
  filename: string
  originalName: string
  r2Key: string
  category: FileCategory
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
}

export interface InvoiceEvent {
  id: string
  projectId: string
  type: InvoiceEventType
  recipient: string
  amount: number
  notes: string
  createdBy: string
  createdAt: string
  eventDate: string
}

export interface ProjectTask {
  id: string
  projectId: string
  title: string
  completed: boolean
  assignee: string
  dueDate: string | null
  notes: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ProjectNote {
  id: string
  projectId: string
  body: string
  pinned: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ProjectCommunication {
  id: string
  projectId: string
  channel: CommunicationChannel
  direction: CommunicationDirection
  counterpartName: string
  counterpartRole: string
  counterpartAddress: string
  subject: string
  body: string
  status: CommunicationStatus
  followUpDate: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ProjectEmail = ProjectCommunication

export interface ProjectDataResponse {
  files: ProjectFile[]
  emails: ProjectEmail[]
  invoiceEvents: InvoiceEvent[]
}

export interface ProjectTaskWriteInput {
  id?: string
  title?: string
  completed?: boolean
  assignee?: string
  dueDate?: string | null
  notes?: string
  sortOrder?: number
}

export interface ProjectCommunicationWriteInput {
  channel?: CommunicationChannel | null
  direction?: CommunicationDirection | null
  counterpartName?: string
  counterpartRole?: string
  counterpartAddress?: string
  subject?: string
  body?: string
  status?: CommunicationStatus | null
  followUpDate?: string | null
}

export interface ProjectWriteInput {
  invoiceId?: number | null
  clientName?: string
  projectName?: string
  projectType?: ProjectType | null
  projectStatus?: ProjectStatus | null
  invoiceStatus?: InvoiceStatus | null
  amount?: number | null
  contractStatus?: DocumentStatus | null
  cocStatus?: DocumentStatus | null
  finalInvoiceStatus?: FinalInvoiceStatus | null
  drylogStatus?: DrylogStatus | null
  rewriteStatus?: RewriteStatus | null
  matterportStatus?: MatterportStatus | null
  companyCamUrl?: string
  driveFolderUrl?: string
  xactimateNumber?: string
  claimNumber?: string
  businessCategory?: string
  carrier?: string
  projectManagerName?: string
  pmEmail?: string
  pmPhone?: string
  adjusterName?: string
  adjusterEmail?: string
  adjusterPhone?: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  invoiceSentDate?: string | null
  dueDate?: string | null
  nextFollowUpDate?: string | null
  paymentReceivedDate?: string | null
  notes?: string
  done?: boolean
}

function isValueInList<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && options.includes(value as T[number])
}

export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }

  return false
}

export function normalizeDateOnly(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

export function addDays(dateOnly: string, days: number): string {
  const anchor = new Date(`${dateOnly}T12:00:00.000Z`)
  anchor.setUTCDate(anchor.getUTCDate() + days)
  return anchor.toISOString().slice(0, 10)
}

export function defaultDueDate(invoiceSentDate: string | null | undefined): string | null {
  return invoiceSentDate ? addDays(invoiceSentDate, 30) : null
}

export function normalizeProjectType(value: unknown): ProjectType | null {
  return isValueInList(value, PROJECT_TYPES) ? value : null
}

export function normalizeProjectStatus(value: unknown): ProjectStatus | null {
  return isValueInList(value, PROJECT_STATUSES) ? value : null
}

export function normalizeDocumentStatus(value: unknown): DocumentStatus | null {
  return isValueInList(value, DOCUMENT_STATUSES) ? value : null
}

export function normalizeFinalInvoiceStatus(value: unknown): FinalInvoiceStatus | null {
  return isValueInList(value, FINAL_INVOICE_STATUSES) ? value : null
}

export function normalizeDrylogStatus(value: unknown): DrylogStatus | null {
  return isValueInList(value, DRYLOG_STATUSES) ? value : null
}

export function normalizeMatterportStatus(value: unknown): MatterportStatus | null {
  return isValueInList(value, MATTERPORT_STATUSES) ? value : null
}

export function normalizeRewriteStatus(value: unknown): RewriteStatus | null {
  return isValueInList(value, REWRITE_STATUSES) ? value : null
}

export function normalizeInvoiceStatus(value: unknown): InvoiceStatus | null {
  return isValueInList(value, INVOICE_STATUSES) ? value : null
}

export function normalizeBusinessCategory(value: unknown): string {
  return isValueInList(value, BUSINESS_CATEGORIES) ? value : ''
}

export function normalizeFileCategory(value: unknown): FileCategory {
  return isValueInList(value, FILE_CATEGORIES) ? value : 'other'
}

export function normalizeInvoiceEventType(value: unknown): InvoiceEventType | null {
  return isValueInList(value, INVOICE_EVENT_TYPES) ? value : null
}

export function normalizeCommunicationChannel(value: unknown): CommunicationChannel | null {
  return isValueInList(value, COMMUNICATION_CHANNELS) ? value : null
}

export function normalizeCommunicationDirection(value: unknown): CommunicationDirection | null {
  return isValueInList(value, COMMUNICATION_DIRECTIONS) ? value : null
}

export function normalizeCommunicationStatus(value: unknown): CommunicationStatus | null {
  return isValueInList(value, COMMUNICATION_STATUSES) ? value : null
}

export function buildProjectTaskTemplate(projectType: ProjectType | null): ProjectTaskWriteInput[] {
  const baseChecklist: ProjectTaskWriteInput[] = [
    { title: 'Confirm PM and adjuster contact info', completed: false },
    { title: 'Review document checklist for missing items', completed: false },
    { title: 'Log billing or collections next step', completed: false },
  ]

  if (projectType === 'Water Mitigation') {
    return [
      { title: 'Verify dry log collection cadence', completed: false },
      { title: 'Confirm Matterport / photo capture is complete', completed: false },
      ...baseChecklist,
    ]
  }

  if (projectType === 'Pack-out') {
    return [
      { title: 'Confirm inventory and pack-out scope are documented', completed: false },
      { title: 'Verify storage / return scheduling notes', completed: false },
      ...baseChecklist,
    ]
  }

  if (projectType === 'Mold Remediation') {
    return [
      { title: 'Review remediation scope and containment notes', completed: false },
      { title: 'Confirm clearance or post-work testing requirements', completed: false },
      ...baseChecklist,
    ]
  }

  return baseChecklist
}

export function computeInvoiceStatus(
  invoiceStatus: InvoiceStatus | null,
  dueDate: string | null,
  paymentReceivedDate: string | null,
  today = new Date().toISOString().slice(0, 10)
): InvoiceStatus | null {
  if (!invoiceStatus) {
    return null
  }

  if (paymentReceivedDate || invoiceStatus === 'Paid') {
    return 'Paid'
  }

  if (invoiceStatus === 'Sent' && dueDate && dueDate < today) {
    return 'Overdue'
  }

  return invoiceStatus
}
