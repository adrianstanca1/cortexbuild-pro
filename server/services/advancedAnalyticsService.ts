import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { generateCompletion, generateStructured, isOllamaAvailable } from './ollamaService.js';
import { logger } from '../utils/logger.js';

// Types for Advanced Analytics
export interface CostForecastInput {
    historicalCosts: number[];
    projectDuration: number;
    currentSpend: number;
    budget: number;
    projectType: string;
}

export interface CostForecastResult {
    predictedTotalCost: number;
    variance: number;
    variancePercentage: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    monthlyForecasts: { month: string; predictedCost: number; confidence: number }[];
    riskFactors: string[];
    recommendations: string[];
    aiInsights: string;
}

export interface RiskPredictionInput {
    projectId: string;
    companyId: string;
    tasks: any[];
    safetyIncidents: any[];
    budgetData: any;
    scheduleData: any;
}

export interface RiskPredictionResult {
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    categoryRisks: {
        schedule: number;
        budget: number;
        safety: number;
        quality: number;
    };
    predictedIssues: {
        type: string;
        probability: number;
        impact: 'low' | 'medium' | 'high';
        timeframe: string;
    }[];
    mitigationStrategies: string[];
    aiAnalysis: string;
}

export interface ResourceUtilizationData {
    userId: string;
    name: string;
    role: string;
    assignedTasks: number;
    completedTasks: number;
    hoursLogged: number;
    capacity: number;
    utilizationRate: number;
    efficiency: number;
}

export interface TrendAnalysisResult {
    metric: string;
    currentValue: number;
    previousValue: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
    forecast: number[];
    seasonality?: boolean;
    anomalies: { date: string; value: number; expected: number; deviation: number }[];
}

export interface AIInsight {
    category: 'cost' | 'schedule' | 'safety' | 'quality' | 'resource' | 'info';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    actionable: boolean;
    suggestedAction?: string;
    confidence: number;
}

/**
 * Advanced Analytics Service
 * Provides AI-powered predictive analytics and insights
 */
export class AdvancedAnalyticsService {
    
    /**
     * Generate AI-powered cost forecasting
     */
    static async forecastCosts(
        companyId: string,
        projectId?: string
    ): Promise<CostForecastResult> {
        const db = getDb();
        
        // Fetch historical cost data
        let costQuery = `
            SELECT 
                strftime('%Y-%m', createdAt) as month,
                SUM(amount) as total,
                category
            FROM transactions 
            WHERE companyId = ?
        `;
        const params: any[] = [companyId];
        
        if (projectId) {
            costQuery += ' AND projectId = ?';
            params.push(projectId);
        }
        
        costQuery += ` GROUP BY month, category ORDER BY month DESC LIMIT 12`;
        
        const costData = await db.all(costQuery, params);
        
        // Fetch project data
        let projectData: any = null;
        if (projectId) {
            projectData = await db.get(
                'SELECT * FROM projects WHERE id = ? AND companyId = ?',
                [projectId, companyId]
            );
        }
        
        // Calculate historical trends
        const monthlyCosts = costData.reduce((acc: any, row: any) => {
            acc[row.month] = (acc[row.month] || 0) + row.total;
            return acc;
        }, {});
        
        const historicalCosts = Object.values(monthlyCosts) as number[];
        const avgMonthlyCost = historicalCosts.length > 0 
            ? historicalCosts.reduce((a, b) => a + b, 0) / historicalCosts.length 
            : 0;
        
        const currentSpend = projectData?.spent || historicalCosts.reduce((a, b) => a + b, 0);
        const budget = projectData?.budget || currentSpend * 1.2;
        const projectDuration = projectData 
            ? Math.ceil((new Date(projectData.endDate).getTime() - new Date(projectData.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
            : 12;
        
        // AI-powered forecasting
        let aiInsights = '';
        let monthlyForecasts: { month: string; predictedCost: number; confidence: number }[] = [];
        let riskFactors: string[] = [];
        let recommendations: string[] = [];
        
        const ollamaAvailable = await isOllamaAvailable();
        
        if (ollamaAvailable && historicalCosts.length >= 3) {
            try {
                const prompt = `
Analyze this construction project cost data and provide forecasting insights:

Historical Monthly Costs (last ${historicalCosts.length} months): ${JSON.stringify(historicalCosts)}
Current Total Spend: $${currentSpend.toLocaleString()}
Budget: $${budget.toLocaleString()}
Project Duration: ${projectDuration} months
Project Type: ${projectData?.type || 'Construction'}

Provide a JSON response with:
{
    "predictedTotalCost": number,
    "riskFactors": ["string"],
    "recommendations": ["string"],
    "insights": "string (2-3 sentences)",
    "monthlyTrend": "increasing|decreasing|stable",
    "confidenceLevel": number (0-100)
}
`;
                
                const messages = [
                    { role: 'system' as const, content: 'You are a construction financial analyst. Provide accurate cost forecasting in JSON format.' },
                    { role: 'user' as const, content: prompt }
                ];
                
                const response = await generateStructured(messages, {
                    type: 'object',
                    properties: {
                        predictedTotalCost: { type: 'number' },
                        riskFactors: { type: 'array', items: { type: 'string' } },
                        recommendations: { type: 'array', items: { type: 'string' } },
                        insights: { type: 'string' },
                        monthlyTrend: { type: 'string' },
                        confidenceLevel: { type: 'number' }
                    }
                });
                
                aiInsights = response.insights || '';
                riskFactors = response.riskFactors || [];
                recommendations = response.recommendations || [];
                
                // Generate monthly forecasts
                const now = new Date();
                for (let i = 1; i <= Math.min(6, projectDuration); i++) {
                    const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const monthKey = forecastMonth.toISOString().slice(0, 7);
                    const trendMultiplier = response.monthlyTrend === 'increasing' ? 1.05 : 
                                          response.monthlyTrend === 'decreasing' ? 0.95 : 1.0;
                    const predictedCost = avgMonthlyCost * Math.pow(trendMultiplier, i);
                    
                    monthlyForecasts.push({
                        month: monthKey,
                        predictedCost: Math.round(predictedCost),
                        confidence: Math.max(50, response.confidenceLevel - (i * 5))
                    });
                }
                
            } catch (error) {
                logger.error('[AdvancedAnalytics] AI cost forecasting error:', error);
            }
        }
        
        // Fallback calculations
        if (monthlyForecasts.length === 0) {
            const now = new Date();
            for (let i = 1; i <= 6; i++) {
                const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
                monthlyForecasts.push({
                    month: forecastMonth.toISOString().slice(0, 7),
                    predictedCost: Math.round(avgMonthlyCost),
                    confidence: Math.max(50, 90 - (i * 8))
                });
            }
        }
        
        const predictedTotalCost = currentSpend + monthlyForecasts.reduce((sum, m) => sum + m.predictedCost, 0);
        const variance = predictedTotalCost - budget;
        const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0;
        
        return {
            predictedTotalCost: Math.round(predictedTotalCost),
            variance: Math.round(variance),
            variancePercentage: Math.round(variancePercentage * 100) / 100,
            confidence: monthlyForecasts[0]?.confidence || 70,
            trend: variance > 0 ? 'increasing' : 'stable',
            monthlyForecasts,
            riskFactors: riskFactors.length > 0 ? riskFactors : ['Insufficient historical data'],
            recommendations: recommendations.length > 0 ? recommendations : ['Collect more cost data for better forecasting'],
            aiInsights: aiInsights || 'Forecast based on historical spending patterns'
        };
    }
    
    /**
     * Predict project risks using AI analysis
     */
    static async predictRisks(companyId: string, projectId: string): Promise<RiskPredictionResult> {
        const db = getDb();
        
        // Fetch comprehensive project data
        const [project, tasks, safetyIncidents, budgetData, scheduleData] = await Promise.all([
            db.get('SELECT * FROM projects WHERE id = ? AND companyId = ?', [projectId, companyId]),
            db.all('SELECT * FROM tasks WHERE projectId = ? AND companyId = ?', [projectId, companyId]),
            db.all('SELECT * FROM safety_incidents WHERE projectId = ? AND companyId = ?', [projectId, companyId]),
            db.get('SELECT SUM(amount) as total FROM transactions WHERE projectId = ? AND companyId = ?', [projectId, companyId]),
            db.all('SELECT * FROM daily_logs WHERE projectId = ? AND companyId = ? ORDER BY date DESC LIMIT 30', [projectId, companyId])
        ]);
        
        if (!project) throw new AppError('Project not found', 404);
        
        // Calculate base risk metrics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
        const overdueTasks = tasks.filter((t: any) => 
            t.status !== 'completed' && new Date(t.dueDate) < new Date()
        ).length;
        const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
        
        const criticalIncidents = safetyIncidents.filter((i: any) => i.severity === 'Critical').length;
        const highIncidents = safetyIncidents.filter((i: any) => i.severity === 'High').length;
        
        const budgetVariance = project.budget - (project.spent || 0);
        const budgetRisk = project.budget > 0 ? ((project.spent || 0) / project.budget) : 0;
        
        // AI Risk Analysis
        let aiAnalysis = '';
        let predictedIssues: any[] = [];
        let mitigationStrategies: string[] = [];
        
        const ollamaAvailable = await isOllamaAvailable();
        
        if (ollamaAvailable) {
            try {
                const prompt = `
Analyze this construction project for risks:

Project: ${project.name}
Status: ${project.status}
Progress: ${project.progress}%
Budget: $${project.budget?.toLocaleString()} / Spent: $${project.spent?.toLocaleString()}
Tasks: ${completedTasks}/${totalTasks} completed (${overdueTasks} overdue)
Safety: ${criticalIncidents} critical, ${highIncidents} high incidents

Provide JSON response:
{
    "overallRiskScore": number (0-100),
    "riskLevel": "low|medium|high|critical",
    "categoryRisks": {
        "schedule": number (0-100),
        "budget": number (0-100),
        "safety": number (0-100),
        "quality": number (0-100)
    },
    "predictedIssues": [
        {
            "type": "string",
            "probability": number (0-100),
            "impact": "low|medium|high",
            "timeframe": "string"
        }
    ],
    "mitigationStrategies": ["string"],
    "analysis": "string (detailed analysis)"
}
`;
                
                const messages = [
                    { role: 'system' as const, content: 'You are a construction risk management expert. Analyze projects and provide detailed risk assessments in JSON format.' },
                    { role: 'user' as const, content: prompt }
                ];
                
                const response = await generateStructured(messages, {
                    type: 'object',
                    properties: {
                        overallRiskScore: { type: 'number' },
                        riskLevel: { type: 'string' },
                        categoryRisks: { type: 'object' },
                        predictedIssues: { type: 'array' },
                        mitigationStrategies: { type: 'array', items: { type: 'string' } },
                        analysis: { type: 'string' }
                    }
                });
                
                return {
                    overallRiskScore: response.overallRiskScore || this.calculateRiskScore(overdueTasks, totalTasks, criticalIncidents, budgetRisk),
                    riskLevel: response.riskLevel || 'medium',
                    categoryRisks: response.categoryRisks || {
                        schedule: Math.min(100, (overdueTasks / Math.max(totalTasks, 1)) * 100),
                        budget: Math.min(100, budgetRisk * 100),
                        safety: Math.min(100, (criticalIncidents * 20) + (highIncidents * 10)),
                        quality: 50
                    },
                    predictedIssues: response.predictedIssues || [],
                    mitigationStrategies: response.mitigationStrategies || [],
                    aiAnalysis: response.analysis || 'Risk analysis completed'
                };
                
            } catch (error) {
                logger.error('[AdvancedAnalytics] AI risk prediction error:', error);
            }
        }
        
        // Fallback risk calculation
        const riskScore = this.calculateRiskScore(overdueTasks, totalTasks, criticalIncidents, budgetRisk);
        
        return {
            overallRiskScore: riskScore,
            riskLevel: riskScore > 75 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low',
            categoryRisks: {
                schedule: Math.min(100, (overdueTasks / Math.max(totalTasks, 1)) * 100),
                budget: Math.min(100, budgetRisk * 100),
                safety: Math.min(100, (criticalIncidents * 20) + (highIncidents * 10)),
                quality: 50
            },
            predictedIssues: [
                {
                    type: overdueTasks > 0 ? 'Schedule Delay' : 'Resource Constraint',
                    probability: Math.min(100, riskScore),
                    impact: riskScore > 50 ? 'high' : 'medium',
                    timeframe: 'Next 30 days'
                }
            ],
            mitigationStrategies: [
                'Review and prioritize overdue tasks',
                'Allocate additional resources to critical path',
                'Conduct safety review meeting'
            ],
            aiAnalysis: 'Risk assessment based on project metrics'
        };
    }
    
    /**
     * Calculate resource utilization analytics
     */
    static async analyzeResourceUtilization(companyId: string): Promise<ResourceUtilizationData[]> {
        const db = getDb();
        
        // Fetch all users and their task assignments
        const users = await db.all(
            'SELECT id, name, role FROM users WHERE companyId = ? AND isActive = 1',
            [companyId]
        );
        
        const utilizationData: ResourceUtilizationData[] = [];
        
        for (const user of users) {
            const [taskStats, timeStats] = await Promise.all([
                db.all(
                    `SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                    FROM tasks 
                    WHERE assignedTo = ? AND companyId = ?`,
                    [user.id, companyId]
                ),
                db.all(
                    `SELECT SUM(hours) as totalHours 
                    FROM time_entries 
                    WHERE userId = ? AND companyId = ? 
                    AND createdAt >= date('now', '-30 days')`,
                    [user.id, companyId]
                )
            ]);
            
            const assignedTasks = taskStats[0]?.total || 0;
            const completedTasks = taskStats[0]?.completed || 0;
            const hoursLogged = timeStats[0]?.totalHours || 0;
            
            // Standard capacity: 160 hours/month (40 hrs/week * 4 weeks)
            const capacity = 160;
            const utilizationRate = Math.min(100, (hoursLogged / capacity) * 100);
            const efficiency = assignedTasks > 0 ? (completedTasks / assignedTasks) * 100 : 0;
            
            utilizationData.push({
                userId: user.id,
                name: user.name,
                role: user.role,
                assignedTasks,
                completedTasks,
                hoursLogged,
                capacity,
                utilizationRate: Math.round(utilizationRate * 100) / 100,
                efficiency: Math.round(efficiency * 100) / 100
            });
        }
        
        return utilizationData.sort((a, b) => b.utilizationRate - a.utilizationRate);
    }
    
    /**
     * Perform trend analysis on various metrics
     */
    static async analyzeTrends(
        companyId: string,
        metric: string,
        timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
    ): Promise<TrendAnalysisResult> {
        const db = getDb();
        
        const intervalMap = {
            week: "date('now', '-7 days')",
            month: "date('now', '-30 days')",
            quarter: "date('now', '-90 days')",
            year: "date('now', '-365 days')"
        };
        
        const interval = intervalMap[timeframe];
        let currentValue = 0;
        let previousValue = 0;
        let anomalies: any[] = [];
        
        // Query based on metric type
        switch (metric) {
            case 'tasks_completed':
                const taskData = await db.all(`
                    SELECT 
                        date(createdAt) as date,
                        COUNT(*) as count
                    FROM tasks 
                    WHERE companyId = ? AND status = 'completed' AND createdAt >= ${interval}
                    GROUP BY date(createdAt)
                    ORDER BY date
                `, [companyId]);
                currentValue = taskData.reduce((sum, row) => sum + row.count, 0);
                
                // Get previous period
                const prevTaskData = await db.all(`
                    SELECT COUNT(*) as count
                    FROM tasks 
                    WHERE companyId = ? AND status = 'completed' 
                    AND createdAt >= date('now', '-60 days')
                    AND createdAt < date('now', '-30 days')
                `, [companyId]);
                previousValue = prevTaskData[0]?.count || 0;
                
                // Detect anomalies
                const avgTasks = currentValue / Math.max(taskData.length, 1);
                anomalies = taskData
                    .filter((row: any) => Math.abs(row.count - avgTasks) > avgTasks * 0.5)
                    .map((row: any) => ({
                        date: row.date,
                        value: row.count,
                        expected: Math.round(avgTasks),
                        deviation: Math.round(((row.count - avgTasks) / avgTasks) * 100)
                    }));
                break;
                
            case 'costs':
                const costData = await db.all(`
                    SELECT 
                        date(createdAt) as date,
                        SUM(amount) as total
                    FROM transactions 
                    WHERE companyId = ? AND createdAt >= ${interval}
                    GROUP BY date(createdAt)
                    ORDER BY date
                `, [companyId]);
                currentValue = costData.reduce((sum, row) => sum + row.total, 0);
                
                const prevCostData = await db.all(`
                    SELECT SUM(amount) as total
                    FROM transactions 
                    WHERE companyId = ? 
                    AND createdAt >= date('now', '-60 days')
                    AND createdAt < date('now', '-30 days')
                `, [companyId]);
                previousValue = prevCostData[0]?.total || 0;
                break;
                
            case 'safety_incidents':
                const safetyData = await db.all(`
                    SELECT 
                        date(createdAt) as date,
                        COUNT(*) as count
                    FROM safety_incidents 
                    WHERE companyId = ? AND createdAt >= ${interval}
                    GROUP BY date(createdAt)
                    ORDER BY date
                `, [companyId]);
                currentValue = safetyData.reduce((sum, row) => sum + row.count, 0);
                
                const prevSafetyData = await db.all(`
                    SELECT COUNT(*) as count
                    FROM safety_incidents 
                    WHERE companyId = ? 
                    AND createdAt >= date('now', '-60 days')
                    AND createdAt < date('now', '-30 days')
                `, [companyId]);
                previousValue = prevSafetyData[0]?.count || 0;
                break;
                
            default:
                throw new AppError(`Unknown metric: ${metric}`, 400);
        }
        
        const changePercentage = previousValue > 0 
            ? ((currentValue - previousValue) / previousValue) * 100 
            : 0;
        
        // Generate forecast
        const forecast = this.generateForecast(currentValue, previousValue, 6);
        
        return {
            metric,
            currentValue,
            previousValue,
            changePercentage: Math.round(changePercentage * 100) / 100,
            trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
            forecast,
            anomalies
        };
    }
    
    /**
     * Generate AI-powered insights across all analytics
     */
    static async generateAIInsights(companyId: string): Promise<AIInsight[]> {
        const db = getDb();
        const insights: AIInsight[] = [];
        
        const ollamaAvailable = await isOllamaAvailable();
        
        if (!ollamaAvailable) {
            return [{
                category: 'info',
                severity: 'info',
                title: 'AI Insights Unavailable',
                description: 'Ollama service is not available. Connect to Ollama for AI-powered insights.',
                actionable: false,
                confidence: 100
            }];
        }
        
        // Gather data for AI analysis
        const [projects, tasks, costs, safety] = await Promise.all([
            db.all('SELECT * FROM projects WHERE companyId = ?', [companyId]),
            db.all('SELECT * FROM tasks WHERE companyId = ?', [companyId]),
            db.get('SELECT SUM(amount) as total FROM transactions WHERE companyId = ?', [companyId]),
            db.all('SELECT * FROM safety_incidents WHERE companyId = ? ORDER BY createdAt DESC LIMIT 10', [companyId])
        ]);
        
        try {
            const prompt = `
Analyze this construction company data and provide actionable insights:

Projects: ${projects.length} total
Tasks: ${tasks.filter((t: any) => t.status === 'completed').length}/${tasks.length} completed
Total Costs: $${(costs?.total || 0).toLocaleString()}
Recent Safety Incidents: ${safety.length}

Provide 3-5 key insights in JSON format:
[
    {
        "category": "cost|schedule|safety|quality|resource",
        "severity": "info|warning|critical",
        "title": "string",
        "description": "string",
        "actionable": boolean,
        "suggestedAction": "string",
        "confidence": number (0-100)
    }
]
`;
            
            const messages = [
                { role: 'system' as const, content: 'You are a construction analytics expert. Provide actionable business insights in JSON format.' },
                { role: 'user' as const, content: prompt }
            ];
            
            const response = await generateStructured(messages, {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        category: { type: 'string' },
                        severity: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        actionable: { type: 'boolean' },
                        suggestedAction: { type: 'string' },
                        confidence: { type: 'number' }
                    }
                }
            });
            
            return response || insights;
            
        } catch (error) {
            logger.error('[AdvancedAnalytics] AI insights generation error:', error);
            return insights;
        }
    }
    
    /**
     * Generate predictive dashboard data
     */
    static async getPredictiveDashboard(companyId: string) {
        const [costForecast, resourceUtilization, trends, aiInsights] = await Promise.all([
            this.forecastCosts(companyId),
            this.analyzeResourceUtilization(companyId),
            Promise.all([
                this.analyzeTrends(companyId, 'tasks_completed', 'month'),
                this.analyzeTrends(companyId, 'costs', 'month'),
                this.analyzeTrends(companyId, 'safety_incidents', 'month')
            ]),
            this.generateAIInsights(companyId)
        ]);
        
        return {
            costForecast,
            resourceUtilization: resourceUtilization.slice(0, 10), // Top 10
            trends: {
                tasks: trends[0],
                costs: trends[1],
                safety: trends[2]
            },
            aiInsights,
            generatedAt: new Date().toISOString()
        };
    }
    
    // Helper methods
    private static calculateRiskScore(
        overdueTasks: number,
        totalTasks: number,
        criticalIncidents: number,
        budgetRisk: number
    ): number {
        const scheduleRisk = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
        const safetyRisk = Math.min(100, criticalIncidents * 25);
        const budgetRiskScore = Math.min(100, budgetRisk * 100);
        
        return Math.round((scheduleRisk * 0.4) + (safetyRisk * 0.3) + (budgetRiskScore * 0.3));
    }
    
    private static generateForecast(current: number, previous: number, periods: number): number[] {
        const trend = previous > 0 ? (current - previous) / previous : 0;
        const forecast: number[] = [];
        let lastValue = current;
        
        for (let i = 0; i < periods; i++) {
            lastValue = lastValue * (1 + trend);
            forecast.push(Math.round(lastValue));
        }
        
        return forecast;
    }
}

export default AdvancedAnalyticsService;
