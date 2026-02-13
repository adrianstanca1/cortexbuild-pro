import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToCompany } from '../socket.js';

type AgentType = 'bizadvisor' | 'accountsbot' | 'opsbot';

// ═══════════════════════════════════════════════════════════════════════════════
//  AI AGENT SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIGS: Record<AgentType, { name: string; systemPrompt: string; contextTables: string[] }> = {
    bizadvisor: {
        name: 'BizAdvisorBot',
        systemPrompt: `You are BizAdvisorBot, a professional business advisor for construction companies using CortexBuild Pro.
Your role:
- Identify operational inefficiencies, financial risks, and growth opportunities
- Provide strategic insights and recommend improvements
- Analyse project profitability, cash flow health, and resource utilization
- Advise on market positioning, pricing strategy, and competitive advantages
- Flag risks in current operations and suggest mitigation strategies
- Recommend process improvements based on industry best practices

Format: Use clear headings, bullet points, and when appropriate, include specific numbers from the data. Always provide actionable recommendations with expected impact.
Currency: GBP (£). UK construction market context.`,
        contextTables: ['projects', 'transactions', 'invoices', 'expense_claims', 'cost_codes', 'purchase_orders', 'timesheets']
    },
    accountsbot: {
        name: 'AccountsBot',
        systemPrompt: `You are AccountsBot, an expert construction accounting assistant for UK companies.
Your role:
- Handle VAT calculations, CIS deductions, retentions, and tax compliance
- Provide cash flow predictions and analysis
- Advise on HMRC Making Tax Digital requirements
- Help with journal entries, reconciliation, and financial reporting
- Identify tax-saving opportunities and compliance risks
- Explain construction-specific accounting rules (CIS scheme, retention accounting, stage payments)
- Help prepare VAT returns and understand the 9 boxes

Format: Be precise with numbers. Show calculations step-by-step when relevant. Reference HMRC guidelines where applicable.
Tax year: Use current UK tax bands and NI rates. Currency: GBP (£).`,
        contextTables: ['transactions', 'invoices', 'expense_claims', 'cost_codes', 'gl_accounts', 'tax_returns', 'payroll_runs', 'bank_transactions']
    },
    opsbot: {
        name: 'OpsBot',
        systemPrompt: `You are OpsBot, a construction operations management specialist.
Your role:
- Manage project risks, scheduling conflicts, and resource allocation
- Track compliance tasks, certifications, and safety inspections
- Generate proactive reminders for expiring certifications and overdue inspections
- Recommend optimal task scheduling based on dependencies and resource availability
- Monitor equipment maintenance schedules and flag overdue services
- Identify bottlenecks in project workflows and suggest improvements
- Ensure Health & Safety Executive (HSE) compliance

Format: Use priority levels (CRITICAL, HIGH, MEDIUM, LOW). When listing tasks, include due dates and responsible parties. Be action-oriented.
Context: UK construction regulations, CDM 2015, HSE guidelines.`,
        contextTables: ['projects', 'tasks', 'timesheets', 'equipment', 'safety_checklists', 'compliance_tasks', 'certification_tracker']
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENT SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/ai-agents/sessions */
export const getAgentSessions = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { agentType } = req.query;

        let sql = `SELECT * FROM ai_agent_sessions WHERE companyId = ? AND userId = ?`;
        const params: any[] = [tenantId, userId];
        if (agentType) { sql += ` AND agentType = ?`; params.push(agentType); }
        sql += ` ORDER BY lastMessageAt DESC LIMIT 20`;

        const sessions = await db.all(sql, params);
        res.json(sessions);
    } catch (error) { next(error); }
};

/** POST /api/v1/ai-agents/sessions */
export const createAgentSession = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { agentType, title } = req.body;

        if (!agentType || !AGENT_CONFIGS[agentType as AgentType]) {
            res.status(400).json({ error: 'Invalid agentType. Must be: bizadvisor, accountsbot, or opsbot' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();
        const config = AGENT_CONFIGS[agentType as AgentType];

        await db.run(
            `INSERT INTO ai_agent_sessions (id, companyId, userId, agentType, title, status, messageCount, lastMessageAt, createdAt)
             VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?)`,
            [id, tenantId, userId, agentType, title || `${config.name} Session`, now, now]
        );

        res.status(201).json({ id, agentType, title: title || `${config.name} Session`, agentName: config.name });
    } catch (error) { next(error); }
};

/** GET /api/v1/ai-agents/sessions/:id/messages */
export const getSessionMessages = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;

        const messages = await db.all(
            `SELECT * FROM ai_agent_messages WHERE sessionId = ? AND companyId = ? ORDER BY createdAt ASC`,
            [id, tenantId]
        );

        const parsed = messages.map((m: any) => {
            let metadata = null;
            let actions = null;
            if (m.metadata) { try { metadata = JSON.parse(m.metadata); } catch { /* malformed JSON */ } }
            if (m.actions) { try { actions = JSON.parse(m.actions); } catch { /* malformed JSON */ } }
            return { ...m, metadata, actions };
        });

        res.json(parsed);
    } catch (error) { next(error); }
};

/** POST /api/v1/ai-agents/sessions/:id/message */
export const sendAgentMessage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { id: sessionId } = req.params;
        const { message } = req.body;

        if (!message) { res.status(400).json({ error: 'message is required' }); return; }

        // Get session
        const session = await db.get(`SELECT * FROM ai_agent_sessions WHERE id = ? AND companyId = ?`, [sessionId, tenantId]);
        if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

        const config = AGENT_CONFIGS[session.agentType as AgentType];
        if (!config) { res.status(400).json({ error: 'Unknown agent type' }); return; }

        const now = new Date().toISOString();

        // Save user message
        const userMsgId = uuidv4();
        await db.run(
            `INSERT INTO ai_agent_messages (id, sessionId, companyId, role, content, createdAt) VALUES (?, ?, ?, 'user', ?, ?)`,
            [userMsgId, sessionId, tenantId, message, now]
        );

        // Build context from company data
        const contextData = await buildAgentContext(db, tenantId, config.contextTables);

        // Build AI prompt
        const aiPrompt = buildAgentPrompt(config.systemPrompt, contextData, message, session.agentType as AgentType);

        // Generate response (using local AI logic - production would call Gemini/GPT)
        const aiResponse = generateAgentResponse(session.agentType as AgentType, message, contextData);
        const actions = extractActions(aiResponse, session.agentType as AgentType);

        // Save AI response
        const aiMsgId = uuidv4();
        await db.run(
            `INSERT INTO ai_agent_messages (id, sessionId, companyId, role, content, metadata, actions, createdAt)
             VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?)`,
            [aiMsgId, sessionId, tenantId, aiResponse, JSON.stringify({ agentType: session.agentType, contextSize: Object.keys(contextData).length }), actions.length > 0 ? JSON.stringify(actions) : null, now]
        );

        // Update session
        await db.run(
            `UPDATE ai_agent_sessions SET messageCount = messageCount + 2, lastMessageAt = ? WHERE id = ?`,
            [now, sessionId]
        );

        // Execute any auto-actions
        for (const action of actions) {
            await executeAgentAction(db, tenantId, userId, action);
        }

        res.json({
            userMessage: { id: userMsgId, role: 'user', content: message, createdAt: now },
            assistantMessage: { id: aiMsgId, role: 'assistant', content: aiResponse, actions, createdAt: now }
        });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTEXT BUILDING
// ═══════════════════════════════════════════════════════════════════════════════

async function buildAgentContext(db: any, tenantId: string, tables: string[]): Promise<Record<string, any>> {
    const context: Record<string, any> = {};

    for (const table of tables) {
        try {
            switch (table) {
                case 'projects':
                    context.projects = await db.all(`SELECT id, name, status, health, progress, budget, spent, startDate, endDate FROM projects WHERE companyId = ? LIMIT 20`, [tenantId]);
                    break;
                case 'transactions':
                    const income = await db.get(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE companyId = ? AND type='income' AND status='completed'`, [tenantId]);
                    const expense = await db.get(`SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE companyId = ? AND type='expense' AND status='completed'`, [tenantId]);
                    context.financials = { totalIncome: income?.total || 0, totalExpenses: expense?.total || 0, netProfit: (income?.total || 0) - (expense?.total || 0) };
                    context.recentTransactions = await db.all(`SELECT date, description, amount, type, category FROM transactions WHERE companyId = ? ORDER BY date DESC LIMIT 15`, [tenantId]);
                    break;
                case 'invoices':
                    context.invoiceSummary = {
                        total: (await db.get(`SELECT COUNT(*) as c FROM invoices WHERE companyId = ?`, [tenantId]))?.c || 0,
                        paid: (await db.get(`SELECT COUNT(*) as c, COALESCE(SUM(total),0) as t FROM invoices WHERE companyId = ? AND status='Paid'`, [tenantId])),
                        overdue: (await db.get(`SELECT COUNT(*) as c, COALESCE(SUM(total),0) as t FROM invoices WHERE companyId = ? AND status IN ('Pending','Approved') AND dueDate < ?`, [tenantId, new Date().toISOString().split('T')[0]])),
                    };
                    break;
                case 'expense_claims':
                    context.expenseSummary = await db.get(`SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM expense_claims WHERE companyId = ? AND status IN ('Approved','Paid')`, [tenantId]);
                    break;
                case 'cost_codes':
                    context.costCodes = await db.all(`SELECT code, description, budget, spent, var FROM cost_codes WHERE companyId = ? AND budget > 0 ORDER BY var DESC LIMIT 10`, [tenantId]);
                    break;
                case 'tasks':
                    context.taskSummary = {
                        total: (await db.get(`SELECT COUNT(*) as c FROM tasks WHERE projectId IN (SELECT id FROM projects WHERE companyId = ?)`, [tenantId]))?.c || 0,
                        overdue: (await db.get(`SELECT COUNT(*) as c FROM tasks WHERE projectId IN (SELECT id FROM projects WHERE companyId = ?) AND status != 'Done' AND dueDate < ?`, [tenantId, new Date().toISOString().split('T')[0]]))?.c || 0,
                        blocked: (await db.get(`SELECT COUNT(*) as c FROM tasks WHERE projectId IN (SELECT id FROM projects WHERE companyId = ?) AND status = 'Blocked'`, [tenantId]))?.c || 0,
                    };
                    break;
                case 'equipment':
                    context.equipmentOverdue = await db.all(`SELECT name, type, nextService FROM equipment WHERE companyId = ? AND nextService IS NOT NULL AND nextService < ? LIMIT 10`, [tenantId, new Date().toISOString().split('T')[0]]);
                    break;
                case 'timesheets':
                    context.timesheetSummary = await db.get(`SELECT COUNT(DISTINCT employeeId) as workers, COALESCE(SUM(hoursWorked),0) as totalHours FROM timesheets WHERE companyId = ? AND date >= ?`, [tenantId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]);
                    break;
                case 'gl_accounts':
                    context.glBalances = await db.all(`SELECT code, name, type, balance FROM gl_accounts WHERE companyId = ? AND isActive = 1 AND balance != 0 ORDER BY ABS(balance) DESC LIMIT 15`, [tenantId]);
                    break;
                case 'tax_returns':
                    context.taxReturns = await db.all(`SELECT type, periodStart, periodEnd, status, amountDue FROM tax_returns WHERE companyId = ? ORDER BY periodEnd DESC LIMIT 5`, [tenantId]);
                    break;
                case 'payroll_runs':
                    context.payrollSummary = await db.get(`SELECT COUNT(*) as runs, COALESCE(SUM(totalNet),0) as totalPaid FROM payroll_runs WHERE companyId = ?`, [tenantId]);
                    break;
                case 'safety_checklists':
                    context.safetyScore = await db.get(`SELECT AVG(score) as avgScore, COUNT(*) as total FROM safety_checklists WHERE companyId = ? AND score IS NOT NULL`, [tenantId]);
                    break;
                case 'compliance_tasks':
                    const overdueTasks = await db.all(`SELECT title, category, dueDate, priority FROM compliance_tasks WHERE companyId = ? AND status = 'pending' AND dueDate < ? LIMIT 10`, [tenantId, new Date().toISOString().split('T')[0]]);
                    context.overdueComplianceTasks = overdueTasks;
                    break;
                case 'certification_tracker':
                    const expiringCerts = await db.all(`SELECT employeeName, certName, expiryDate FROM certification_tracker WHERE companyId = ? AND expiryDate <= ? AND status != 'expired' LIMIT 10`, [tenantId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]);
                    context.expiringCertifications = expiringCerts;
                    break;
                case 'bank_transactions':
                    context.unreconciledCount = (await db.get(`SELECT COUNT(*) as c FROM bank_transactions WHERE companyId = ? AND reconciliationStatus = 'unmatched'`, [tenantId]))?.c || 0;
                    break;
                case 'purchase_orders':
                    context.poSummary = await db.get(`SELECT COUNT(*) as total, COALESCE(SUM(amount),0) as totalValue FROM purchase_orders WHERE companyId = ?`, [tenantId]);
                    break;
            }
        } catch (err: any) { /* Table may not exist yet - log for debugging */ if (err?.message && !err.message.includes('no such table')) console.warn(`[AI Agent Context] Failed to load ${table}:`, err.message); }
    }

    return context;
}

function buildAgentPrompt(systemPrompt: string, context: Record<string, any>, userMessage: string, agentType: AgentType): string {
    return `${systemPrompt}\n\n--- COMPANY DATA ---\n${JSON.stringify(context, null, 2)}\n\n--- USER QUESTION ---\n${userMessage}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  INTELLIGENT RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateAgentResponse(agentType: AgentType, message: string, context: Record<string, any>): string {
    const msg = message.toLowerCase();

    switch (agentType) {
        case 'bizadvisor':
            return generateBizAdvisorResponse(msg, context);
        case 'accountsbot':
            return generateAccountsBotResponse(msg, context);
        case 'opsbot':
            return generateOpsBotResponse(msg, context);
        default:
            return 'I can help you with business insights. What would you like to know?';
    }
}

function generateBizAdvisorResponse(msg: string, ctx: Record<string, any>): string {
    const fin = ctx.financials || { totalIncome: 0, totalExpenses: 0, netProfit: 0 };
    const margin = fin.totalIncome > 0 ? ((fin.netProfit / fin.totalIncome) * 100).toFixed(1) : '0.0';
    const projects = ctx.projects || [];
    const activeProjects = projects.filter((p: any) => p.status === 'Active' || p.status === 'In Progress');
    const overBudget = projects.filter((p: any) => p.spent > p.budget && p.budget > 0);

    if (msg.includes('overview') || msg.includes('health') || msg.includes('how') || msg.includes('status')) {
        return `## Business Health Overview\n\n**Financial Summary:**\n- Total Revenue: **£${fin.totalIncome.toLocaleString()}**\n- Total Costs: **£${fin.totalExpenses.toLocaleString()}**\n- Net Profit: **£${fin.netProfit.toLocaleString()}** (${margin}% margin)\n\n**Portfolio:**\n- ${projects.length} total projects (${activeProjects.length} active)\n- ${overBudget.length} projects over budget\n${ctx.invoiceSummary?.overdue?.c > 0 ? `- **${ctx.invoiceSummary.overdue.c} overdue invoices** worth £${(ctx.invoiceSummary.overdue.t || 0).toLocaleString()}\n` : ''}\n**Key Recommendations:**\n1. ${overBudget.length > 0 ? `Review the ${overBudget.length} over-budget project(s) immediately - ${overBudget.map((p: any) => p.name).join(', ')}` : 'All projects within budget - well managed'}\n2. ${parseFloat(margin) < 15 ? 'Profit margin below 15% - review pricing strategy and overhead allocation' : 'Healthy margins - consider reinvesting in growth'}\n3. ${ctx.invoiceSummary?.overdue?.c > 0 ? 'Chase overdue invoices to improve cash position' : 'Invoice collections on track'}`;
    }

    if (msg.includes('risk') || msg.includes('problem') || msg.includes('issue')) {
        const risks: string[] = [];
        if (overBudget.length > 0) risks.push(`**Budget Overruns:** ${overBudget.length} project(s) exceeding budget`);
        if (ctx.invoiceSummary?.overdue?.c > 0) risks.push(`**Cash Flow Risk:** ${ctx.invoiceSummary.overdue.c} overdue invoices (£${(ctx.invoiceSummary.overdue.t || 0).toLocaleString()})`);
        if (parseFloat(margin) < 10) risks.push(`**Low Margins:** Net margin at ${margin}% - below industry standard 10-15%`);
        if (ctx.costCodes?.some((cc: any) => cc.var > 20)) risks.push(`**Cost Spikes:** Some cost codes 20%+ over budget`);
        return `## Risk Assessment\n\n${risks.length > 0 ? risks.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'No critical risks identified. Operations appear healthy.'}\n\n**Mitigation Actions:**\n- Review cost code variances weekly\n- Implement stricter PO approval thresholds\n- Set up automated cash flow alerts`;
    }

    if (msg.includes('profit') || msg.includes('margin') || msg.includes('money')) {
        return `## Profitability Analysis\n\n**Company-Wide:**\n- Revenue: £${fin.totalIncome.toLocaleString()}\n- Costs: £${fin.totalExpenses.toLocaleString()}\n- Net Profit: £${fin.netProfit.toLocaleString()}\n- Margin: ${margin}%\n\n**By Project:**\n${projects.slice(0, 5).map((p: any) => `- **${p.name}**: Budget £${(p.budget || 0).toLocaleString()}, Spent £${(p.spent || 0).toLocaleString()} (${p.budget > 0 ? ((p.spent / p.budget) * 100).toFixed(0) : 0}%)`).join('\n')}\n\n**Recommendations:**\n- ${parseFloat(margin) < 15 ? 'Target 15-20% margins on new tenders' : 'Margins healthy - maintain current pricing'}\n- Review top cost categories for savings opportunities\n- Consider value engineering on over-budget projects`;
    }

    return `## BizAdvisorBot\n\nI can help you with:\n- **Business health overview** - "How is my business doing?"\n- **Risk assessment** - "What are my key risks?"\n- **Profitability analysis** - "Show me profit by project"\n- **Growth strategy** - "How can I grow?"\n- **Cash flow** - "What's my cash position?"\n\nYour current snapshot: ${activeProjects.length} active projects, £${fin.netProfit.toLocaleString()} net profit (${margin}% margin).`;
}

function generateAccountsBotResponse(msg: string, ctx: Record<string, any>): string {
    const fin = ctx.financials || { totalIncome: 0, totalExpenses: 0, netProfit: 0 };

    if (msg.includes('vat') || msg.includes('tax return') || msg.includes('mtd')) {
        const outputVAT = Math.round(fin.totalIncome * 0.20 * 100) / 100;
        const inputVAT = Math.round(fin.totalExpenses * 0.20 * 100) / 100;
        const netVAT = outputVAT - inputVAT;
        return `## VAT Summary\n\n**Output VAT (on sales):** £${outputVAT.toLocaleString()}\n**Input VAT (on purchases):** £${inputVAT.toLocaleString()}\n**Net VAT ${netVAT >= 0 ? 'Payable' : 'Reclaimable'}:** £${Math.abs(netVAT).toLocaleString()}\n\n**MTD Status:**\n${ctx.taxReturns?.length > 0 ? ctx.taxReturns.map((tr: any) => `- ${tr.type}: ${tr.status} (${tr.periodStart} to ${tr.periodEnd}) - £${(tr.amountDue || 0).toLocaleString()}`).join('\n') : 'No VAT returns filed yet. Use Tax & HMRC tab to calculate.'}\n\n**Action:** Calculate your quarterly VAT return in the Accounting Hub > Tax & HMRC tab.`;
    }

    if (msg.includes('cis') || msg.includes('subcontractor')) {
        return `## CIS (Construction Industry Scheme)\n\n**How CIS Works:**\n- Contractors deduct tax from subcontractor payments before paying them\n- Standard deduction rate: **20%** (verified subcontractors)\n- Higher rate: **30%** (unverified subcontractors)\n- Gross payment status: **0%** (approved by HMRC)\n\n**Your CIS Summary:**\n${ctx.payrollSummary ? `- Total payroll processed: £${(ctx.payrollSummary.totalPaid || 0).toLocaleString()} across ${ctx.payrollSummary.runs || 0} runs` : 'No payroll data yet'}\n\n**Key Obligations:**\n1. Verify all subcontractors with HMRC before first payment\n2. File monthly CIS returns by the 19th\n3. Provide payment and deduction statements to subcontractors\n4. Keep records for at least 3 years`;
    }

    if (msg.includes('cash flow') || msg.includes('cashflow') || msg.includes('cash position')) {
        const overdueAmount = ctx.invoiceSummary?.overdue?.t || 0;
        return `## Cash Flow Analysis\n\n**Current Position:**\n- Income (completed): £${fin.totalIncome.toLocaleString()}\n- Expenses (completed): £${fin.totalExpenses.toLocaleString()}\n- Net Cash: £${fin.netProfit.toLocaleString()}\n\n**Receivables:**\n- Overdue invoices: ${ctx.invoiceSummary?.overdue?.c || 0} totalling £${overdueAmount.toLocaleString()}\n- ${ctx.unreconciledCount || 0} unreconciled bank transactions\n\n**Forecast:**\n- If overdue invoices are collected: +£${overdueAmount.toLocaleString()}\n- Projected 30-day cash position: £${(fin.netProfit + overdueAmount).toLocaleString()}\n\n**Recommendations:**\n1. ${overdueAmount > 0 ? 'Chase overdue invoices immediately' : 'Collections are current'}\n2. Review upcoming payable commitments\n3. Consider invoice factoring if cash is tight`;
    }

    return `## AccountsBot\n\nI specialise in construction accounting. Ask me about:\n- **VAT returns** - "Calculate my VAT"\n- **CIS scheme** - "Explain CIS deductions"\n- **Cash flow** - "What's my cash position?"\n- **PAYE & payroll** - "Help with payroll calculations"\n- **Retentions** - "How do retentions work?"\n- **Tax planning** - "How can I reduce my tax bill?"`;
}

function generateOpsBotResponse(msg: string, ctx: Record<string, any>): string {
    if (msg.includes('compliance') || msg.includes('overdue') || msg.includes('check')) {
        const overdueTasks = ctx.overdueComplianceTasks || [];
        const expiringCerts = ctx.expiringCertifications || [];
        const overdueEquip = ctx.equipmentOverdue || [];
        return `## Compliance Status\n\n**Overdue Compliance Tasks:** ${overdueTasks.length}\n${overdueTasks.map((t: any) => `- [${t.priority}] ${t.title} (${t.category}) - Due: ${t.dueDate}`).join('\n') || '- None - all compliance tasks current'}\n\n**Expiring Certifications (30 days):** ${expiringCerts.length}\n${expiringCerts.map((c: any) => `- ${c.employeeName}: ${c.certName} expires ${c.expiryDate}`).join('\n') || '- None expiring'}\n\n**Equipment Service Overdue:** ${overdueEquip.length}\n${overdueEquip.map((e: any) => `- ${e.name} (${e.type}) - Service due: ${e.nextService}`).join('\n') || '- All equipment serviced'}\n\n**Safety Score:** ${ctx.safetyScore?.avgScore ? `${ctx.safetyScore.avgScore.toFixed(0)}% (${ctx.safetyScore.total} audits)` : 'No audits completed'}`;
    }

    if (msg.includes('schedule') || msg.includes('task') || msg.includes('resource')) {
        const taskSum = ctx.taskSummary || { total: 0, overdue: 0, blocked: 0 };
        const tsSum = ctx.timesheetSummary || { workers: 0, totalHours: 0 };
        return `## Operations Dashboard\n\n**Task Status:**\n- Total tasks: ${taskSum.total}\n- Overdue: ${taskSum.overdue} ${taskSum.overdue > 0 ? '(NEEDS ATTENTION)' : ''}\n- Blocked: ${taskSum.blocked} ${taskSum.blocked > 0 ? '(RESOLVE DEPENDENCIES)' : ''}\n\n**Resource Utilization (Last 30 Days):**\n- Active workers: ${tsSum.workers}\n- Total hours logged: ${(tsSum.totalHours || 0).toLocaleString()}\n- Avg hours/worker: ${tsSum.workers > 0 ? ((tsSum.totalHours || 0) / tsSum.workers).toFixed(0) : 0}\n\n**Recommendations:**\n1. ${taskSum.blocked > 0 ? `Unblock ${taskSum.blocked} tasks to prevent schedule slippage` : 'No blocked tasks'}\n2. ${taskSum.overdue > 0 ? `Reschedule ${taskSum.overdue} overdue tasks and reassign if needed` : 'All tasks on schedule'}\n3. Review critical path for weather-sensitive activities`;
    }

    return `## OpsBot\n\nI manage construction operations. Ask me about:\n- **Compliance status** - "What's overdue?"\n- **Task scheduling** - "Show my task summary"\n- **Certifications** - "What's expiring?"\n- **Equipment** - "Any overdue servicing?"\n- **Safety** - "What's our safety score?"\n- **Risk analysis** - "What are the project risks?"`;
}

function extractActions(response: string, agentType: AgentType): any[] {
    // In production, parse structured actions from AI response
    return [];
}

async function executeAgentAction(db: any, tenantId: string, userId: string, action: any): Promise<void> {
    // Execute agent-recommended actions (create tasks, send notifications, etc.)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPLIANCE TASK SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/ai-agents/compliance/generate-tasks */
export const generateComplianceTasks = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const generated: any[] = [];

        // Construction compliance task templates
        const templates = [
            { title: 'Weekly MEWP Pre-Use Inspection', category: 'Working at Height', recurringInterval: 'weekly', regulatoryRef: 'LOLER 1998', priority: 'High' },
            { title: 'Weekly Toolbox Talk', category: 'Health & Safety', recurringInterval: 'weekly', regulatoryRef: 'HSE CDM 2015', priority: 'Medium' },
            { title: 'Monthly Fire Extinguisher Check', category: 'Fire Safety', recurringInterval: 'monthly', regulatoryRef: 'RRO 2005', priority: 'High' },
            { title: 'Monthly Scaffolding Inspection', category: 'Working at Height', recurringInterval: 'monthly', regulatoryRef: 'Work at Height Regs 2005', priority: 'Critical' },
            { title: 'Monthly First Aid Kit Inspection', category: 'Health & Safety', recurringInterval: 'monthly', regulatoryRef: 'H&S First Aid Regs 1981', priority: 'Medium' },
            { title: 'Quarterly Electrical Installation Check', category: 'Electrical Safety', recurringInterval: 'quarterly', regulatoryRef: 'BS 7671', priority: 'High' },
            { title: 'Quarterly PAT Testing', category: 'Electrical Safety', recurringInterval: 'quarterly', regulatoryRef: 'IET Code of Practice', priority: 'Medium' },
            { title: 'Six-Monthly Thorough Examination (Lifting Equipment)', category: 'Plant & Equipment', recurringInterval: 'biannual', regulatoryRef: 'LOLER 1998 Reg 9', priority: 'Critical' },
            { title: 'Annual Asbestos Survey Review', category: 'Hazardous Materials', recurringInterval: 'annual', regulatoryRef: 'CAR 2012', priority: 'Critical' },
            { title: 'Annual F10 Notification Review', category: 'CDM Compliance', recurringInterval: 'annual', regulatoryRef: 'CDM 2015 Reg 6', priority: 'High' },
            { title: 'Weekly Site Waste Management Check', category: 'Environmental', recurringInterval: 'weekly', regulatoryRef: 'EPA 1990', priority: 'Medium' },
            { title: 'Monthly Noise Assessment Review', category: 'Health & Safety', recurringInterval: 'monthly', regulatoryRef: 'Noise at Work Regs 2005', priority: 'Medium' },
            { title: 'Dust Monitoring Check', category: 'Health & Safety', recurringInterval: 'weekly', regulatoryRef: 'COSHH 2002', priority: 'High' },
        ];

        const intervalDays: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 91, biannual: 182, annual: 365 };

        for (const tmpl of templates) {
            // Check if this task already exists and is pending
            const existing = await db.get(
                `SELECT id FROM compliance_tasks WHERE companyId = ? AND title = ? AND status = 'pending'`,
                [tenantId, tmpl.title]
            );
            if (existing) continue;

            // Check last completed
            const lastCompleted = await db.get(
                `SELECT completedAt FROM compliance_tasks WHERE companyId = ? AND title = ? AND status = 'completed' ORDER BY completedAt DESC LIMIT 1`,
                [tenantId, tmpl.title]
            );

            const days = intervalDays[tmpl.recurringInterval] || 30;
            let isDue = true;
            if (lastCompleted?.completedAt) {
                const daysSince = Math.floor((now.getTime() - new Date(lastCompleted.completedAt).getTime()) / (1000 * 60 * 60 * 24));
                isDue = daysSince >= days - 2; // Generate 2 days before due
            }

            if (isDue) {
                const id = uuidv4();
                const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                await db.run(
                    `INSERT INTO compliance_tasks (id, companyId, title, description, category, type, priority, status, dueDate, recurringInterval, regulatoryRef, autoGenerated, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, 'inspection', ?, 'pending', ?, ?, ?, 1, ?, ?)`,
                    [id, tenantId, tmpl.title, `Auto-generated compliance task per ${tmpl.regulatoryRef}`, tmpl.category, tmpl.priority, dueDate, tmpl.recurringInterval, tmpl.regulatoryRef, now.toISOString(), now.toISOString()]
                );
                generated.push({ id, title: tmpl.title, category: tmpl.category, dueDate, priority: tmpl.priority });
            }
        }

        // Check for expiring certifications and create reminder tasks
        const expiringCerts = await db.all(
            `SELECT * FROM certification_tracker WHERE companyId = ? AND expiryDate <= ? AND status != 'expired' AND reminderSent = 0`,
            [tenantId, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
        );

        for (const cert of expiringCerts) {
            const id = uuidv4();
            await db.run(
                `INSERT INTO compliance_tasks (id, companyId, title, description, category, priority, status, dueDate, assigneeId, assigneeName, linkedEntityType, linkedEntityId, autoGenerated, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, 'Certifications', 'High', 'pending', ?, ?, ?, 'certification', ?, 1, ?, ?)`,
                [id, tenantId, `Renew: ${cert.certName} for ${cert.employeeName}`, `Certificate expires ${cert.expiryDate}. Issued by ${cert.issuer}.`, cert.expiryDate, cert.employeeId, cert.employeeName, cert.id, now.toISOString(), now.toISOString()]
            );
            await db.run(`UPDATE certification_tracker SET reminderSent = 1, reminderDate = ? WHERE id = ?`, [today, cert.id]);
            generated.push({ id, title: `Renew: ${cert.certName} for ${cert.employeeName}`, category: 'Certifications', dueDate: cert.expiryDate });
        }

        // Check equipment service overdue
        const overdueEquip = await db.all(
            `SELECT * FROM equipment WHERE companyId = ? AND nextService IS NOT NULL AND nextService < ?`,
            [tenantId, today]
        );

        for (const eq of overdueEquip) {
            const existing = await db.get(`SELECT id FROM compliance_tasks WHERE companyId = ? AND linkedEntityType = 'equipment' AND linkedEntityId = ? AND status = 'pending'`, [tenantId, eq.id]);
            if (existing) continue;
            const id = uuidv4();
            await db.run(
                `INSERT INTO compliance_tasks (id, companyId, title, description, category, priority, status, dueDate, linkedEntityType, linkedEntityId, autoGenerated, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, 'Plant & Equipment', 'High', 'pending', ?, 'equipment', ?, 1, ?, ?)`,
                [id, tenantId, `Service Overdue: ${eq.name}`, `${eq.type} - last serviced ${eq.lastService || 'unknown'}. Service was due ${eq.nextService}.`, today, eq.id, now.toISOString(), now.toISOString()]
            );
            generated.push({ id, title: `Service Overdue: ${eq.name}`, category: 'Plant & Equipment', dueDate: today });
        }

        res.json({ generated: generated.length, tasks: generated });
    } catch (error) { next(error); }
};

/** GET /api/v1/ai-agents/compliance/tasks */
export const getComplianceTasks = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { status, category } = req.query;
        let sql = `SELECT * FROM compliance_tasks WHERE companyId = ?`;
        const params: any[] = [tenantId];
        if (status) { sql += ` AND status = ?`; params.push(status); }
        if (category) { sql += ` AND category = ?`; params.push(category); }
        sql += ` ORDER BY CASE priority WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, dueDate ASC LIMIT 100`;
        const tasks = await db.all(sql, params);
        res.json(tasks);
    } catch (error) { next(error); }
};

/** PUT /api/v1/ai-agents/compliance/tasks/:id/complete */
export const completeComplianceTask = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { id } = req.params;
        const { notes } = req.body;
        const now = new Date().toISOString();

        await db.run(
            `UPDATE compliance_tasks SET status = 'completed', completedBy = ?, completedAt = ?, notes = COALESCE(?, notes), updatedAt = ? WHERE id = ? AND companyId = ?`,
            [userId, now, notes || null, now, id, tenantId]
        );

        res.json({ success: true });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PAYSLIP GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/ai-agents/salary-records */
export const getSalaryRecords = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const records = await db.all(`SELECT * FROM employee_salary_records WHERE companyId = ? AND status = 'active' ORDER BY employeeName ASC`, [tenantId]);
        res.json(records);
    } catch (error) { next(error); }
};

/** POST /api/v1/ai-agents/salary-records */
export const createSalaryRecord = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const data = req.body;

        if (!data.employeeId || !data.employeeName) {
            res.status(400).json({ error: 'employeeId and employeeName are required' }); return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();
        await db.run(
            `INSERT INTO employee_salary_records (id, companyId, employeeId, employeeName, employeeEmail, jobTitle, department, payFrequency, baseSalary, hourlyRate, overtimeRate, taxCode, niCategory, isCIS, pensionOptIn, pensionEmployeePercent, pensionEmployerPercent, studentLoanPlan, bankAccountName, bankSortCode, bankAccountNumber, startDate, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
            [id, tenantId, data.employeeId, data.employeeName, data.employeeEmail || null, data.jobTitle || null, data.department || null, data.payFrequency || 'monthly', data.baseSalary || 0, data.hourlyRate || 0, data.overtimeRate || 0, data.taxCode || '1257L', data.niCategory || 'A', data.isCIS ? 1 : 0, data.pensionOptIn !== false ? 1 : 0, data.pensionEmployeePercent || 5, data.pensionEmployerPercent || 3, data.studentLoanPlan || null, data.bankAccountName || null, data.bankSortCode || null, data.bankAccountNumber || null, data.startDate || null, now, now]
        );

        res.status(201).json({ id, employeeName: data.employeeName });
    } catch (error) { next(error); }
};

/** POST /api/v1/ai-agents/payslips/generate */
export const generatePayslips = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { payrollRunId } = req.body;

        if (!payrollRunId) { res.status(400).json({ error: 'payrollRunId is required' }); return; }

        const run = await db.get(`SELECT * FROM payroll_runs WHERE id = ? AND companyId = ?`, [payrollRunId, tenantId]);
        if (!run) { res.status(404).json({ error: 'Payroll run not found' }); return; }

        const items = await db.all(`SELECT * FROM payroll_items WHERE payrollRunId = ? AND companyId = ?`, [payrollRunId, tenantId]);
        const payslips: any[] = [];

        for (const item of items) {
            // Get YTD totals
            const ytd = await db.get(
                `SELECT COALESCE(SUM(grossPay),0) as gross, COALESCE(SUM(paye),0) as tax, COALESCE(SUM(employeeNI),0) as ni, COALESCE(SUM(netPay),0) as net
                 FROM payslips WHERE employeeId = ? AND companyId = ? AND payDate >= ? AND status = 'issued'`,
                [item.employeeId, tenantId, `${new Date().getFullYear()}-04-06`]
            );

            const salaryRecord = await db.get(`SELECT jobTitle, niNumber FROM employee_salary_records WHERE employeeId = ? AND companyId = ?`, [item.employeeId, tenantId]);

            const id = uuidv4();
            const now = new Date().toISOString();

            await db.run(
                `INSERT INTO payslips (id, companyId, payrollRunId, payrollItemId, employeeId, employeeName, periodStart, periodEnd, payDate, jobTitle, taxCode, basicPay, overtimePay, allowances, grossPay, paye, employeeNI, employerNI, cisDeduction, pensionEmployee, pensionEmployer, studentLoan, otherDeductions, totalDeductions, netPay, hoursWorked, overtimeHours, yearToDateGross, yearToDateTax, yearToDateNI, yearToDateNet, paymentMethod, status, issuedAt, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'BACS', 'issued', ?, ?)`,
                [id, tenantId, payrollRunId, item.id, item.employeeId, item.employeeName, run.periodStart, run.periodEnd, run.payDate, salaryRecord?.jobTitle || null, item.taxCode, item.basicPay, item.overtimePay, item.allowances, item.grossPay, item.paye, item.employeeNI, item.employerNI, item.cisDeduction, item.pensionEmployee, item.pensionEmployer, item.studentLoan, item.paye + item.employeeNI + item.cisDeduction + item.pensionEmployee + item.studentLoan, item.netPay, item.hoursWorked, item.overtimeHours, (ytd?.gross || 0) + item.grossPay, (ytd?.tax || 0) + item.paye, (ytd?.ni || 0) + item.employeeNI, (ytd?.net || 0) + item.netPay, now, now]
            );

            payslips.push({ id, employeeName: item.employeeName, grossPay: item.grossPay, netPay: item.netPay });
        }

        res.json({ generated: payslips.length, payslips });
    } catch (error) { next(error); }
};

/** GET /api/v1/ai-agents/payslips */
export const getPayslips = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { employeeId, payrollRunId } = req.query;
        let sql = `SELECT * FROM payslips WHERE companyId = ?`;
        const params: any[] = [tenantId];
        if (employeeId) { sql += ` AND employeeId = ?`; params.push(employeeId); }
        if (payrollRunId) { sql += ` AND payrollRunId = ?`; params.push(payrollRunId); }
        sql += ` ORDER BY payDate DESC LIMIT 100`;
        const slips = await db.all(sql, params);
        res.json(slips);
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CASH FLOW PREDICTION & GRANT ELIGIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/ai-agents/cash-flow/predict */
export const predictCashFlow = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { months = 3 } = req.body;
        const now = new Date();

        // Get historical monthly data
        const monthlyData: any[] = [];
        for (let i = 6; i >= 1; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().split('T')[0];
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString().split('T')[0];
            const income = await db.get(`SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE companyId = ? AND type='income' AND date >= ? AND date <= ?`, [tenantId, monthStart, monthEnd]);
            const expenses = await db.get(`SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE companyId = ? AND type='expense' AND date >= ? AND date <= ?`, [tenantId, monthStart, monthEnd]);
            monthlyData.push({ month: monthStart.substring(0, 7), income: income?.t || 0, expenses: expenses?.t || 0, net: (income?.t || 0) - (expenses?.t || 0) });
        }

        // Simple trend-based forecasting
        const avgIncome = monthlyData.reduce((s, m) => s + m.income, 0) / Math.max(monthlyData.length, 1);
        const avgExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0) / Math.max(monthlyData.length, 1);
        const incomeTrend = monthlyData.length >= 2 ? (monthlyData[monthlyData.length - 1].income - monthlyData[0].income) / monthlyData.length : 0;
        const expenseTrend = monthlyData.length >= 2 ? (monthlyData[monthlyData.length - 1].expenses - monthlyData[0].expenses) / monthlyData.length : 0;

        // Known upcoming receivables
        const upcomingInvoices = await db.get(
            `SELECT COALESCE(SUM(total),0) as t FROM invoices WHERE companyId = ? AND status IN ('Pending','Approved') AND dueDate >= ? AND dueDate <= ?`,
            [tenantId, now.toISOString().split('T')[0], new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
        );

        // Known upcoming payroll
        const monthlyPayroll = await db.get(`SELECT COALESCE(AVG(totalNet),0) as avg FROM payroll_runs WHERE companyId = ?`, [tenantId]);

        const forecasts: any[] = [];
        const forecastDate = now.toISOString();
        let runningCash = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].net : 0;

        for (let m = 1; m <= months; m++) {
            const projIncome = Math.max(0, avgIncome + (incomeTrend * m));
            const projExpenses = Math.max(0, avgExpenses + (expenseTrend * m));
            const projNet = projIncome - projExpenses;
            runningCash += projNet;
            const confidence = Math.max(0.5, 0.85 - (m * 0.1)); // Decreasing confidence

            const periodStart = new Date(now.getFullYear(), now.getMonth() + m, 1).toISOString().split('T')[0];
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + m + 1, 0).toISOString().split('T')[0];

            const id = uuidv4();
            await db.run(
                `INSERT INTO cash_flow_forecasts (id, companyId, forecastDate, periodStart, periodEnd, projectedIncome, projectedExpenses, projectedNetCash, confidence, assumptions, createdBy, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, tenantId, forecastDate, periodStart, periodEnd, Math.round(projIncome), Math.round(projExpenses), Math.round(projNet), confidence, JSON.stringify({ avgIncome: Math.round(avgIncome), avgExpenses: Math.round(avgExpenses), incomeTrend: Math.round(incomeTrend), expenseTrend: Math.round(expenseTrend) }), req.userId, now.toISOString()]
            );

            forecasts.push({ month: periodStart.substring(0, 7), projectedIncome: Math.round(projIncome), projectedExpenses: Math.round(projExpenses), projectedNet: Math.round(projNet), cumulativeCash: Math.round(runningCash), confidence: Math.round(confidence * 100) });
        }

        // AI insights
        const insights: string[] = [];
        if (incomeTrend < 0) insights.push('Income is trending downward - review sales pipeline and client acquisition');
        if (expenseTrend > avgExpenses * 0.05) insights.push('Expenses growing faster than income - review cost control measures');
        if (runningCash < 0) insights.push('CRITICAL: Cash flow projected to go negative - arrange funding or accelerate collections');
        if ((upcomingInvoices?.t || 0) > avgIncome * 2) insights.push('Significant receivables expected - ensure collection processes are active');
        if (insights.length === 0) insights.push('Cash flow appears stable based on current trends');

        res.json({
            historical: monthlyData,
            forecast: forecasts,
            upcomingReceivables: upcomingInvoices?.t || 0,
            monthlyPayrollEstimate: Math.round(monthlyPayroll?.avg || 0),
            insights
        });
    } catch (error) { next(error); }
};

/** GET /api/v1/ai-agents/grants/eligibility */
export const checkGrantEligibility = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;

        // Get company profile
        const projectCount = (await db.get(`SELECT COUNT(*) as c FROM projects WHERE companyId = ?`, [tenantId]))?.c || 0;
        const employeeCount = (await db.get(`SELECT COUNT(DISTINCT employeeId) as c FROM timesheets WHERE companyId = ?`, [tenantId]))?.c || 0;
        const revenue = (await db.get(`SELECT COALESCE(SUM(amount),0) as t FROM transactions WHERE companyId = ? AND type='income'`, [tenantId]))?.t || 0;

        // UK Construction grants and schemes
        const grants = [
            {
                name: 'CITB Training Grant',
                provider: 'Construction Industry Training Board',
                description: 'Grants for construction training and apprenticeships. Up to £2,500 per trainee.',
                eligibility: employeeCount > 0,
                reason: employeeCount > 0 ? 'You have active employees eligible for training grants' : 'Requires registered employees',
                maxAmount: employeeCount * 2500,
                url: 'https://www.citb.co.uk/grants'
            },
            {
                name: 'Small Business Rate Relief',
                provider: 'Local Authority',
                description: 'Business rates relief for small businesses with rateable value under £15,000.',
                eligibility: revenue < 1000000,
                reason: revenue < 1000000 ? 'Revenue suggests small business eligibility' : 'May exceed small business threshold',
                maxAmount: 6000,
                url: 'https://www.gov.uk/apply-for-business-rate-relief'
            },
            {
                name: 'R&D Tax Credits',
                provider: 'HMRC',
                description: 'Tax relief for companies innovating in construction methods, materials, or processes.',
                eligibility: true,
                reason: 'All companies with qualifying R&D activities can claim',
                maxAmount: Math.round(revenue * 0.033),
                url: 'https://www.gov.uk/guidance/corporation-tax-research-and-development-rd-relief'
            },
            {
                name: 'Apprenticeship Levy',
                provider: 'Education & Skills Funding Agency',
                description: 'Funding for apprenticeship training. SMEs get 95% funding from government.',
                eligibility: employeeCount >= 1,
                reason: 'SMEs with employees can access apprenticeship funding',
                maxAmount: employeeCount * 5000,
                url: 'https://www.gov.uk/employing-an-apprentice'
            },
            {
                name: 'Green Construction Grant',
                provider: 'Various',
                description: 'Grants for sustainable construction practices, energy efficiency, and green building.',
                eligibility: projectCount >= 1,
                reason: 'Active construction projects may qualify for sustainability grants',
                maxAmount: 50000,
                url: 'https://www.gov.uk/green-deal-energy-saving-measures'
            },
            {
                name: 'Innovate UK Smart Grants',
                provider: 'Innovate UK',
                description: 'Funding for innovative construction technology and processes. Up to £500K.',
                eligibility: revenue > 50000,
                reason: 'For companies developing innovative construction solutions',
                maxAmount: 500000,
                url: 'https://www.ukri.org/councils/innovate-uk'
            }
        ];

        const eligible = grants.filter(g => g.eligibility);
        const totalPotential = eligible.reduce((s, g) => s + g.maxAmount, 0);

        res.json({
            companyProfile: { projectCount, employeeCount, estimatedRevenue: revenue },
            eligibleGrants: eligible.length,
            totalPotentialFunding: totalPotential,
            grants
        });
    } catch (error) { next(error); }
};
