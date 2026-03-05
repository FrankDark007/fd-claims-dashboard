import { CheckCircleIcon } from '@heroicons/react/24/solid'
import type { Claim } from '../../types/claim'

interface ProgressTrackerProps {
  project: Claim
}

interface Step {
  name: string
  status: 'complete' | 'current' | 'upcoming'
}

function getSteps(project: Claim): Step[] {
  const steps: Step[] = []

  // Contract
  if (project.contract === 'Signed') {
    steps.push({ name: 'Contract Signed', status: 'complete' })
  } else if (project.contract === 'Requested') {
    steps.push({ name: 'Contract Requested', status: 'current' })
  } else {
    steps.push({ name: 'Contract', status: 'upcoming' })
  }

  // COC
  if (project.coc === 'Signed') {
    steps.push({ name: 'COC Signed', status: 'complete' })
  } else if (project.coc === 'Requested') {
    steps.push({ name: 'COC Requested', status: 'current' })
  } else {
    steps.push({ name: 'COC', status: steps[0].status === 'complete' ? 'current' : 'upcoming' })
  }

  // Invoice
  if (project.finalInvoice === 'Complete') {
    steps.push({ name: 'Invoice Complete', status: 'complete' })
  } else if (project.finalInvoice === 'Review' || project.finalInvoice === 'Drafting') {
    steps.push({ name: `Invoice ${project.finalInvoice}`, status: 'current' })
  } else {
    steps.push({ name: 'Invoice', status: steps[1].status === 'complete' ? 'current' : 'upcoming' })
  }

  // Payment
  if (project.status === 'Paid') {
    steps.push({ name: 'Paid', status: 'complete' })
  } else if (project.status === 'Sent' || project.status === 'Overdue') {
    steps.push({ name: project.status === 'Overdue' ? 'Overdue' : 'Invoice Sent', status: 'current' })
  } else {
    steps.push({ name: 'Payment', status: steps[2].status === 'complete' ? 'current' : 'upcoming' })
  }

  return steps
}

export default function ProgressTracker({ project }: ProgressTrackerProps) {
  const steps = getSteps(project)

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1 pr-8 sm:pr-20' : ''}`}>
              <div className="flex items-center">
                <div className="relative flex items-center justify-center">
                  {step.status === 'complete' ? (
                    <CheckCircleIcon className="size-8 text-primary" />
                  ) : step.status === 'current' ? (
                    <span className="relative flex size-8 items-center justify-center">
                      <span className="absolute size-8 animate-ping rounded-full bg-primary/20" />
                      <span className="relative size-3 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <span className="flex size-8 items-center justify-center">
                      <span className="size-3 rounded-full bg-gray-300" />
                    </span>
                  )}
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 left-8 right-0 sm:left-8 sm:right-0 h-0.5">
                    <div className={`h-full ${step.status === 'complete' ? 'bg-primary' : 'bg-gray-200'}`} />
                  </div>
                )}
              </div>
              <div className="mt-2">
                <span className={`text-xs font-medium ${
                  step.status === 'complete' ? 'text-primary' :
                  step.status === 'current' ? 'text-foreground' :
                  'text-muted'
                }`}>
                  {step.name}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
