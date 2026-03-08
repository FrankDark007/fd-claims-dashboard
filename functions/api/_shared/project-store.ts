import {
  addDays,
  computeInvoiceStatus,
  defaultDueDate,
  normalizeCommunicationChannel,
  normalizeCommunicationDirection,
  normalizeCommunicationStatus,
  normalizeBoolean,
  normalizeDateOnly,
  normalizeDocumentStatus,
  normalizeDrylogStatus,
  normalizeFileCategory,
  normalizeFinalInvoiceStatus,
  normalizeInvoiceEventType,
  normalizeInvoiceStatus,
  normalizeMatterportStatus,
  normalizeNullableNumber,
  normalizeOptionalText,
  normalizeProjectStatus,
  normalizeProjectType,
  normalizeRewriteStatus,
  normalizeBusinessCategory,
} from '../../../src/shared/projects'
import type {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
  FileCategory,
  InvoiceEvent,
  Project,
  ProjectCommunication,
  ProjectFile,
  ProjectNote,
  ProjectTask,
  ProjectCommunicationWriteInput,
  ProjectTaskWriteInput,
  ProjectWriteInput,
} from '../../../src/shared/projects'

interface ProjectRecord {
  id: string
  invoiceId: number | null
  clientName: string
  projectName: string
  projectType: string | null
  projectStatus: string | null
  invoiceStatus: string | null
  amount: number | null
  contractStatus: string | null
  cocStatus: string | null
  finalInvoiceStatus: string | null
  drylogStatus: string | null
  rewriteStatus: string | null
  matterportStatus: string | null
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
  done: number
  createdAt: string
  updatedAt: string
}

interface ProjectFileRecord {
  id: string
  projectId: string
  filename: string
  originalName: string
  r2Key: string
  category: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  uploadedAt: string
}

interface InvoiceEventRecord {
  id: string
  projectId: string
  type: string
  recipient: string
  amount: number
  notes: string
  createdBy: string
  createdAt: string
  eventDate: string
}

interface ProjectNoteRecord {
  id: string
  projectId: string
  body: string
  pinned: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface ProjectTaskRecord {
  id: string
  projectId: string
  title: string
  completed: number
  assignee: string
  dueDate: string | null
  notes: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface ProjectCommunicationRecord {
  id: string
  projectId: string
  channel: string
  direction: string
  counterpartName: string
  counterpartRole: string
  counterpartAddress: string
  subject: string
  body: string
  status: string
  followUpDate: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

const PROJECT_SELECT = `
  SELECT
    id,
    invoice_id AS invoiceId,
    client_name AS clientName,
    project_name AS projectName,
    project_type AS projectType,
    project_status AS projectStatus,
    invoice_status AS invoiceStatus,
    amount,
    contract_status AS contractStatus,
    coc_status AS cocStatus,
    final_invoice_status AS finalInvoiceStatus,
    drylog_status AS drylogStatus,
    rewrite_status AS rewriteStatus,
    matterport_status AS matterportStatus,
    company_cam_url AS companyCamUrl,
    drive_folder_url AS driveFolderUrl,
    xactimate_number AS xactimateNumber,
    claim_number AS claimNumber,
    business_category AS businessCategory,
    carrier,
    project_manager_name AS projectManagerName,
    pm_email AS pmEmail,
    pm_phone AS pmPhone,
    adjuster_name AS adjusterName,
    adjuster_email AS adjusterEmail,
    adjuster_phone AS adjusterPhone,
    client_email AS clientEmail,
    client_phone AS clientPhone,
    client_address AS clientAddress,
    invoice_sent_date AS invoiceSentDate,
    due_date AS dueDate,
    next_follow_up_date AS nextFollowUpDate,
    payment_received_date AS paymentReceivedDate,
    notes,
    done,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM projects
`

const PROJECT_FILE_SELECT = `
  SELECT
    id,
    project_id AS projectId,
    filename,
    original_name AS originalName,
    r2_key AS r2Key,
    category,
    mime_type AS mimeType,
    size_bytes AS sizeBytes,
    uploaded_by AS uploadedBy,
    uploaded_at AS uploadedAt
  FROM project_files
`

const INVOICE_EVENT_SELECT = `
  SELECT
    id,
    project_id AS projectId,
    type,
    recipient,
    amount,
    notes,
    created_by AS createdBy,
    created_at AS createdAt,
    event_date AS eventDate
  FROM invoice_events
`

const PROJECT_NOTE_SELECT = `
  SELECT
    id,
    project_id AS projectId,
    body,
    pinned,
    created_by AS createdBy,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM project_notes
`

const PROJECT_TASK_SELECT = `
  SELECT
    id,
    project_id AS projectId,
    title,
    completed,
    assignee,
    due_date AS dueDate,
    notes,
    sort_order AS sortOrder,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM project_tasks
`

const PROJECT_COMMUNICATION_SELECT = `
  SELECT
    id,
    project_id AS projectId,
    channel,
    direction,
    counterpart_name AS counterpartName,
    counterpart_role AS counterpartRole,
    counterpart_address AS counterpartAddress,
    subject,
    body,
    status,
    follow_up_date AS followUpDate,
    created_by AS createdBy,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM project_communications
`

const PROJECT_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    invoice_id INTEGER,
    client_name TEXT NOT NULL,
    project_name TEXT NOT NULL DEFAULT '',
    project_type TEXT,
    project_status TEXT NOT NULL DEFAULT 'Active',
    invoice_status TEXT NOT NULL DEFAULT 'Draft',
    amount REAL,
    contract_status TEXT NOT NULL DEFAULT 'Missing',
    coc_status TEXT NOT NULL DEFAULT 'Missing',
    final_invoice_status TEXT NOT NULL DEFAULT 'Not Started',
    drylog_status TEXT NOT NULL DEFAULT 'Missing',
    rewrite_status TEXT NOT NULL DEFAULT 'Not Started',
    matterport_status TEXT NOT NULL DEFAULT 'N/A',
    company_cam_url TEXT NOT NULL DEFAULT '',
    drive_folder_url TEXT NOT NULL DEFAULT '',
    xactimate_number TEXT NOT NULL DEFAULT '',
    claim_number TEXT NOT NULL DEFAULT '',
    carrier TEXT NOT NULL DEFAULT '',
    project_manager_name TEXT NOT NULL DEFAULT '',
    pm_email TEXT NOT NULL DEFAULT '',
    pm_phone TEXT NOT NULL DEFAULT '',
    adjuster_name TEXT NOT NULL DEFAULT '',
    adjuster_email TEXT NOT NULL DEFAULT '',
    adjuster_phone TEXT NOT NULL DEFAULT '',
    client_email TEXT NOT NULL DEFAULT '',
    client_phone TEXT NOT NULL DEFAULT '',
    client_address TEXT NOT NULL DEFAULT '',
    invoice_sent_date TEXT,
    due_date TEXT,
    payment_received_date TEXT,
    notes TEXT NOT NULL DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_projects_invoice_status ON projects(invoice_status)',
  'CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status)',
  'CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date)',
  'CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC)',
  `CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category)',
  `CREATE TABLE IF NOT EXISTS invoice_events (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    type TEXT NOT NULL,
    recipient TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    event_date TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_invoice_events_project_id ON invoice_events(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoice_events_event_date ON invoice_events(event_date DESC)',
  `CREATE TABLE IF NOT EXISTS project_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    assignee TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    notes TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_project_tasks_sort_order ON project_tasks(project_id, sort_order)',
  `CREATE TABLE IF NOT EXISTS project_communications (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email',
    direction TEXT NOT NULL DEFAULT 'outbound',
    counterpart_name TEXT NOT NULL DEFAULT '',
    counterpart_role TEXT NOT NULL DEFAULT '',
    counterpart_address TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planned',
    follow_up_date TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_project_communications_project_id ON project_communications(project_id, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_project_communications_follow_up_date ON project_communications(follow_up_date)',
  `CREATE TABLE IF NOT EXISTS project_notes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    body TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,
  'CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_project_notes_pinned ON project_notes(project_id, pinned DESC, updated_at DESC)',
]

let schemaBootstrapPromise: Promise<void> | null = null

function shouldBootstrapProjectSchema(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes('no such table:') || error.message.includes('no such column:')
}

async function ensureProjectSchema(db: D1Database): Promise<void> {
  if (!schemaBootstrapPromise) {
    schemaBootstrapPromise = (async () => {
      for (const statement of PROJECT_SCHEMA_STATEMENTS) {
        await db.prepare(statement).run()
      }

      const projectColumns = await db.prepare('PRAGMA table_info(projects)').all<{ name: string }>()
      const colNames = new Set((projectColumns.results ?? []).map((c) => c.name))

      if (!colNames.has('next_follow_up_date')) {
        await db.prepare('ALTER TABLE projects ADD COLUMN next_follow_up_date TEXT').run()
      }
      if (!colNames.has('client_email')) {
        await db.prepare("ALTER TABLE projects ADD COLUMN client_email TEXT NOT NULL DEFAULT ''").run()
      }
      if (!colNames.has('client_phone')) {
        await db.prepare("ALTER TABLE projects ADD COLUMN client_phone TEXT NOT NULL DEFAULT ''").run()
      }
      if (!colNames.has('client_address')) {
        await db.prepare("ALTER TABLE projects ADD COLUMN client_address TEXT NOT NULL DEFAULT ''").run()
      }

      await db.prepare('CREATE INDEX IF NOT EXISTS idx_projects_next_follow_up_date ON projects(next_follow_up_date)').run()

      // Share link views table
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS share_link_views (
          id TEXT PRIMARY KEY,
          share_token TEXT NOT NULL,
          project_id TEXT NOT NULL,
          file_id TEXT NOT NULL,
          ip_address TEXT NOT NULL DEFAULT '',
          user_agent TEXT NOT NULL DEFAULT '',
          referrer TEXT NOT NULL DEFAULT '',
          viewed_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `).run()
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_share_link_views_token ON share_link_views(share_token)').run()
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_share_link_views_project_id ON share_link_views(project_id)').run()
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_share_link_views_viewed_at ON share_link_views(viewed_at DESC)').run()
    })().catch((error) => {
      schemaBootstrapPromise = null
      throw error
    })
  }

  await schemaBootstrapPromise
}

async function withProjectSchema<T>(db: D1Database, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!shouldBootstrapProjectSchema(error)) {
      throw error
    }

    await ensureProjectSchema(db)
    return operation()
  }
}

function mapProjectRecord(record: ProjectRecord): Project {
  return {
    id: record.id,
    invoiceId: record.invoiceId,
    clientName: record.clientName,
    projectName: record.projectName,
    projectType: normalizeProjectType(record.projectType),
    projectStatus: normalizeProjectStatus(record.projectStatus),
    invoiceStatus: computeInvoiceStatus(
      normalizeInvoiceStatus(record.invoiceStatus),
      record.dueDate,
      record.paymentReceivedDate
    ),
    amount: record.amount,
    contractStatus: normalizeDocumentStatus(record.contractStatus),
    cocStatus: normalizeDocumentStatus(record.cocStatus),
    finalInvoiceStatus: normalizeFinalInvoiceStatus(record.finalInvoiceStatus),
    drylogStatus: normalizeDrylogStatus(record.drylogStatus),
    rewriteStatus: normalizeRewriteStatus(record.rewriteStatus),
    matterportStatus: normalizeMatterportStatus(record.matterportStatus),
    companyCamUrl: record.companyCamUrl ?? '',
    driveFolderUrl: record.driveFolderUrl ?? '',
    xactimateNumber: record.xactimateNumber ?? '',
    claimNumber: record.claimNumber ?? '',
    businessCategory: record.businessCategory ?? '',
    carrier: record.carrier ?? '',
    projectManagerName: record.projectManagerName ?? '',
    pmEmail: record.pmEmail ?? '',
    pmPhone: record.pmPhone ?? '',
    adjusterName: record.adjusterName ?? '',
    adjusterEmail: record.adjusterEmail ?? '',
    adjusterPhone: record.adjusterPhone ?? '',
    clientEmail: record.clientEmail ?? '',
    clientPhone: record.clientPhone ?? '',
    clientAddress: record.clientAddress ?? '',
    invoiceSentDate: record.invoiceSentDate,
    dueDate: record.dueDate,
    nextFollowUpDate: record.nextFollowUpDate,
    paymentReceivedDate: record.paymentReceivedDate,
    notes: record.notes ?? '',
    done: normalizeBoolean(record.done),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function mapProjectFileRecord(record: ProjectFileRecord): ProjectFile {
  return {
    id: record.id,
    projectId: record.projectId,
    filename: record.filename,
    originalName: record.originalName,
    r2Key: record.r2Key,
    category: normalizeFileCategory(record.category),
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    uploadedBy: record.uploadedBy,
    uploadedAt: record.uploadedAt,
  }
}

function mapInvoiceEventRecord(record: InvoiceEventRecord): InvoiceEvent {
  return {
    id: record.id,
    projectId: record.projectId,
    type: normalizeInvoiceEventType(record.type) ?? 'sent',
    recipient: record.recipient ?? '',
    amount: record.amount ?? 0,
    notes: record.notes ?? '',
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    eventDate: record.eventDate,
  }
}

function mapProjectNoteRecord(record: ProjectNoteRecord): ProjectNote {
  return {
    id: record.id,
    projectId: record.projectId,
    body: record.body,
    pinned: normalizeBoolean(record.pinned),
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function mapProjectTaskRecord(record: ProjectTaskRecord): ProjectTask {
  return {
    id: record.id,
    projectId: record.projectId,
    title: record.title,
    completed: normalizeBoolean(record.completed),
    assignee: record.assignee ?? '',
    dueDate: record.dueDate,
    notes: record.notes ?? '',
    sortOrder: record.sortOrder ?? 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function mapProjectCommunicationRecord(record: ProjectCommunicationRecord): ProjectCommunication {
  return {
    id: record.id,
    projectId: record.projectId,
    channel: normalizeCommunicationChannel(record.channel) ?? 'email',
    direction: normalizeCommunicationDirection(record.direction) ?? 'outbound',
    counterpartName: record.counterpartName ?? '',
    counterpartRole: record.counterpartRole ?? '',
    counterpartAddress: record.counterpartAddress ?? '',
    subject: record.subject ?? '',
    body: record.body ?? '',
    status: normalizeCommunicationStatus(record.status) ?? 'planned',
    followUpDate: record.followUpDate,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function normalizeProjectRecordInput(input: ProjectWriteInput, existing?: ProjectRecord): ProjectRecord {
  const invoiceSentDate = input.invoiceSentDate !== undefined
    ? normalizeDateOnly(input.invoiceSentDate)
    : existing?.invoiceSentDate ?? null

  let dueDate = input.dueDate !== undefined
    ? normalizeDateOnly(input.dueDate)
    : existing?.dueDate ?? null

  if (invoiceSentDate && !dueDate) {
    dueDate = defaultDueDate(invoiceSentDate)
  }

  const paymentReceivedDate = input.paymentReceivedDate !== undefined
    ? normalizeDateOnly(input.paymentReceivedDate)
    : existing?.paymentReceivedDate ?? null

  let nextFollowUpDate = input.nextFollowUpDate !== undefined
    ? normalizeDateOnly(input.nextFollowUpDate)
    : existing?.nextFollowUpDate ?? null

  let invoiceStatus = input.invoiceStatus !== undefined
    ? normalizeInvoiceStatus(input.invoiceStatus)
    : normalizeInvoiceStatus(existing?.invoiceStatus) ?? 'Draft'

  if (paymentReceivedDate) {
    invoiceStatus = 'Paid'
    nextFollowUpDate = null
  } else if (invoiceSentDate && (invoiceStatus === null || invoiceStatus === 'Draft')) {
    invoiceStatus = 'Sent'
  } else if (!invoiceSentDate && invoiceStatus === 'Paid') {
    invoiceStatus = 'Draft'
  }

  if (
    input.paymentReceivedDate !== undefined &&
    paymentReceivedDate === null &&
    existing?.paymentReceivedDate &&
    invoiceStatus === 'Paid'
  ) {
    invoiceStatus = invoiceSentDate ? 'Sent' : 'Draft'
  }

  if (!existing && !nextFollowUpDate && dueDate) {
    nextFollowUpDate = dueDate
  }

  if (
    input.invoiceSentDate !== undefined &&
    input.nextFollowUpDate === undefined &&
    !paymentReceivedDate &&
    !existing?.nextFollowUpDate
  ) {
    nextFollowUpDate = dueDate
  }

  return {
    id: existing?.id ?? crypto.randomUUID(),
    invoiceId: input.invoiceId !== undefined ? normalizeNullableNumber(input.invoiceId) : existing?.invoiceId ?? null,
    clientName: input.clientName !== undefined ? normalizeOptionalText(input.clientName) : existing?.clientName ?? '',
    projectName: input.projectName !== undefined ? normalizeOptionalText(input.projectName) : existing?.projectName ?? '',
    projectType: input.projectType !== undefined ? normalizeProjectType(input.projectType) : normalizeProjectType(existing?.projectType),
    projectStatus: input.projectStatus !== undefined ? normalizeProjectStatus(input.projectStatus) : normalizeProjectStatus(existing?.projectStatus) ?? 'Active',
    invoiceStatus,
    amount: input.amount !== undefined ? normalizeNullableNumber(input.amount) : existing?.amount ?? null,
    contractStatus: input.contractStatus !== undefined ? normalizeDocumentStatus(input.contractStatus) : normalizeDocumentStatus(existing?.contractStatus) ?? 'Missing',
    cocStatus: input.cocStatus !== undefined ? normalizeDocumentStatus(input.cocStatus) : normalizeDocumentStatus(existing?.cocStatus) ?? 'Missing',
    finalInvoiceStatus: input.finalInvoiceStatus !== undefined
      ? normalizeFinalInvoiceStatus(input.finalInvoiceStatus)
      : normalizeFinalInvoiceStatus(existing?.finalInvoiceStatus) ?? 'Not Started',
    drylogStatus: input.drylogStatus !== undefined
      ? normalizeDrylogStatus(input.drylogStatus)
      : normalizeDrylogStatus(existing?.drylogStatus) ?? 'Missing',
    rewriteStatus: input.rewriteStatus !== undefined
      ? normalizeRewriteStatus(input.rewriteStatus)
      : normalizeRewriteStatus(existing?.rewriteStatus) ?? 'Not Started',
    matterportStatus: input.matterportStatus !== undefined
      ? normalizeMatterportStatus(input.matterportStatus)
      : normalizeMatterportStatus(existing?.matterportStatus) ?? 'N/A',
    companyCamUrl: input.companyCamUrl !== undefined ? normalizeOptionalText(input.companyCamUrl) : existing?.companyCamUrl ?? '',
    driveFolderUrl: input.driveFolderUrl !== undefined ? normalizeOptionalText(input.driveFolderUrl) : existing?.driveFolderUrl ?? '',
    xactimateNumber: input.xactimateNumber !== undefined ? normalizeOptionalText(input.xactimateNumber) : existing?.xactimateNumber ?? '',
    claimNumber: input.claimNumber !== undefined ? normalizeOptionalText(input.claimNumber) : existing?.claimNumber ?? '',
    businessCategory: input.businessCategory !== undefined ? normalizeOptionalText(input.businessCategory) : existing?.businessCategory ?? '',
    carrier: input.carrier !== undefined ? normalizeOptionalText(input.carrier) : existing?.carrier ?? '',
    projectManagerName: input.projectManagerName !== undefined ? normalizeOptionalText(input.projectManagerName) : existing?.projectManagerName ?? '',
    pmEmail: input.pmEmail !== undefined ? normalizeOptionalText(input.pmEmail) : existing?.pmEmail ?? '',
    pmPhone: input.pmPhone !== undefined ? normalizeOptionalText(input.pmPhone) : existing?.pmPhone ?? '',
    adjusterName: input.adjusterName !== undefined ? normalizeOptionalText(input.adjusterName) : existing?.adjusterName ?? '',
    adjusterEmail: input.adjusterEmail !== undefined ? normalizeOptionalText(input.adjusterEmail) : existing?.adjusterEmail ?? '',
    adjusterPhone: input.adjusterPhone !== undefined ? normalizeOptionalText(input.adjusterPhone) : existing?.adjusterPhone ?? '',
    clientEmail: input.clientEmail !== undefined ? normalizeOptionalText(input.clientEmail) : existing?.clientEmail ?? '',
    clientPhone: input.clientPhone !== undefined ? normalizeOptionalText(input.clientPhone) : existing?.clientPhone ?? '',
    clientAddress: input.clientAddress !== undefined ? normalizeOptionalText(input.clientAddress) : existing?.clientAddress ?? '',
    invoiceSentDate,
    dueDate,
    nextFollowUpDate,
    paymentReceivedDate,
    notes: input.notes !== undefined ? normalizeOptionalText(input.notes) : existing?.notes ?? '',
    done: input.done !== undefined ? (normalizeBoolean(input.done) ? 1 : 0) : existing?.done ?? 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

async function getProjectRecord(db: D1Database, projectId: string): Promise<ProjectRecord | null> {
  return withProjectSchema(db, async () => {
    const record = await db.prepare(`${PROJECT_SELECT} WHERE id = ?`).bind(projectId).first<ProjectRecord>()
    return record ?? null
  })
}

async function insertOrReplaceProject(db: D1Database, project: ProjectRecord): Promise<void> {
  await withProjectSchema(db, async () => {
    await db.prepare(`
      INSERT INTO projects (
        id, invoice_id, client_name, project_name, project_type, project_status, invoice_status,
        amount, contract_status, coc_status, final_invoice_status, drylog_status, rewrite_status,
        matterport_status, company_cam_url, drive_folder_url, xactimate_number, claim_number,
        business_category, carrier, project_manager_name, pm_email, pm_phone, adjuster_name, adjuster_email,
        adjuster_phone, client_email, client_phone, client_address,
        invoice_sent_date, due_date, next_follow_up_date, payment_received_date,
        notes, done, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        invoice_id = excluded.invoice_id,
        client_name = excluded.client_name,
        project_name = excluded.project_name,
        project_type = excluded.project_type,
        project_status = excluded.project_status,
        invoice_status = excluded.invoice_status,
        amount = excluded.amount,
        contract_status = excluded.contract_status,
        coc_status = excluded.coc_status,
        final_invoice_status = excluded.final_invoice_status,
        drylog_status = excluded.drylog_status,
        rewrite_status = excluded.rewrite_status,
        matterport_status = excluded.matterport_status,
        company_cam_url = excluded.company_cam_url,
        drive_folder_url = excluded.drive_folder_url,
        xactimate_number = excluded.xactimate_number,
        claim_number = excluded.claim_number,
        business_category = excluded.business_category,
        carrier = excluded.carrier,
        project_manager_name = excluded.project_manager_name,
        pm_email = excluded.pm_email,
        pm_phone = excluded.pm_phone,
        adjuster_name = excluded.adjuster_name,
        adjuster_email = excluded.adjuster_email,
        adjuster_phone = excluded.adjuster_phone,
        client_email = excluded.client_email,
        client_phone = excluded.client_phone,
        client_address = excluded.client_address,
        invoice_sent_date = excluded.invoice_sent_date,
        due_date = excluded.due_date,
        next_follow_up_date = excluded.next_follow_up_date,
        payment_received_date = excluded.payment_received_date,
        notes = excluded.notes,
        done = excluded.done,
        updated_at = excluded.updated_at
    `).bind(
      project.id,
      project.invoiceId,
      project.clientName,
      project.projectName,
      project.projectType,
      project.projectStatus,
      project.invoiceStatus,
      project.amount,
      project.contractStatus,
      project.cocStatus,
      project.finalInvoiceStatus,
      project.drylogStatus,
      project.rewriteStatus,
      project.matterportStatus,
      project.companyCamUrl,
      project.driveFolderUrl,
      project.xactimateNumber,
      project.claimNumber,
      project.businessCategory,
      project.carrier,
      project.projectManagerName,
      project.pmEmail,
      project.pmPhone,
      project.adjusterName,
      project.adjusterEmail,
      project.adjusterPhone,
      project.clientEmail,
      project.clientPhone,
      project.clientAddress,
      project.invoiceSentDate,
      project.dueDate,
      project.nextFollowUpDate,
      project.paymentReceivedDate,
      project.notes,
      project.done,
      project.createdAt,
      project.updatedAt
    ).run()
  })
}

export async function listProjects(db: D1Database): Promise<Project[]> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(`${PROJECT_SELECT} ORDER BY updated_at DESC, created_at DESC`).all<ProjectRecord>()
    return (result.results ?? []).map(mapProjectRecord)
  })
}

export async function getProjectById(db: D1Database, projectId: string): Promise<Project | null> {
  const record = await getProjectRecord(db, projectId)
  return record ? mapProjectRecord(record) : null
}

export async function createProject(db: D1Database, input: ProjectWriteInput): Promise<Project> {
  const projectRecord = normalizeProjectRecordInput(input)
  await insertOrReplaceProject(db, projectRecord)
  return mapProjectRecord(projectRecord)
}

export async function updateProject(db: D1Database, projectId: string, input: ProjectWriteInput): Promise<Project | null> {
  const existing = await getProjectRecord(db, projectId)
  if (!existing) {
    return null
  }

  const next = normalizeProjectRecordInput(input, existing)
  await insertOrReplaceProject(db, next)
  return mapProjectRecord(next)
}

export async function listProjectFiles(db: D1Database, projectId: string): Promise<ProjectFile[]> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(`${PROJECT_FILE_SELECT} WHERE project_id = ? ORDER BY uploaded_at DESC`).bind(projectId).all<ProjectFileRecord>()
    return (result.results ?? []).map(mapProjectFileRecord)
  })
}

export async function getProjectFileById(db: D1Database, projectId: string, fileId: string): Promise<ProjectFile | null> {
  return withProjectSchema(db, async () => {
    const record = await db.prepare(`${PROJECT_FILE_SELECT} WHERE project_id = ? AND id = ?`).bind(projectId, fileId).first<ProjectFileRecord>()
    return record ? mapProjectFileRecord(record) : null
  })
}

export async function createProjectFile(
  db: D1Database,
  params: {
    projectId: string
    filename: string
    originalName: string
    r2Key: string
    category: FileCategory
    mimeType: string
    sizeBytes: number
    uploadedBy: string
  }
): Promise<ProjectFile> {
  return withProjectSchema(db, async () => {
    const file: ProjectFile = {
      id: crypto.randomUUID(),
      projectId: params.projectId,
      filename: params.filename,
      originalName: params.originalName,
      r2Key: params.r2Key,
      category: params.category,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      uploadedBy: params.uploadedBy,
      uploadedAt: new Date().toISOString(),
    }

    await db.prepare(`
      INSERT INTO project_files (
        id, project_id, filename, original_name, r2_key, category, mime_type, size_bytes, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      file.id,
      file.projectId,
      file.filename,
      file.originalName,
      file.r2Key,
      file.category,
      file.mimeType,
      file.sizeBytes,
      file.uploadedBy,
      file.uploadedAt
    ).run()

    return file
  })
}

export async function deleteProjectFile(db: D1Database, projectId: string, fileId: string): Promise<ProjectFile | null> {
  const file = await getProjectFileById(db, projectId, fileId)
  if (!file) {
    return null
  }

  await db.prepare('DELETE FROM project_files WHERE project_id = ? AND id = ?').bind(projectId, fileId).run()
  return file
}

export async function listProjectNotes(db: D1Database, projectId: string): Promise<ProjectNote[]> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(
      `${PROJECT_NOTE_SELECT} WHERE project_id = ? ORDER BY pinned DESC, updated_at DESC, created_at DESC`
    ).bind(projectId).all<ProjectNoteRecord>()

    return (result.results ?? []).map(mapProjectNoteRecord)
  })
}

export async function listProjectTasks(db: D1Database, projectId: string): Promise<ProjectTask[]> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(
      `${PROJECT_TASK_SELECT} WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC`
    ).bind(projectId).all<ProjectTaskRecord>()

    return (result.results ?? []).map(mapProjectTaskRecord)
  })
}

export async function listAllProjectTasks(db: D1Database): Promise<ProjectTask[]> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(
      `${PROJECT_TASK_SELECT} ORDER BY
        CASE WHEN due_date IS NULL OR due_date = '' THEN 1 ELSE 0 END,
        due_date ASC,
        completed ASC,
        updated_at DESC`
    ).all<ProjectTaskRecord>()

    return (result.results ?? []).map(mapProjectTaskRecord)
  })
}

export async function listProjectCommunications(db: D1Database, projectId?: string): Promise<ProjectCommunication[]> {
  return withProjectSchema(db, async () => {
    const query = projectId
      ? `${PROJECT_COMMUNICATION_SELECT} WHERE project_id = ? ORDER BY updated_at DESC, created_at DESC`
      : `${PROJECT_COMMUNICATION_SELECT} ORDER BY updated_at DESC, created_at DESC`

    const statement = projectId ? db.prepare(query).bind(projectId) : db.prepare(query)
    const result = await statement.all<ProjectCommunicationRecord>()
    return (result.results ?? []).map(mapProjectCommunicationRecord)
  })
}

export async function replaceProjectTasks(
  db: D1Database,
  projectId: string,
  tasks: ProjectTaskWriteInput[],
): Promise<ProjectTask[]> {
  return withProjectSchema(db, async () => {
    const existingProject = await getProjectRecord(db, projectId)
    if (!existingProject) {
      throw new Error('Project not found')
    }

    const existingTasks = await listProjectTasks(db, projectId)
    const existingById = new Map(existingTasks.map((task) => [task.id, task]))

    await db.prepare('DELETE FROM project_tasks WHERE project_id = ?').bind(projectId).run()

    const normalizedTasks = tasks
      .map((task, index) => {
        const existing = task.id ? existingById.get(task.id) : null
        const title = normalizeOptionalText(task.title)

        return {
          id: existing?.id ?? task.id ?? crypto.randomUUID(),
          projectId,
          title,
          completed: normalizeBoolean(task.completed),
          assignee: normalizeOptionalText(task.assignee),
          dueDate: normalizeDateOnly(task.dueDate),
          notes: normalizeOptionalText(task.notes),
          sortOrder: typeof task.sortOrder === 'number' && Number.isFinite(task.sortOrder) ? task.sortOrder : index,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
      .filter((task) => task.title.length > 0)

    for (const task of normalizedTasks) {
      await db.prepare(`
        INSERT INTO project_tasks (
          id, project_id, title, completed, assignee, due_date, notes, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        task.id,
        task.projectId,
        task.title,
        task.completed ? 1 : 0,
        task.assignee,
        task.dueDate,
        task.notes,
        task.sortOrder,
        task.createdAt,
        task.updatedAt,
      ).run()
    }

    return listProjectTasks(db, projectId)
  })
}

export async function createProjectNote(
  db: D1Database,
  params: {
    projectId: string
    body: string
    pinned?: boolean
    createdBy: string
  }
): Promise<ProjectNote> {
  return withProjectSchema(db, async () => {
    const now = new Date().toISOString()
    const note: ProjectNote = {
      id: crypto.randomUUID(),
      projectId: params.projectId,
      body: normalizeOptionalText(params.body),
      pinned: params.pinned ?? false,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    }

    await db.prepare(`
      INSERT INTO project_notes (
        id, project_id, body, pinned, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      note.id,
      note.projectId,
      note.body,
      note.pinned ? 1 : 0,
      note.createdBy,
      note.createdAt,
      note.updatedAt
    ).run()

    return note
  })
}

export async function createProjectCommunication(
  db: D1Database,
  params: {
    projectId: string
    channel?: CommunicationChannel | null
    direction?: CommunicationDirection | null
    counterpartName?: string
    counterpartRole?: string
    counterpartAddress?: string
    subject?: string
    body?: string
    status?: CommunicationStatus | null
    followUpDate?: string | null
    createdBy: string
  }
): Promise<ProjectCommunication> {
  return withProjectSchema(db, async () => {
    const now = new Date().toISOString()
    const communication: ProjectCommunication = {
      id: crypto.randomUUID(),
      projectId: params.projectId,
      channel: normalizeCommunicationChannel(params.channel) ?? 'email',
      direction: normalizeCommunicationDirection(params.direction) ?? 'outbound',
      counterpartName: normalizeOptionalText(params.counterpartName),
      counterpartRole: normalizeOptionalText(params.counterpartRole),
      counterpartAddress: normalizeOptionalText(params.counterpartAddress),
      subject: normalizeOptionalText(params.subject),
      body: normalizeOptionalText(params.body),
      status: normalizeCommunicationStatus(params.status) ?? 'planned',
      followUpDate: normalizeDateOnly(params.followUpDate),
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    }

    await db.prepare(`
      INSERT INTO project_communications (
        id, project_id, channel, direction, counterpart_name, counterpart_role, counterpart_address,
        subject, body, status, follow_up_date, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      communication.id,
      communication.projectId,
      communication.channel,
      communication.direction,
      communication.counterpartName,
      communication.counterpartRole,
      communication.counterpartAddress,
      communication.subject,
      communication.body,
      communication.status,
      communication.followUpDate,
      communication.createdBy,
      communication.createdAt,
      communication.updatedAt,
    ).run()

    return communication
  })
}

export async function updateProjectCommunication(
  db: D1Database,
  params: {
    projectId: string
    communicationId: string
    input: ProjectCommunicationWriteInput
  }
): Promise<ProjectCommunication | null> {
  return withProjectSchema(db, async () => {
    const existing = await db.prepare(
      `${PROJECT_COMMUNICATION_SELECT} WHERE project_id = ? AND id = ?`
    ).bind(params.projectId, params.communicationId).first<ProjectCommunicationRecord>()

    if (!existing) {
      return null
    }

    const next: ProjectCommunication = {
      id: existing.id,
      projectId: existing.projectId,
      channel: params.input.channel !== undefined
        ? normalizeCommunicationChannel(params.input.channel) ?? 'email'
        : normalizeCommunicationChannel(existing.channel) ?? 'email',
      direction: params.input.direction !== undefined
        ? normalizeCommunicationDirection(params.input.direction) ?? 'outbound'
        : normalizeCommunicationDirection(existing.direction) ?? 'outbound',
      counterpartName: params.input.counterpartName !== undefined ? normalizeOptionalText(params.input.counterpartName) : existing.counterpartName,
      counterpartRole: params.input.counterpartRole !== undefined ? normalizeOptionalText(params.input.counterpartRole) : existing.counterpartRole,
      counterpartAddress: params.input.counterpartAddress !== undefined ? normalizeOptionalText(params.input.counterpartAddress) : existing.counterpartAddress,
      subject: params.input.subject !== undefined ? normalizeOptionalText(params.input.subject) : existing.subject,
      body: params.input.body !== undefined ? normalizeOptionalText(params.input.body) : existing.body,
      status: params.input.status !== undefined
        ? normalizeCommunicationStatus(params.input.status) ?? 'planned'
        : normalizeCommunicationStatus(existing.status) ?? 'planned',
      followUpDate: params.input.followUpDate !== undefined ? normalizeDateOnly(params.input.followUpDate) : existing.followUpDate,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }

    await db.prepare(`
      UPDATE project_communications
      SET channel = ?, direction = ?, counterpart_name = ?, counterpart_role = ?, counterpart_address = ?,
          subject = ?, body = ?, status = ?, follow_up_date = ?, updated_at = ?
      WHERE project_id = ? AND id = ?
    `).bind(
      next.channel,
      next.direction,
      next.counterpartName,
      next.counterpartRole,
      next.counterpartAddress,
      next.subject,
      next.body,
      next.status,
      next.followUpDate,
      next.updatedAt,
      params.projectId,
      params.communicationId,
    ).run()

    return next
  })
}

export async function deleteProjectCommunication(
  db: D1Database,
  projectId: string,
  communicationId: string,
): Promise<boolean> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(
      'DELETE FROM project_communications WHERE project_id = ? AND id = ?'
    ).bind(projectId, communicationId).run()

    return (result.meta.changes ?? 0) > 0
  })
}

export async function updateProjectNote(
  db: D1Database,
  params: {
    projectId: string
    noteId: string
    body?: string
    pinned?: boolean
  }
): Promise<ProjectNote | null> {
  return withProjectSchema(db, async () => {
    const existing = await db.prepare(
      `${PROJECT_NOTE_SELECT} WHERE project_id = ? AND id = ?`
    ).bind(params.projectId, params.noteId).first<ProjectNoteRecord>()

    if (!existing) {
      return null
    }

    const next: ProjectNote = {
      id: existing.id,
      projectId: existing.projectId,
      body: params.body !== undefined ? normalizeOptionalText(params.body) : existing.body,
      pinned: params.pinned !== undefined ? params.pinned : normalizeBoolean(existing.pinned),
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }

    await db.prepare(`
      UPDATE project_notes
      SET body = ?, pinned = ?, updated_at = ?
      WHERE project_id = ? AND id = ?
    `).bind(
      next.body,
      next.pinned ? 1 : 0,
      next.updatedAt,
      params.projectId,
      params.noteId
    ).run()

    return next
  })
}

export async function deleteProjectNote(db: D1Database, projectId: string, noteId: string): Promise<boolean> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(
      'DELETE FROM project_notes WHERE project_id = ? AND id = ?'
    ).bind(projectId, noteId).run()

    return (result.meta.changes ?? 0) > 0
  })
}

export async function listInvoiceEvents(db: D1Database, projectId?: string): Promise<InvoiceEvent[]> {
  return withProjectSchema(db, async () => {
    const query = projectId
      ? `${INVOICE_EVENT_SELECT} WHERE project_id = ? ORDER BY event_date DESC, created_at DESC`
      : `${INVOICE_EVENT_SELECT} ORDER BY event_date DESC, created_at DESC`

    const statement = projectId ? db.prepare(query).bind(projectId) : db.prepare(query)
    const result = await statement.all<InvoiceEventRecord>()
    return (result.results ?? []).map(mapInvoiceEventRecord)
  })
}

export async function getInvoiceEventById(
  db: D1Database,
  projectId: string,
  eventId: string
): Promise<InvoiceEvent | null> {
  return withProjectSchema(db, async () => {
    const record = await db.prepare(
      `${INVOICE_EVENT_SELECT} WHERE project_id = ? AND id = ?`
    ).bind(projectId, eventId).first<InvoiceEventRecord>()

    return record ? mapInvoiceEventRecord(record) : null
  })
}

function getLatestInvoiceEvent(events: InvoiceEvent[], type: InvoiceEvent['type']): InvoiceEvent | null {
  const matching = events
    .filter((event) => event.type === type)
    .sort((a, b) => {
      const eventDateDiff = new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
      if (eventDateDiff !== 0) {
        return eventDateDiff
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return matching[0] ?? null
}

async function reconcileProjectInvoiceWorkflow(
  db: D1Database,
  projectId: string,
  previousEvent?: InvoiceEvent | null,
  nextEvent?: InvoiceEvent | null
): Promise<void> {
  const project = await getProjectRecord(db, projectId)
  if (!project) {
    return
  }

  const events = await listInvoiceEvents(db, projectId)
  const latestSent = getLatestInvoiceEvent(events, 'sent')
  const latestReminder = getLatestInvoiceEvent(events, 'reminder')
  const latestPaid = getLatestInvoiceEvent(events, 'paid')
  const patch: ProjectWriteInput = {}

  const oldDerivedDueDate = previousEvent?.type === 'sent' ? defaultDueDate(previousEvent.eventDate) : null
  const oldDerivedFollowUpDate = previousEvent?.type === 'reminder'
    ? addDays(previousEvent.eventDate, 7)
    : previousEvent?.type === 'sent'
      ? defaultDueDate(previousEvent.eventDate)
      : null

  const shouldSyncSentDate = nextEvent?.type === 'sent'
    || (!project.invoiceSentDate)
    || (previousEvent?.type === 'sent' && project.invoiceSentDate === previousEvent.eventDate)

  if ((previousEvent?.type === 'sent' || nextEvent?.type === 'sent') && shouldSyncSentDate) {
    patch.invoiceSentDate = latestSent?.eventDate ?? null
  }

  const shouldSyncDueDate = nextEvent?.type === 'sent'
    || (!project.dueDate)
    || (oldDerivedDueDate !== null && project.dueDate === oldDerivedDueDate)

  if ((previousEvent?.type === 'sent' || nextEvent?.type === 'sent') && shouldSyncDueDate) {
    patch.dueDate = latestSent ? defaultDueDate(latestSent.eventDate) : null
  }

  if (latestPaid) {
    if (project.paymentReceivedDate !== latestPaid.eventDate) {
      patch.paymentReceivedDate = latestPaid.eventDate
    }

    if (project.invoiceStatus !== 'Paid') {
      patch.invoiceStatus = 'Paid'
    }

    if (project.nextFollowUpDate !== null) {
      patch.nextFollowUpDate = null
    }
  } else {
    if (previousEvent?.type === 'paid' && project.paymentReceivedDate === previousEvent.eventDate) {
      patch.paymentReceivedDate = null
    }

    if (previousEvent?.type === 'paid' && project.invoiceStatus === 'Paid') {
      patch.invoiceStatus = latestSent ? 'Sent' : 'Draft'
    }

    const derivedFollowUpDate = latestReminder
      ? addDays(latestReminder.eventDate, 7)
      : latestSent
        ? defaultDueDate(latestSent.eventDate)
        : null

    const shouldSyncFollowUp = nextEvent?.type === 'reminder'
      || nextEvent?.type === 'sent'
      || previousEvent?.type === 'paid'
      || (!project.nextFollowUpDate)
      || (oldDerivedFollowUpDate !== null && project.nextFollowUpDate === oldDerivedFollowUpDate)

    if (shouldSyncFollowUp && project.nextFollowUpDate !== derivedFollowUpDate) {
      patch.nextFollowUpDate = derivedFollowUpDate
    }
  }

  if (!latestPaid && (previousEvent?.type === 'sent' || nextEvent?.type === 'sent')) {
    const nextInvoiceStatus = latestSent ? 'Sent' : 'Draft'
    if (
      nextEvent?.type === 'sent'
      || project.invoiceStatus === 'Sent'
      || project.invoiceStatus === 'Draft'
      || project.invoiceStatus === 'Overdue'
    ) {
      patch.invoiceStatus = nextInvoiceStatus
    }
  }

  if (Object.keys(patch).length > 0) {
    const merged = normalizeProjectRecordInput(patch, project)
    await insertOrReplaceProject(db, merged)
  }
}

export async function createInvoiceEvent(
  db: D1Database,
  params: {
    projectId: string
    type: string
    recipient?: string
    amount: number
    notes?: string
    createdBy: string
    eventDate: string
  }
): Promise<InvoiceEvent> {
  return withProjectSchema(db, async () => {
    const type = normalizeInvoiceEventType(params.type)
    if (!type) {
      throw new Error('Invalid invoice event type')
    }

    const event: InvoiceEvent = {
      id: crypto.randomUUID(),
      projectId: params.projectId,
      type,
      recipient: normalizeOptionalText(params.recipient),
      amount: normalizeNullableNumber(params.amount) ?? 0,
      notes: normalizeOptionalText(params.notes),
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      eventDate: normalizeDateOnly(params.eventDate) ?? new Date().toISOString().slice(0, 10),
    }

    await db.prepare(`
      INSERT INTO invoice_events (
        id, project_id, type, recipient, amount, notes, created_by, created_at, event_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.id,
      event.projectId,
      event.type,
      event.recipient,
      event.amount,
      event.notes,
      event.createdBy,
      event.createdAt,
      event.eventDate
    ).run()

    await reconcileProjectInvoiceWorkflow(db, event.projectId, null, event)

    return event
  })
}

export async function updateInvoiceEvent(
  db: D1Database,
  params: {
    projectId: string
    eventId: string
    type?: string
    recipient?: string
    amount?: number
    notes?: string
    eventDate?: string
  }
): Promise<InvoiceEvent | null> {
  return withProjectSchema(db, async () => {
    const existing = await getInvoiceEventById(db, params.projectId, params.eventId)
    if (!existing) {
      return null
    }

    const type = params.type !== undefined ? normalizeInvoiceEventType(params.type) : existing.type
    if (!type) {
      throw new Error('Invalid invoice event type')
    }

    const next: InvoiceEvent = {
      id: existing.id,
      projectId: existing.projectId,
      type,
      recipient: params.recipient !== undefined ? normalizeOptionalText(params.recipient) : existing.recipient,
      amount: params.amount !== undefined ? normalizeNullableNumber(params.amount) ?? 0 : existing.amount,
      notes: params.notes !== undefined ? normalizeOptionalText(params.notes) : existing.notes,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      eventDate: params.eventDate !== undefined
        ? normalizeDateOnly(params.eventDate) ?? existing.eventDate
        : existing.eventDate,
    }

    await db.prepare(`
      UPDATE invoice_events
      SET type = ?, recipient = ?, amount = ?, notes = ?, event_date = ?
      WHERE project_id = ? AND id = ?
    `).bind(
      next.type,
      next.recipient,
      next.amount,
      next.notes,
      next.eventDate,
      params.projectId,
      params.eventId
    ).run()

    await reconcileProjectInvoiceWorkflow(db, params.projectId, existing, next)
    return next
  })
}

export async function deleteInvoiceEvent(db: D1Database, projectId: string, eventId: string): Promise<boolean> {
  return withProjectSchema(db, async () => {
    const existing = await getInvoiceEventById(db, projectId, eventId)
    if (!existing) {
      return false
    }

    const result = await db.prepare('DELETE FROM invoice_events WHERE project_id = ? AND id = ?').bind(projectId, eventId).run()
    const deleted = (result.meta.changes ?? 0) > 0

    if (deleted) {
      await reconcileProjectInvoiceWorkflow(db, projectId, existing, null)
    }

    return deleted
  })
}

// ── Share link view logging ──────────────────────────────────────────

interface ShareLinkViewRecord {
  id: string
  shareToken: string
  projectId: string
  fileId: string
  ipAddress: string
  userAgent: string
  referrer: string
  viewedAt: string
}

export interface ShareLinkView {
  id: string
  shareToken: string
  projectId: string
  fileId: string
  ipAddress: string
  userAgent: string
  referrer: string
  viewedAt: string
}

export async function logShareLinkView(
  db: D1Database,
  params: {
    shareToken: string
    projectId: string
    fileId: string
    ipAddress: string
    userAgent: string
    referrer: string
  }
): Promise<void> {
  await withProjectSchema(db, async () => {
    const id = crypto.randomUUID()
    const viewedAt = new Date().toISOString()
    await db.prepare(`
      INSERT INTO share_link_views (id, share_token, project_id, file_id, ip_address, user_agent, referrer, viewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, params.shareToken, params.projectId, params.fileId, params.ipAddress, params.userAgent, params.referrer, viewedAt).run()
  })
}

export async function listShareLinkViews(db: D1Database, projectId: string): Promise<ShareLinkView[]> {
  return withProjectSchema(db, async () => {
    const result = await db.prepare(`
      SELECT
        id,
        share_token AS shareToken,
        project_id AS projectId,
        file_id AS fileId,
        ip_address AS ipAddress,
        user_agent AS userAgent,
        referrer,
        viewed_at AS viewedAt
      FROM share_link_views
      WHERE project_id = ?
      ORDER BY viewed_at DESC
      LIMIT 100
    `).bind(projectId).all<ShareLinkViewRecord>()
    return result.results ?? []
  })
}

// ---------------------------------------------------------------------------
// Gmail Alerts
// ---------------------------------------------------------------------------

export interface GmailAlert {
  id: string
  projectId: string
  communicationId: string
  gmailMessageId: string
  gmailThreadId: string | null
  fromAddress: string
  fromName: string
  subject: string
  summary: string
  urgency: number
  matchScore: number
  matchRole: string
  read: boolean
  createdAt: string
  clientName?: string
  projectName?: string
}

interface GmailAlertRecord {
  id: string
  projectId: string
  communicationId: string
  gmailMessageId: string
  gmailThreadId: string | null
  fromAddress: string
  fromName: string
  subject: string
  summary: string
  urgency: number
  matchScore: number
  matchRole: string
  read: number
  createdAt: string
  clientName?: string
  projectName?: string
}

export async function createGmailAlert(
  db: D1Database,
  params: {
    projectId: string
    communicationId: string
    gmailMessageId: string
    gmailThreadId?: string | null
    fromAddress: string
    fromName: string
    subject: string
    summary: string
    urgency: number
    matchScore: number
    matchRole: string
  },
): Promise<GmailAlert> {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  await db.prepare(`
    INSERT INTO gmail_alerts (
      id, project_id, communication_id, gmail_message_id, gmail_thread_id,
      from_address, from_name, subject, summary, urgency,
      match_score, match_role, read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).bind(
    id,
    params.projectId,
    params.communicationId,
    params.gmailMessageId,
    params.gmailThreadId ?? null,
    params.fromAddress,
    params.fromName,
    params.subject,
    params.summary,
    params.urgency,
    params.matchScore,
    params.matchRole,
    now,
  ).run()

  return {
    id,
    projectId: params.projectId,
    communicationId: params.communicationId,
    gmailMessageId: params.gmailMessageId,
    gmailThreadId: params.gmailThreadId ?? null,
    fromAddress: params.fromAddress,
    fromName: params.fromName,
    subject: params.subject,
    summary: params.summary,
    urgency: params.urgency,
    matchScore: params.matchScore,
    matchRole: params.matchRole,
    read: false,
    createdAt: now,
  }
}

export async function listGmailAlerts(
  db: D1Database,
  opts: { unreadOnly?: boolean; projectId?: string; limit?: number } = {},
): Promise<GmailAlert[]> {
  const conditions: string[] = []
  const binds: (string | number)[] = []

  if (opts.unreadOnly) {
    conditions.push('ga.read = 0')
  }

  if (opts.projectId) {
    conditions.push('ga.project_id = ?')
    binds.push(opts.projectId)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = opts.limit ?? 50

  const result = await db.prepare(`
    SELECT
      ga.id AS id,
      ga.project_id AS projectId,
      ga.communication_id AS communicationId,
      ga.gmail_message_id AS gmailMessageId,
      ga.gmail_thread_id AS gmailThreadId,
      ga.from_address AS fromAddress,
      ga.from_name AS fromName,
      ga.subject AS subject,
      ga.summary AS summary,
      ga.urgency AS urgency,
      ga.match_score AS matchScore,
      ga.match_role AS matchRole,
      ga.read AS read,
      ga.created_at AS createdAt,
      p.client_name AS clientName,
      p.project_name AS projectName
    FROM gmail_alerts ga
    LEFT JOIN projects p ON p.id = ga.project_id
    ${where}
    ORDER BY ga.created_at DESC
    LIMIT ?
  `).bind(...binds, limit).all<GmailAlertRecord>()

  return (result.results ?? []).map((r) => ({
    ...r,
    read: r.read === 1,
  }))
}

export async function markGmailAlertsRead(
  db: D1Database,
  alertIds: string[],
): Promise<number> {
  if (alertIds.length === 0) return 0

  const placeholders = alertIds.map(() => '?').join(', ')
  const result = await db.prepare(
    `UPDATE gmail_alerts SET read = 1 WHERE id IN (${placeholders})`,
  ).bind(...alertIds).run()

  return result.meta?.changes ?? 0
}
