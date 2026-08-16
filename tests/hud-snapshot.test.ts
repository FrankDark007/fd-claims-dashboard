import assert from 'node:assert/strict'
import test from 'node:test'

import { createHudSnapshotResponse } from '../functions/api/hud/snapshot'
import { buildClaimsHudSnapshot, rankClaimProjects } from '../src/shared/claims-hud-snapshot'
import type { InvoiceEvent, Project, ProjectCommunication, ProjectTask } from '../src/shared/projects'

const project = {
  id: 'project-1', invoiceId: 42, clientName: 'Canary Holdings', projectName: 'Water mitigation',
  projectType: 'Water Mitigation', projectStatus: 'Active', invoiceStatus: 'Overdue', amount: 1250.5,
  contractStatus: 'Signed', cocStatus: 'Missing', finalInvoiceStatus: 'Review', drylogStatus: 'Received',
  rewriteStatus: 'Done', matterportStatus: 'Has Scan', companyCamUrl: '', driveFolderUrl: '',
  xactimateNumber: 'XA-9', claimNumber: 'CLM-2048', businessCategory: 'Flood Doctor', carrier: 'Carrier',
  projectManagerName: 'Morgan', pmEmail: '', pmPhone: '', adjusterName: '', adjusterEmail: '',
  adjusterPhone: '', clientEmail: '', clientPhone: '', clientAddress: '', invoiceSentDate: '2026-07-01',
  dueDate: '2026-08-10', nextFollowUpDate: '2026-08-14', paymentReceivedDate: null, notes: '', done: false,
  createdAt: '2026-07-01T12:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z',
} satisfies Project

const task = {
  id: 'task-1', projectId: project.id, title: 'Verify equipment removal', completed: false,
  assignee: 'Morgan', dueDate: '2026-08-15', notes: '', sortOrder: 0,
  createdAt: '2026-08-14T10:00:00.000Z', updatedAt: '2026-08-15T11:00:00.000Z',
} satisfies ProjectTask

const communication = {
  id: 'comm-1', projectId: project.id, channel: 'email', direction: 'outbound', counterpartName: 'Adjuster',
  counterpartRole: 'adjuster', counterpartAddress: '', subject: '', body: '', status: 'sent',
  followUpDate: '2026-08-15', createdBy: 'Morgan', createdAt: '2026-08-14T10:00:00.000Z',
  updatedAt: '2026-08-15T09:00:00.000Z',
} satisfies ProjectCommunication

const invoiceEvent = {
  id: 'event-1', projectId: project.id, type: 'disputed', recipient: '', amount: 1250.5, notes: '',
  createdBy: 'Morgan', createdAt: '2026-08-15T08:00:00.000Z', eventDate: '2026-08-15',
} satisfies InvoiceEvent

const input = {
  projects: [project], tasks: [task], communications: [communication], invoiceEvents: [invoiceEvent],
  observedAt: '2026-08-16T05:00:00.000Z',
}

test('shared projection is deterministic and preserves exact office fields with provenance', () => {
  const first = buildClaimsHudSnapshot(input)
  assert.deepEqual(first, buildClaimsHudSnapshot(input))
  assert.equal(first.schema, 'hud.ops.snapshot.v1')
  assert.equal(first.consistency, 'COMPLETE')
  assert.equal(first.dataUpdatedAt, '2026-08-15T12:00:00.000Z')
  assert.ok(first.rows.length >= 3)
  for (const row of first.rows) {
    assert.equal(row.sourceId, 'claims')
    assert.equal(row.sourceWatermark, first.watermark)
    assert.match(row.sourceRecordId, /^[A-Za-z0-9][A-Za-z0-9._:-]+$/)
  }
  const work = first.rows.find((row) => row.kind === 'work')
  assert.equal(work?.clientName, 'Canary Holdings')
  assert.equal(work?.claimNumber, 'CLM-2048')
  assert.equal(work?.amountMinor, 125050)
  assert.equal(work?.owner, 'Morgan')
  assert.equal(work?.taskTitle, 'Verify equipment removal')
  assert.equal(work?.deadlineAt, '2026-08-15T12:00:00.000Z')
  assert.equal(work?.sourceRecordId, `project:${rankClaimProjects([project], [communication], '2026-08-16')[0].project.id}`)
})

test('projection drops unsafe display text instead of exporting it', () => {
  const unsafe = buildClaimsHudSnapshot({
    ...input,
    projects: [{ ...project, clientName: '<script>alert(1)</script>', projectName: 'https://secret.invalid' }],
  })
  const work = unsafe.rows.find((row) => row.kind === 'work')
  assert.equal(work?.clientName, undefined)
  assert.equal(work?.projectName, undefined)
  assert.equal(work?.title, 'Claims project')
})

test('dedicated endpoint is GET-only, machine-authenticated, no-store, and fail-closed', async () => {
  const expected = buildClaimsHudSnapshot(input)
  let loads = 0
  const loader = async () => { loads += 1; return expected }
  const env = { FD_CLAIMS_DB: {} as D1Database, HUD_CLAIMS_TOKEN: 'machine-secret' }

  const unauthorized = await createHudSnapshotResponse(new Request('https://claims.example/api/hud/snapshot'), env, loader)
  assert.equal(unauthorized.status, 401)
  assert.equal(loads, 0)

  const mutation = await createHudSnapshotResponse(new Request('https://claims.example/api/hud/snapshot', {
    method: 'POST', headers: { authorization: 'Bearer machine-secret' },
  }), env, loader)
  assert.equal(mutation.status, 405)
  assert.equal(mutation.headers.get('allow'), 'GET')
  assert.equal(loads, 0)

  const response = await createHudSnapshotResponse(new Request('https://claims.example/api/hud/snapshot', {
    headers: { authorization: 'Bearer machine-secret' },
  }), env, loader)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(await response.json(), expected)
  assert.equal(loads, 1)

  const failed = await createHudSnapshotResponse(new Request('https://claims.example/api/hud/snapshot', {
    headers: { authorization: 'Bearer machine-secret' },
  }), env, async () => { throw new Error('database details must not escape') })
  assert.equal(failed.status, 503)
  assert.deepEqual(await failed.json(), { error: 'Snapshot unavailable' })
})
