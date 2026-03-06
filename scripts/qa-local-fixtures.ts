export type ProjectPayload = {
  clientName: string
  projectName: string
  projectType: 'Water Mitigation' | 'Pack-out' | 'Mold Remediation'
  projectStatus: 'Active' | 'On Hold' | 'Complete'
  invoiceStatus: 'Draft' | 'Sent' | 'Paid'
  amount: number
  invoiceSentDate?: string
  dueDate?: string
  nextFollowUpDate?: string | null
  paymentReceivedDate?: string
  claimNumber: string
  carrier: string
  projectManagerName: string
  pmEmail: string
  pmPhone: string
  adjusterName: string
  adjusterEmail: string
  adjusterPhone: string
  notes: string
}

export type InvoiceEventPayload = {
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  recipient: string
  notes: string
}

export type SeedProject = ProjectPayload & {
  events: InvoiceEventPayload[]
}

export const seedProjects: SeedProject[] = [
  {
    clientName: 'Ava Robinson',
    projectName: 'Kitchen Mitigation',
    projectType: 'Water Mitigation',
    projectStatus: 'Active',
    invoiceStatus: 'Sent',
    amount: 4825,
    invoiceSentDate: '2026-02-01',
    dueDate: '2026-03-03',
    nextFollowUpDate: '2026-03-09',
    claimNumber: 'QA-CLM-1001',
    carrier: 'Allstate',
    projectManagerName: 'Frank',
    pmEmail: 'frank@flooddoctor.test',
    pmPhone: '555-000-1001',
    adjusterName: 'Mina Patel',
    adjusterEmail: 'mina@example.com',
    adjusterPhone: '555-111-1001',
    notes: 'QA seed: overdue collections project with active follow-up.',
    events: [
      {
        type: 'sent',
        date: '2026-02-01',
        amount: 4825,
        recipient: 'Mina Patel',
        notes: 'QA seed: initial invoice sent',
      },
      {
        type: 'reminder',
        date: '2026-03-02',
        amount: 4825,
        recipient: 'Mina Patel',
        notes: 'QA seed: first reminder after due date',
      },
    ],
  },
  {
    clientName: 'Ben Alvarez',
    projectName: 'Pack-out Complete',
    projectType: 'Pack-out',
    projectStatus: 'Complete',
    invoiceStatus: 'Paid',
    amount: 7600,
    invoiceSentDate: '2026-02-10',
    dueDate: '2026-03-12',
    nextFollowUpDate: null,
    paymentReceivedDate: '2026-02-22',
    claimNumber: 'QA-CLM-1002',
    carrier: 'State Farm',
    projectManagerName: 'Frank',
    pmEmail: 'frank@flooddoctor.test',
    pmPhone: '555-000-1002',
    adjusterName: 'Omar Singh',
    adjusterEmail: 'omar@example.com',
    adjusterPhone: '555-111-1002',
    notes: 'QA seed: paid project for timeline regression coverage.',
    events: [
      {
        type: 'sent',
        date: '2026-02-10',
        amount: 7600,
        recipient: 'Omar Singh',
        notes: 'QA seed: invoice delivered',
      },
      {
        type: 'paid',
        date: '2026-02-22',
        amount: 7600,
        recipient: 'Omar Singh',
        notes: 'QA seed: paid in full',
      },
    ],
  },
  {
    clientName: 'Cara Nguyen',
    projectName: 'Mold Remediation Estimate',
    projectType: 'Mold Remediation',
    projectStatus: 'On Hold',
    invoiceStatus: 'Draft',
    amount: 2150,
    claimNumber: 'QA-CLM-1003',
    carrier: 'Travelers',
    projectManagerName: 'Frank',
    pmEmail: 'frank@flooddoctor.test',
    pmPhone: '555-000-1003',
    adjusterName: 'Ivy Chen',
    adjusterEmail: 'ivy@example.com',
    adjusterPhone: '555-111-1003',
    notes: 'QA seed: draft invoice project for editable financial/contact coverage.',
    events: [],
  },
]
