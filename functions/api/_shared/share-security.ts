export interface StoredShareToken {
  projectId: string
  fileId: string
  fileName: string
  r2Key: string
  mimeType: string
  createdAt: string
  expiresAt: string
  createdBy: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : null
}

export function parseStoredShareToken(value: string): StoredShareToken | null {
  try {
    const parsed = asRecord(JSON.parse(value))
    if (!parsed) return null

    const required = ['projectId', 'fileId', 'fileName', 'r2Key', 'mimeType', 'createdAt', 'expiresAt', 'createdBy'] as const
    if (required.some((key) => typeof parsed[key] !== 'string')) return null

    const share = parsed as unknown as StoredShareToken
    if (!share.projectId || !share.fileId || !share.r2Key || !share.expiresAt) return null
    if (Number.isNaN(Date.parse(share.expiresAt))) return null
    return share
  } catch {
    return null
  }
}

export function anonymizeIpAddress(value: string): string {
  const normalized = value.trim().split('%')[0].slice(0, 64)

  const ipv4 = normalized.split('.')
  if (
    ipv4.length === 4
    && ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  ) {
    return `${ipv4[0]}.${ipv4[1]}.${ipv4[2]}.0`
  }

  if (/^[0-9a-f:]+$/i.test(normalized) && normalized.includes(':')) {
    const prefix = normalized.split(':').filter(Boolean).slice(0, 4).join(':')
    return prefix ? `${prefix}::` : ''
  }

  return ''
}

function stripControlCharacters(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127 ? '' : character
  }).join('')
}

export function sanitizeUserAgent(value: string): string {
  return stripControlCharacters(value).slice(0, 256)
}

export function sanitizeReferrer(value: string): string {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin.slice(0, 256) : ''
  } catch {
    return ''
  }
}

export function safeContentDispositionFilename(value: string): string {
  const sanitized = stripControlCharacters(value)
    .replace(/["\\/]/g, '_')
    .replace(/[^\x20-\x7e]/g, '_')
    .trim()
    .slice(0, 150)

  return sanitized || 'download'
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
