/**
 * Seed the admin user (Frank) into KV.
 * Run: npx tsx scripts/seed-admin.ts [password]
 * Writes JSON to /tmp/kv-user.json then calls wrangler kv put.
 */
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const username = 'frank'
const displayName = 'Frank'
const email = 'darakhshan.farough@gmail.com'
const password = process.argv[2] || 'changeme'
const KV_NAMESPACE_ID = 'b2ed4696a8184c43a3e6c5f9d6b20af9'

async function hashPassword(pw: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pw),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function main() {
  const salt = crypto.randomUUID()
  const passwordHash = await hashPassword(password, salt)

  const user = {
    id: crypto.randomUUID(),
    username,
    displayName,
    passwordHash,
    salt,
    role: 'admin',
    email,
    createdAt: new Date().toISOString(),
  }

  const jsonPath = '/tmp/kv-user-frank.json'
  writeFileSync(jsonPath, JSON.stringify(user))

  console.log(`Seeding admin user: ${username} / ${password}`)

  const cmd = `npx wrangler kv key put --namespace-id=${KV_NAMESPACE_ID} "user:${username}" --path="${jsonPath}"`
  console.log(`Running: ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
  console.log('Done!')
}

main()
