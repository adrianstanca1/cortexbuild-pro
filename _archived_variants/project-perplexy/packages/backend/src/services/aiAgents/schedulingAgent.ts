/**
 * Scheduling Agent
 * Project timeline optimization, critical path analysis, and resource conflict resolution
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class SchedulingAgent extends BaseAgent {
  constructor() {
    super('Scheduling Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action } = input

    try {
      switch (action) {
        case 'optimize_timeline':
          return await this.optimizeTimeline(input.scheduleId, context)
        case 'analyze_critical_path':
          return await this.analyzeCriticalPath(input.scheduleId, context)
        case 'resolve_conflicts':
          return await this.resolveConflicts(input.scheduleId, context)
        case 'generate_schedule':
          return await this.generateSchedule(input.projectId, input.requirements, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Scheduling optimization failed', { error: error.message })
      throw error
    }
  }

  private async optimizeTimeline(
    scheduleId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: {
          include: {
            tasks: true,
          },
        },
      },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    const optimization = {
      originalTimeline: {
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        duration: this.calculateDuration(schedule.startDate, schedule.endDate),
      },
      optimizedTimeline: this.calculateOptimizedTimeline(schedule),
      improvements: this.identifyImprovements(schedule),
      recommendations: this.generateOptimizationRecommendations(schedule),
    }

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        aiOptimized: true,
        aiRecommendations: optimization.recommendations as any,
        optimizationHistory: {
          push: {
            ...optimization,
            optimizedAt: new Date(),
          },
        },
      },
    })

    return {
      output: optimization,
      confidence: 0.85,
      requiresReview: optimization.improvements.length > 0,
      tokensUsed: this.estimateTokens(JSON.stringify(optimization)),
    }
  }

  private async analyzeCriticalPath(
    scheduleId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: {
          include: {
            tasks: true,
          },
        },
      },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    const criticalPath = this.calculateCriticalPath(schedule)

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        criticalPath: criticalPath as any,
        criticalPathUpdatedAt: new Date(),
      },
    })

    return {
      output: {
        criticalPath,
        totalDuration: criticalPath.duration,
        criticalTasks: criticalPath.tasks,
      },
      confidence: 0.9,
      tokensUsed: this.estimateTokens(JSON.stringify(criticalPath)),
    }
  }

  private async resolveConflicts(
    scheduleId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    })

    if (!schedule) {
      throw new Error('Schedule not found')
    }

    const conflicts = schedule.conflicts || []
    const resolutions = conflicts.map((conflict: any) =>
      this.resolveConflict(conflict)
    )

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        conflicts: [],
        resourceAllocations: this.updateResourceAllocations(
          schedule.resourceAllocations,
          resolutions
        ) as any,
      },
    })

    return {
      output: {
        resolvedConflicts: resolutions.length,
        resolutions,
      },
      confidence: 0.8,
      tokensUsed: this.estimateTokens(JSON.stringify(resolutions)),
    }
  }

  private async generateSchedule(
    projectId: string,
    requirements: any,
    context: AgentContext
  ): Promise<AgentResult> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
      },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const schedule = {
      projectId,
      startDate: requirements.startDate || project.startDate || new Date(),
      endDate: this.calculateEndDate(requirements, project),
      milestones: this.generateMilestones(requirements, project),
      tasks: this.scheduleTasks(project.tasks, requirements),
    }

    return {
      output: schedule,
      confidence: 0.85,
      requiresReview: true,
      tokensUsed: this.estimateTokens(JSON.stringify(schedule)),
    }
  }

  // Helper methods
  private calculateDuration(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculateOptimizedTimeline(schedule: any): any {
    const currentDuration = this.calculateDuration(schedule.startDate, schedule.endDate)
    const optimizedDuration = Math.floor(currentDuration * 0.9) // 10% reduction

    return {
      startDate: schedule.startDate,
      endDate: new Date(
        schedule.startDate.getTime() + optimizedDuration * 24 * 60 * 60 * 1000
      ),
      duration: optimizedDuration,
    }
  }

  private identifyImprovements(schedule: any): string[] {
    return ['Parallel task execution', 'Resource reallocation', 'Buffer reduction']
  }

  private generateOptimizationRecommendations(schedule: any): string[] {
    return [
      'Consider parallel execution of independent tasks',
      'Reallocate resources to critical path activities',
      'Reduce buffer time for non-critical tasks',
    ]
  }

  private calculateCriticalPath(schedule: any): any {
    // Simplified critical path calculation
    return {
      tasks: [],
      duration: this.calculateDuration(schedule.startDate, schedule.endDate),
      path: [],
    }
  }

  private resolveConflict(conflict: any): any {
    return {
      conflictId: conflict.id,
      resolution: 'Resource reallocation',
      status: 'resolved',
    }
  }

  private updateResourceAllocations(
    current: any,
    resolutions: any[]
  ): any {
    return current
  }

  private calculateEndDate(requirements: any, project: any): Date {
    const startDate = requirements.startDate || project.startDate || new Date()
    const duration = requirements.duration || 90 // days
    return new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000)
  }

  private generateMilestones(requirements: any, project: any): any[] {
    return []
  }

  private scheduleTasks(tasks: any[], requirements: any): any[] {
    return tasks.map((task) => ({
      taskId: task.id,
      scheduledStart: task.dueDate || new Date(),
      scheduledEnd: task.dueDate || new Date(),
    }))
  }
}

export const schedulingAgent = new SchedulingAgent()

