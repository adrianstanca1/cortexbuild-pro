/**
 * Resource Agent
 * Workforce optimization, equipment scheduling, and skill matching
 */

import { BaseAgent } from './baseAgent.js'
import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import { prisma } from '../../config/database.js'

class ResourceAgent extends BaseAgent {
  constructor() {
    super('Resource Agent')
  }

  async execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult> {
    this.validateInput(input, ['action'])

    const { action } = input

    try {
      switch (action) {
        case 'optimize_workforce':
          return await this.optimizeWorkforce(context)
        case 'schedule_equipment':
          return await this.scheduleEquipment(input.equipmentRequirements, context)
        case 'match_skills':
          return await this.matchSkills(input.requiredSkills, input.projectId, context)
        case 'allocate_resources':
          return await this.allocateResources(input.resourceRequest, context)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error: any) {
      this.log('error', 'Resource optimization failed', { error: error.message })
      throw error
    }
  }

  private async optimizeWorkforce(context: AgentContext): Promise<AgentResult> {
    const projects = await prisma.project.findMany({
      where: {
        organizationId: context.organizationId,
        status: 'ACTIVE',
      },
      include: {
        teamMembers: {
          include: {
            user: true,
          },
        },
        tasks: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      },
    })

    const optimization = {
      currentUtilization: this.calculateUtilization(projects),
      recommendations: this.generateWorkforceRecommendations(projects),
      skillGaps: this.identifySkillGaps(projects),
      reallocation: this.suggestReallocation(projects),
    }

    return {
      output: optimization,
      confidence: 0.85,
      requiresReview: optimization.skillGaps.length > 0,
      tokensUsed: this.estimateTokens(JSON.stringify(optimization)),
    }
  }

  private async scheduleEquipment(
    requirements: any[],
    context: AgentContext
  ): Promise<AgentResult> {
    // Equipment scheduling logic
    const schedule = {
      assignments: requirements.map((req) => ({
        equipment: req.type,
        projectId: context.projectId,
        startDate: req.startDate,
        endDate: req.endDate,
        status: 'SCHEDULED',
      })),
      conflicts: [],
      recommendations: [],
    }

    return {
      output: schedule,
      confidence: 0.8,
      tokensUsed: this.estimateTokens(JSON.stringify(schedule)),
    }
  }

  private async matchSkills(
    requiredSkills: string[],
    projectId: string,
    context: AgentContext
  ): Promise<AgentResult> {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        projectId: projectId || undefined,
      },
      include: {
        user: true,
      },
    })

    const matches = teamMembers.map((member: any) => {
      const memberSkills = member.skills || []
      const matchedSkills = requiredSkills.filter((skill) =>
        memberSkills.some((ms: string) =>
          ms.toLowerCase().includes(skill.toLowerCase())
        )
      )
      const matchScore = matchedSkills.length / requiredSkills.length

      return {
        userId: member.userId,
        userName: member.user.name,
        matchedSkills,
        matchScore,
        efficiency: member.efficiency,
      }
    }).sort((a: any, b: any) => b.matchScore - a.matchScore)

    return {
      output: {
        matches,
        bestMatch: matches[0],
        skillGaps: requiredSkills.filter(
          (skill) => !matches.some((m: any) => m.matchedSkills.includes(skill))
        ),
      },
      confidence: 0.9,
      tokensUsed: this.estimateTokens(JSON.stringify(matches)),
    }
  }

  private async allocateResources(
    resourceRequest: any,
    context: AgentContext
  ): Promise<AgentResult> {
    const allocation = {
      resources: resourceRequest.resources,
      allocation: this.calculateOptimalAllocation(resourceRequest, context),
      timeline: resourceRequest.timeline,
    }

    return {
      output: allocation,
      confidence: 0.85,
      tokensUsed: this.estimateTokens(JSON.stringify(allocation)),
    }
  }

  private calculateUtilization(projects: any[]): number {
    // Simplified utilization calculation
    const totalCapacity = projects.reduce((sum, p) => sum + p.teamMembers.length, 0)
    const activeTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
    return totalCapacity > 0 ? Math.min(activeTasks / totalCapacity, 1) : 0
  }

  private generateWorkforceRecommendations(projects: any[]): string[] {
    const recommendations: string[] = []
    const utilization = this.calculateUtilization(projects)

    if (utilization > 0.9) {
      recommendations.push('High utilization - consider hiring additional staff')
    }
    if (utilization < 0.5) {
      recommendations.push('Low utilization - consider reallocating resources')
    }

    return recommendations
  }

  private identifySkillGaps(projects: any[]): string[] {
    // Simplified skill gap identification
    return []
  }

  private suggestReallocation(projects: any[]): any[] {
    return []
  }

  private calculateOptimalAllocation(resourceRequest: any, context: AgentContext): any {
    return { status: 'allocated' }
  }
}

export const resourceAgent = new ResourceAgent()

