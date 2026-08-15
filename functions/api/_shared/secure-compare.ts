export async function timingSafeEqualStrings(leftValue: string | null | undefined, rightValue: string | null | undefined): Promise<boolean> {
  if (!leftValue || !rightValue) return false

  const encoder = new TextEncoder()
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(leftValue)),
    crypto.subtle.digest('SHA-256', encoder.encode(rightValue)),
  ])

  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (left: ArrayBuffer, right: ArrayBuffer) => boolean
  }
  if (subtle.timingSafeEqual) return subtle.timingSafeEqual(leftHash, rightHash)

  const left = new Uint8Array(leftHash)
  const right = new Uint8Array(rightHash)
  let difference = left.length ^ right.length
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}
