import { createProjectFile, deleteProjectFile, getProjectById, getProjectFileById, listProjectFiles } from '../../_shared/project-store'
import { normalizeFileCategory } from '../../../../src/shared/projects'
import { getUserField } from '../../_shared/auth'

interface Env {
  FD_CLAIMS_DB: D1Database
  FD_PROJECT_FILES: R2Bucket
}

// GET /api/projects/:id/files — list all files for a project
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const url = new URL(context.request.url)
  const download = url.searchParams.get('download') === '1'
  const fileId = url.searchParams.get('fileId')

  if (download && fileId) {
    const file = await getProjectFileById(context.env.FD_CLAIMS_DB, projectId, fileId)
    if (!file) {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }

    const object = await context.env.FD_PROJECT_FILES.get(file.r2Key)
    if (!object) {
      return Response.json({ error: 'File object missing from storage' }, { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', file.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${file.originalName}"`)

    return new Response(object.body, { headers })
  }

  const files = await listProjectFiles(context.env.FD_CLAIMS_DB, projectId)
  return Response.json({ files })
}

// POST /api/projects/:id/files — upload a file to R2
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const project = await getProjectById(context.env.FD_CLAIMS_DB, projectId)
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  const formData = await context.request.formData()
  const file = formData.get('file') as File | null
  const category = normalizeFileCategory(formData.get('category'))

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // 50MB limit
  if (file.size > 50 * 1024 * 1024) {
    return Response.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
  }

  const fileId = crypto.randomUUID()
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const r2Key = `projects/${projectId}/${category}/${fileId}-${safeFilename || 'file'}`

  // Upload to R2
  await context.env.FD_PROJECT_FILES.put(r2Key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
    customMetadata: {
      projectId,
      category: category,
      originalName: file.name,
      uploadedBy: getUserField(context, 'displayName') || 'Unknown',
    },
  })

  const newFile = await createProjectFile(context.env.FD_CLAIMS_DB, {
    projectId,
    filename: safeFilename || file.name,
    originalName: file.name,
    r2Key,
    category,
    sizeBytes: file.size,
    mimeType: file.type || 'application/octet-stream',
    uploadedBy: getUserField(context, 'displayName') || 'Unknown',
  })

  // Auto-update document status when a file is uploaded to a tracked category.
  // Only promotes from "Missing" — doesn't overwrite manual status changes.
  const AUTO_STATUS: Record<string, { column: string; fromValue: string; toValue: string }> = {
    contracts: { column: 'contract_status', fromValue: 'Missing', toValue: 'Signed' },
    cocs:      { column: 'coc_status',      fromValue: 'Missing', toValue: 'Signed' },
    drylogs:   { column: 'drylog_status',   fromValue: 'Missing', toValue: 'Received' },
    invoices:  { column: 'final_invoice_status', fromValue: 'Not Started', toValue: 'Complete' },
  }
  const autoStatus = AUTO_STATUS[category]
  if (autoStatus) {
    await context.env.FD_CLAIMS_DB.prepare(
      `UPDATE projects SET ${autoStatus.column} = ?, updated_at = datetime('now') WHERE id = ? AND ${autoStatus.column} = ?`
    ).bind(autoStatus.toValue, projectId, autoStatus.fromValue).run()
  }

  return Response.json({ file: newFile }, { status: 201 })
}

// DELETE /api/projects/:id/files?fileId=xxx — delete a file
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  const url = new URL(context.request.url)
  const fileId = url.searchParams.get('fileId')

  if (!projectId || !fileId) {
    return Response.json({ error: 'Project ID and fileId required' }, { status: 400 })
  }

  const file = await deleteProjectFile(context.env.FD_CLAIMS_DB, projectId, fileId)
  if (!file) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }

  // Delete from R2
  await context.env.FD_PROJECT_FILES.delete(file.r2Key)

  return Response.json({ success: true })
}
