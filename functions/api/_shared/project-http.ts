import type { Project, ProjectWriteInput } from '../../../src/shared/projects'

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function parseProjectWriteInput(value: unknown): ProjectWriteInput {
  const body = asRecord(value)

  return {
    invoiceId: body.invoiceId as number | null | undefined,
    clientName: body.clientName as string | undefined,
    projectName: (body.projectName ?? body.project) as string | undefined,
    projectType: body.projectType as ProjectWriteInput['projectType'],
    projectStatus: (body.projectStatus ?? body.project_state) as ProjectWriteInput['projectStatus'],
    invoiceStatus: (body.invoiceStatus ?? body.status) as ProjectWriteInput['invoiceStatus'],
    amount: body.amount as number | null | undefined,
    contractStatus: (body.contractStatus ?? body.contract) as ProjectWriteInput['contractStatus'],
    cocStatus: (body.cocStatus ?? body.coc) as ProjectWriteInput['cocStatus'],
    finalInvoiceStatus: (body.finalInvoiceStatus ?? body.finalInvoice) as ProjectWriteInput['finalInvoiceStatus'],
    drylogStatus: body.drylogStatus as ProjectWriteInput['drylogStatus'],
    rewriteStatus: body.rewriteStatus as ProjectWriteInput['rewriteStatus'],
    matterportStatus: (body.matterportStatus ?? body.matterport) as ProjectWriteInput['matterportStatus'],
    companyCamUrl: (body.companyCamUrl ?? body.companyCam) as string | undefined,
    driveFolderUrl: (body.driveFolderUrl ?? body.driveFolder) as string | undefined,
    xactimateNumber: body.xactimateNumber as string | undefined,
    claimNumber: body.claimNumber as string | undefined,
    carrier: body.carrier as string | undefined,
    projectManagerName: body.projectManagerName as string | undefined,
    pmEmail: body.pmEmail as string | undefined,
    pmPhone: body.pmPhone as string | undefined,
    adjusterName: body.adjusterName as string | undefined,
    adjusterEmail: body.adjusterEmail as string | undefined,
    adjusterPhone: body.adjusterPhone as string | undefined,
    invoiceSentDate: body.invoiceSentDate as string | null | undefined,
    dueDate: body.dueDate as string | null | undefined,
    nextFollowUpDate: body.nextFollowUpDate as string | null | undefined,
    paymentReceivedDate: body.paymentReceivedDate as string | null | undefined,
    notes: body.notes as string | undefined,
    done: body.done as boolean | undefined,
  }
}

export function projectToLegacyClaim(project: Project) {
  return {
    id: project.id,
    notionUrl: '',
    clientName: project.clientName,
    invoiceId: project.invoiceId,
    project: project.projectName,
    projectType: project.projectType,
    amount: project.amount,
    status: project.invoiceStatus,
    contract: project.contractStatus,
    coc: project.cocStatus,
    finalInvoice: project.finalInvoiceStatus,
    companyCam: project.companyCamUrl,
    matterport: project.matterportStatus,
    rewriteStatus: project.rewriteStatus,
    xactimateNumber: project.xactimateNumber,
    dateAdded: project.createdAt,
    driveFolder: project.driveFolderUrl,
    notes: project.notes,
    done: project.done,
    projectStatus: project.projectStatus,
    drylogStatus: project.drylogStatus,
    invoiceSentDate: project.invoiceSentDate,
    dueDate: project.dueDate,
    nextFollowUpDate: project.nextFollowUpDate,
    paymentReceivedDate: project.paymentReceivedDate,
    claimNumber: project.claimNumber,
    carrier: project.carrier,
    projectManagerName: project.projectManagerName,
    pmEmail: project.pmEmail,
    pmPhone: project.pmPhone,
    adjusterName: project.adjusterName,
    adjusterEmail: project.adjusterEmail,
    adjusterPhone: project.adjusterPhone,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}
