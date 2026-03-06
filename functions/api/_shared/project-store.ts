import {
  computeInvoiceStatus,
  defaultDueDate,
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
} from '../../../src/shared/projects'
import type {
  FileCategory,
  InvoiceEvent,
  Project,
  ProjectFile,
  ProjectNote,
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
  carrier: string
  projectManagerName: string
  pmEmail: string
  pmPhone: string
  adjusterName: string
  adjusterEmail: string
  adjusterPhone: string
  invoiceSentDate: string | null
  dueDate: string | null
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
    carrier,
    project_manager_name AS projectManagerName,
    pm_email AS pmEmail,
    pm_phone AS pmPhone,
    adjuster_name AS adjusterName,
    adjuster_email AS adjusterEmail,
    adjuster_phone AS adjusterPhone,
    invoice_sent_date AS invoiceSentDate,
    due_date AS dueDate,
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
    carrier: record.carrier ?? '',
    projectManagerName: record.projectManagerName ?? '',
    pmEmail: record.pmEmail ?? '',
    pmPhone: record.pmPhone ?? '',
    adjusterName: record.adjusterName ?? '',
    adjusterEmail: record.adjusterEmail ?? '',
    adjusterPhone: record.adjusterPhone ?? '',
    invoiceSentDate: record.invoiceSentDate,
    dueDate: record.dueDate,
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

function normalizeProjectRecordInput(input: ProjectWriteInput, existing?: ProjectRecord): ProjectRecord {
  const invoiceSentDate = input.invoiceSentDate !== undefined
    ? normalizeDateOnly(input.invoiceSentDate)
    : existing?.invoiceSentDate ?? null

  let dueDate = input.dueDate !== undefined
    ? normalizeDateOnly(input.dueDate)
    : existing?.dueDate ?? null

  if (input.invoiceSentDate !== undefined && input.dueDate === undefined) {
    dueDate = defaultDueDate(invoiceSentDate)
  }

  const paymentReceivedDate = input.paymentReceivedDate !== undefined
    ? normalizeDateOnly(input.paymentReceivedDate)
    : existing?.paymentReceivedDate ?? null

  let invoiceStatus = input.invoiceStatus !== undefined
    ? normalizeInvoiceStatus(input.invoiceStatus)
    : normalizeInvoiceStatus(existing?.invoiceStatus) ?? 'Draft'

  if (paymentReceivedDate) {
    invoiceStatus = 'Paid'
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
    carrier: input.carrier !== undefined ? normalizeOptionalText(input.carrier) : existing?.carrier ?? '',
    projectManagerName: input.projectManagerName !== undefined ? normalizeOptionalText(input.projectManagerName) : existing?.projectManagerName ?? '',
    pmEmail: input.pmEmail !== undefined ? normalizeOptionalText(input.pmEmail) : existing?.pmEmail ?? '',
    pmPhone: input.pmPhone !== undefined ? normalizeOptionalText(input.pmPhone) : existing?.pmPhone ?? '',
    adjusterName: input.adjusterName !== undefined ? normalizeOptionalText(input.adjusterName) : existing?.adjusterName ?? '',
    adjusterEmail: input.adjusterEmail !== undefined ? normalizeOptionalText(input.adjusterEmail) : existing?.adjusterEmail ?? '',
    adjusterPhone: input.adjusterPhone !== undefined ? normalizeOptionalText(input.adjusterPhone) : existing?.adjusterPhone ?? '',
    invoiceSentDate,
    dueDate,
    paymentReceivedDate,
    notes: input.notes !== undefined ? normalizeOptionalText(input.notes) : existing?.notes ?? '',
    done: input.done !== undefined ? (normalizeBoolean(input.done) ? 1 : 0) : existing?.done ?? 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

async function getProjectRecord(db: D1Database, projectId: string): Promise<ProjectRecord | null> {
  const record = await db.prepare(`${PROJECT_SELECT} WHERE id = ?`).bind(projectId).first<ProjectRecord>()
  return record ?? null
}

async function insertOrReplaceProject(db: D1Database, project: ProjectRecord): Promise<void> {
  await db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, invoice_id, client_name, project_name, project_type, project_status, invoice_status,
      amount, contract_status, coc_status, final_invoice_status, drylog_status, rewrite_status,
      matterport_status, company_cam_url, drive_folder_url, xactimate_number, claim_number,
      carrier, project_manager_name, pm_email, pm_phone, adjuster_name, adjuster_email,
      adjuster_phone, invoice_sent_date, due_date, payment_received_date, notes, done,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    project.carrier,
    project.projectManagerName,
    project.pmEmail,
    project.pmPhone,
    project.adjusterName,
    project.adjusterEmail,
    project.adjusterPhone,
    project.invoiceSentDate,
    project.dueDate,
    project.paymentReceivedDate,
    project.notes,
    project.done,
    project.createdAt,
    project.updatedAt
  ).run()
}

export async function listProjects(db: D1Database): Promise<Project[]> {
  const result = await db.prepare(`${PROJECT_SELECT} ORDER BY updated_at DESC, created_at DESC`).all<ProjectRecord>()
  return (result.results ?? []).map(mapProjectRecord)
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
  const result = await db.prepare(`${PROJECT_FILE_SELECT} WHERE project_id = ? ORDER BY uploaded_at DESC`).bind(projectId).all<ProjectFileRecord>()
  return (result.results ?? []).map(mapProjectFileRecord)
}

export async function getProjectFileById(db: D1Database, projectId: string, fileId: string): Promise<ProjectFile | null> {
  const record = await db.prepare(`${PROJECT_FILE_SELECT} WHERE project_id = ? AND id = ?`).bind(projectId, fileId).first<ProjectFileRecord>()
  return record ? mapProjectFileRecord(record) : null
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
  const result = await db.prepare(
    `${PROJECT_NOTE_SELECT} WHERE project_id = ? ORDER BY pinned DESC, updated_at DESC, created_at DESC`
  ).bind(projectId).all<ProjectNoteRecord>()

  return (result.results ?? []).map(mapProjectNoteRecord)
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
}

export async function deleteProjectNote(db: D1Database, projectId: string, noteId: string): Promise<boolean> {
  const result = await db.prepare(
    'DELETE FROM project_notes WHERE project_id = ? AND id = ?'
  ).bind(projectId, noteId).run()

  return (result.meta.changes ?? 0) > 0
}

export async function listInvoiceEvents(db: D1Database, projectId?: string): Promise<InvoiceEvent[]> {
  const query = projectId
    ? `${INVOICE_EVENT_SELECT} WHERE project_id = ? ORDER BY event_date DESC, created_at DESC`
    : `${INVOICE_EVENT_SELECT} ORDER BY event_date DESC, created_at DESC`

  const statement = projectId ? db.prepare(query).bind(projectId) : db.prepare(query)
  const result = await statement.all<InvoiceEventRecord>()
  return (result.results ?? []).map(mapInvoiceEventRecord)
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

  const project = await getProjectRecord(db, event.projectId)
  if (project) {
    const patch: ProjectWriteInput = {}

    if (event.type === 'sent') {
      patch.invoiceStatus = 'Sent'
      patch.invoiceSentDate = event.eventDate
      if (!project.dueDate) {
        patch.dueDate = defaultDueDate(event.eventDate)
      }
    }

    if (event.type === 'paid') {
      patch.invoiceStatus = 'Paid'
      patch.paymentReceivedDate = event.eventDate
    }

    if (patch.invoiceStatus || patch.invoiceSentDate || patch.paymentReceivedDate || patch.dueDate) {
      const merged = normalizeProjectRecordInput(patch, project)
      await insertOrReplaceProject(db, merged)
    }
  }

  return event
}

export async function deleteInvoiceEvent(db: D1Database, projectId: string, eventId: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM invoice_events WHERE project_id = ? AND id = ?').bind(projectId, eventId).run()
  return (result.meta.changes ?? 0) > 0
}
