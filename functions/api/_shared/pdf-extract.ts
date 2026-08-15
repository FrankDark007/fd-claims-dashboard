/**
 * Lightweight PDF text extraction for Cloudflare Workers.
 * Parses raw PDF bytes looking for text stream content.
 * Falls back gracefully — returns empty string if binary/scanned PDF.
 */

export function extractTextFromPdf(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const maxScanBytes = 5 * 1024 * 1024
  const headBytes = Math.min(bytes.byteLength, 4 * 1024 * 1024)
  const tailBytes = Math.min(Math.max(bytes.byteLength - headBytes, 0), maxScanBytes - headBytes)
  const decoder = new TextDecoder('latin1')
  const raw = tailBytes > 0
    ? `${decoder.decode(bytes.subarray(0, headBytes))}\n${decoder.decode(bytes.subarray(bytes.byteLength - tailBytes))}`
    : decoder.decode(bytes.subarray(0, headBytes))

  const textChunks: string[] = []
  let extractedCharacters = 0

  // Extract text between BT...ET blocks (PDF text objects)
  const btEtPattern = /BT\s([\s\S]*?)ET/g
  let match: RegExpExecArray | null

  while ((match = btEtPattern.exec(raw)) !== null) {
    const block = match[1]
    if (block.length > 200_000) continue

    // Extract parenthesized strings: Tj and TJ operators
    const parenPattern = /\(([^)]*)\)/g
    let parenMatch: RegExpExecArray | null
    while ((parenMatch = parenPattern.exec(block)) !== null) {
      const decoded = parenMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
      if (decoded.length > 0) {
        textChunks.push(decoded.slice(0, 10_000))
        extractedCharacters += Math.min(decoded.length, 10_000)
      }
      if (extractedCharacters >= 100_000) break
    }

    if (extractedCharacters >= 100_000) break

    // Extract hex strings: <hex> Tj
    const hexPattern = /<([0-9A-Fa-f\s]+)>/g
    let hexMatch: RegExpExecArray | null
    while ((hexMatch = hexPattern.exec(block)) !== null) {
      const hex = hexMatch[1].replace(/\s/g, '')
      let decoded = ''
      for (let i = 0; i < hex.length - 1; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16))
      }
      if (decoded.length > 0) {
        const bounded = decoded.slice(0, 10_000)
        textChunks.push(bounded)
        extractedCharacters += bounded.length
      }
      if (extractedCharacters >= 100_000) break
    }

    if (extractedCharacters >= 100_000) break
  }

  return textChunks
    .join('\n')
    .slice(0, 100_000)
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export interface ExtractedClientInfo {
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
}

/**
 * Extract client contact information from PDF text using regex patterns.
 * Looks for common patterns in restoration/mitigation contracts.
 */
export function extractClientInfo(text: string): ExtractedClientInfo {
  const result: ExtractedClientInfo = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
  }

  if (!text || text.length < 10) {
    return result
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  // Email — strongest signal, grab first email that isn't a company domain
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  if (emailMatch) {
    const companyDomains = ['flood.doctor', 'flooddoctor', 'restorationdoctors', 'example.com']
    const clientEmail = emailMatch.find(
      (e) => !companyDomains.some((d) => e.toLowerCase().includes(d))
    )
    if (clientEmail) {
      result.clientEmail = clientEmail.toLowerCase()
    }
  }

  // Phone — US format variations
  const phonePatterns = [
    /(?:phone|tel|cell|mobile|contact)[:\s]*([(\d][\d\s().-]{8,14}\d)/i,
    /\b(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})\b/,
    /\b(\d{3}[\s.-]\d{3}[\s.-]\d{4})\b/,
  ]
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern)
    if (phoneMatch) {
      result.clientPhone = phoneMatch[1].trim()
      break
    }
  }

  // Client name — look for labeled fields first
  const namePatterns = [
    /^(?:customer|client|homeowner|property\s*owner|insured)\s*name\s*[:-]\s*([A-Z][a-zA-Z'.-]+(?:[ \t]+[A-Z][a-zA-Z'.-]+){1,3})\s*$/i,
    /^(?:customer|client|homeowner|property\s*owner|insured)\s*[:-]\s*([A-Z][a-zA-Z'.-]+(?:[ \t]+[A-Z][a-zA-Z'.-]+){1,3})\s*$/i,
    /^(?:name|prepared\s+for|bill\s+to|attn)\s*[:-]\s*([A-Z][a-zA-Z'.-]+(?:[ \t]+[A-Z][a-zA-Z'.-]+){1,3})\s*$/i,
  ]
  for (const line of lines) {
    for (const pattern of namePatterns) {
      const nameMatch = line.match(pattern)
      if (nameMatch) {
        const name = nameMatch[1].trim()
        // Filter out obvious non-names
        if (name.length > 3 && name.length < 60 && !/^(the|and|for|contract|agreement|page)/i.test(name)) {
          result.clientName = name
          break
        }
      }
    }
    if (result.clientName) break
  }

  // Address — look for street address patterns
  const addressPatterns = [
    /(?:property|job\s*site|service|project|loss)?\s*address[:\s]*([\d]+\s+[A-Za-z0-9\s.,#-]+(?:(?:st|street|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|rd|road|way|pl|place|cir|circle)\b[.,]?\s*(?:[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)?))/i,
    /\b(\d{2,5}\s+[A-Z][a-zA-Z]+(?:\s+[A-Za-z]+)*\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Rd|Road|Way|Pl|Place|Cir|Circle)\.?(?:\s*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5})?)/,
  ]
  for (const line of lines) {
    for (const pattern of addressPatterns) {
      const addrMatch = line.match(pattern)
      if (addrMatch) {
        const addr = addrMatch[1].trim().replace(/\s+/g, ' ')
        if (addr.length > 8 && addr.length < 200) {
          result.clientAddress = addr
          break
        }
      }
    }
    if (result.clientAddress) break
  }

  return result
}
