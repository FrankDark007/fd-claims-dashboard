interface Env {
  FD_PROJECT_FILES: R2Bucket
  FD_PROJECTS_DATA: KVNamespace
}

interface FileMetadata {
  id: string
  name: string
  r2Key: string
  category: 'contracts' | 'cocs' | 'photos' | 'other'
  size: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
}

// GET /api/projects/:id/files — list all files for a project
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const filesJson = await context.env.FD_PROJECTS_DATA.get(`project:${projectId}:files`)
  const files: FileMetadata[] = filesJson ? JSON.parse(filesJson) : []

  return Response.json({ files })
}

// POST /api/projects/:id/files — upload a file to R2
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const formData = await context.request.formData()
  const file = formData.get('file') as File | null
  const category = (formData.get('category') as string) || 'other'

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const validCategories = ['contracts', 'cocs', 'photos', 'other']
  if (!validCategories.includes(category)) {
    return Response.json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 })
  }

  // 50MB limit
  if (file.size > 50 * 1024 * 1024) {
    return Response.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
  }

  const fileId = crypto.randomUUID()
  const r2Key = `projects/${projectId}/${category}/${fileId}-${file.name}`

  // Upload to R2
  await context.env.FD_PROJECT_FILES.put(r2Key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
    customMetadata: {
      projectId,
      category,
      originalName: file.name,
      uploadedBy: context.request.headers.get('X-User-Display') || 'Unknown',
    },
  })

  // Update KV metadata
  const filesJson = await context.env.FD_PROJECTS_DATA.get(`project:${projectId}:files`)
  const files: FileMetadata[] = filesJson ? JSON.parse(filesJson) : []

  const newFile: FileMetadata = {
    id: fileId,
    name: file.name,
    r2Key,
    category: category as FileMetadata['category'],
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
    uploadedBy: context.request.headers.get('X-User-Display') || 'Unknown',
  }

  files.push(newFile)
  await context.env.FD_PROJECTS_DATA.put(`project:${projectId}:files`, JSON.stringify(files))

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

  const filesJson = await context.env.FD_PROJECTS_DATA.get(`project:${projectId}:files`)
  const files: FileMetadata[] = filesJson ? JSON.parse(filesJson) : []

  const fileIndex = files.findIndex(f => f.id === fileId)
  if (fileIndex === -1) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }

  const file = files[fileIndex]

  // Delete from R2
  await context.env.FD_PROJECT_FILES.delete(file.r2Key)

  // Remove from KV metadata
  files.splice(fileIndex, 1)
  await context.env.FD_PROJECTS_DATA.put(`project:${projectId}:files`, JSON.stringify(files))

  return Response.json({ success: true })
}
