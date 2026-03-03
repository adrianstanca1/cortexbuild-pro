export interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  lastRun?: Date
  runCount: number
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual'
  config: Record<string, any>
}

export interface WorkflowAction {
  type: 'notification' | 'email' | 'webhook' | 'database' | 'api'
  config: Record<string, any>
  order: number
}

export interface CreateWorkflowRequest {
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive' | 'draft'
  triggers?: WorkflowTrigger[]
  actions?: WorkflowAction[]
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'success' | 'error' | 'running'
  startedAt: Date
  completedAt?: Date
  error?: string
  logs: string[]
}

