import { createProject, createProjectFile, deleteProjectById } from '../_shared/project-store'
import { getUserField } from '../_shared/auth'
import { extractTextFromPdf, extractClientInfo } from '../_shared/pdf-extract'

interface Env {
  FD_CLAIMS_DB: D1Database
  FD_PROJECT_FILES: R2Bucket
}

const MAX_CONTRACT_SIZE = 10 * 1024 * 1024

// POST /api/projects/create-from-contract
// Accepts multipart form with a PDF file, extracts client info, creates project + file record
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size === 0 || file.size > MAX_CONTRACT_SIZE) {
      return Response.json({ error: 'File must be a non-empty PDF no larger than 10MB.' }, { status: 400 })
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return Response.json({ error: 'Only PDF files are supported for contract extraction.' }, { status: 400 })
    }

    // Read file into buffer for text extraction
    const buffer = await file.arrayBuffer()
    const signature = new TextDecoder('ascii').decode(new Uint8Array(buffer, 0, Math.min(5, buffer.byteLength)))
    if (signature !== '%PDF-') {
      return Response.json({ error: 'The uploaded file is not a valid PDF.' }, { status: 400 })
    }

    const pdfText = extractTextFromPdf(buffer)
    const extracted = extractClientInfo(pdfText)

    if (!extracted.clientName) {
      return Response.json({
        error: 'A client name could not be extracted. Create the project manually, then upload this contract from the project page.',
      }, { status: 422 })
    }

    const uploadedBy = getUserField(context, 'displayName') || 'Unknown'

    // Create the project
    const project = await createProject(context.env.FD_CLAIMS_DB, {
      clientName: extracted.clientName,
      projectName: extracted.clientAddress || '',
      clientEmail: extracted.clientEmail || '',
      clientPhone: extracted.clientPhone || '',
      clientAddress: extracted.clientAddress || '',
      contractStatus: 'Signed',
    })

    // Upload the contract file to R2
    const fileId = crypto.randomUUID()
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 180) || 'contract.pdf'
    const r2Key = `projects/${project.id}/contracts/${fileId}-${safeFilename}`

    try {
      await context.env.FD_PROJECT_FILES.put(r2Key, buffer, {
        httpMetadata: {
          contentType: 'application/pdf',
        },
        customMetadata: {
          projectId: project.id,
          category: 'contracts',
          originalName: file.name.slice(0, 255),
          uploadedBy: uploadedBy.slice(0, 100),
        },
      })

      const projectFile = await createProjectFile(context.env.FD_CLAIMS_DB, {
        projectId: project.id,
        filename: safeFilename,
        originalName: file.name.slice(0, 255),
        r2Key,
        category: 'contracts',
        sizeBytes: file.size,
        mimeType: 'application/pdf',
        uploadedBy: uploadedBy.slice(0, 100),
      })

      return Response.json({
        project,
        file: projectFile,
        extracted,
      }, { status: 201 })
    } catch (error) {
      await Promise.allSettled([
        context.env.FD_PROJECT_FILES.delete(r2Key),
        deleteProjectById(context.env.FD_CLAIMS_DB, project.id),
      ])
      throw error
    }
  } catch (error: unknown) {
    console.error('Contract import failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return Response.json({ error: 'Unable to create project from contract.' }, { status: 500 })
  }
}
