import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToCompany } from '../socket.js';

// ═══════════════════════════════════════════════════════════════════════════════
//  GENERAL LEDGER
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/gl-accounts */
export const getGLAccounts = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const accounts = await db.all(
            `SELECT * FROM gl_accounts WHERE companyId = ? AND isActive = 1 ORDER BY code ASC`,
            [tenantId]
        );
        res.json(accounts);
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/gl-accounts */
export const createGLAccount = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { code, name, type, category, parentId, description, currency } = req.body;

        if (!code || !name || !type) {
            res.status(400).json({ error: 'code, name, and type are required' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO gl_accounts (id, companyId, code, name, type, category, parentId, description, currency, isActive, isSystem, balance, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?)`,
            [id, tenantId, code, name, type, category || null, parentId || null, description || null, currency || 'GBP', now, now]
        );

        res.status(201).json({ id, code, name, type, category, currency: currency || 'GBP', balance: 0, createdAt: now });
    } catch (error) { next(error); }
};

/** PUT /api/v1/accounting/gl-accounts/:id */
export const updateGLAccount = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;
        const updates = req.body;
        const allowedFields = ['code', 'name', 'type', 'category', 'parentId', 'description', 'currency', 'isActive'];
        const sets: string[] = [];
        const params: any[] = [];

        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                sets.push(`${key} = ?`);
                params.push(updates[key]);
            }
        }
        if (sets.length === 0) { res.status(400).json({ error: 'No valid fields to update' }); return; }

        sets.push('updatedAt = ?');
        params.push(new Date().toISOString());
        params.push(id, tenantId);

        const result = await db.run(`UPDATE gl_accounts SET ${sets.join(', ')} WHERE id = ? AND companyId = ?`, params);
        if (result.changes === 0) { res.status(404).json({ error: 'Account not found' }); return; }
        res.json({ success: true, id });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  JOURNAL ENTRIES (Double-Entry Bookkeeping)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/journal-entries */
export const getJournalEntries = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { projectId, startDate, endDate } = req.query;

        let sql = `SELECT * FROM journal_entries WHERE companyId = ?`;
        const params: any[] = [tenantId];

        if (projectId) { sql += ` AND projectId = ?`; params.push(projectId); }
        if (startDate) { sql += ` AND date >= ?`; params.push(startDate); }
        if (endDate) { sql += ` AND date <= ?`; params.push(endDate); }
        sql += ` ORDER BY date DESC, createdAt DESC LIMIT 500`;

        const entries = await db.all(sql, params);
        res.json(entries);
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/journal-entries */
export const createJournalEntry = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { date, description, reference, sourceType, sourceId, projectId, costCodeId, lines } = req.body;

        if (!date || !lines || !Array.isArray(lines) || lines.length < 2) {
            res.status(400).json({ error: 'date and at least 2 lines are required' });
            return;
        }

        // Validate debits = credits
        const totalDebit = lines.reduce((sum: number, l: any) => sum + (l.debit || 0), 0);
        const totalCredit = lines.reduce((sum: number, l: any) => sum + (l.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            res.status(400).json({ error: `Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)})` });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();
        const entryNumber = `JE-${Date.now().toString(36).toUpperCase()}`;

        await db.run(
            `INSERT INTO journal_entries (id, companyId, entryNumber, date, description, reference, sourceType, sourceId, projectId, costCodeId, status, totalDebit, totalCredit, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?, ?)`,
            [id, tenantId, entryNumber, date, description || null, reference || null, sourceType || null, sourceId || null, projectId || null, costCodeId || null, totalDebit, totalCredit, userId, now, now]
        );

        // Insert lines and update account balances
        for (const line of lines) {
            const lineId = uuidv4();
            await db.run(
                `INSERT INTO journal_entry_lines (id, journalEntryId, companyId, accountId, description, debit, credit, projectId, costCodeId)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [lineId, id, tenantId, line.accountId, line.description || null, line.debit || 0, line.credit || 0, line.projectId || projectId || null, line.costCodeId || costCodeId || null]
            );

            // Update GL account balance
            const balanceChange = (line.debit || 0) - (line.credit || 0);
            await db.run(`UPDATE gl_accounts SET balance = balance + ?, updatedAt = ? WHERE id = ? AND companyId = ?`,
                [balanceChange, now, line.accountId, tenantId]);
        }

        res.status(201).json({ id, entryNumber, date, totalDebit, totalCredit, linesCount: lines.length });
    } catch (error) { next(error); }
};

/** GET /api/v1/accounting/journal-entries/:id/lines */
export const getJournalEntryLines = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;

        const lines = await db.all(
            `SELECT jel.*, ga.code as accountCode, ga.name as accountName
             FROM journal_entry_lines jel
             LEFT JOIN gl_accounts ga ON ga.id = jel.accountId
             WHERE jel.journalEntryId = ? AND jel.companyId = ?`,
            [id, tenantId]
        );
        res.json(lines);
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  BANK ACCOUNTS & OPEN BANKING
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/bank-accounts */
export const getBankAccounts = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const accounts = await db.all(`SELECT * FROM bank_accounts WHERE companyId = ? ORDER BY isDefault DESC, bankName ASC`, [tenantId]);
        res.json(accounts);
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/bank-accounts */
export const createBankAccount = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { bankName, accountName, accountNumber, sortCode, iban, currency, glAccountId } = req.body;

        if (!bankName) { res.status(400).json({ error: 'bankName is required' }); return; }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO bank_accounts (id, companyId, bankName, accountName, accountNumber, sortCode, iban, currency, currentBalance, availableBalance, connectionStatus, glAccountId, isDefault, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'disconnected', ?, 0, ?, ?)`,
            [id, tenantId, bankName, accountName || null, accountNumber || null, sortCode || null, iban || null, currency || 'GBP', glAccountId || null, now, now]
        );

        res.status(201).json({ id, bankName, accountName, connectionStatus: 'disconnected', createdAt: now });
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/bank-accounts/:id/import */
export const importBankTransactions = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id: bankAccountId } = req.params;
        const { transactions } = req.body;

        if (!transactions || !Array.isArray(transactions)) {
            res.status(400).json({ error: 'transactions array is required' });
            return;
        }

        const now = new Date().toISOString();
        let imported = 0;

        for (const txn of transactions) {
            // Skip duplicates by external ID
            if (txn.externalId) {
                const existing = await db.get(
                    `SELECT id FROM bank_transactions WHERE externalId = ? AND bankAccountId = ? AND companyId = ?`,
                    [txn.externalId, bankAccountId, tenantId]
                );
                if (existing) continue;
            }

            const txnId = uuidv4();
            await db.run(
                `INSERT INTO bank_transactions (id, companyId, bankAccountId, externalId, date, description, amount, type, runningBalance, category, counterparty, reference, reconciliationStatus, aiSuggestedCategory, aiSuggestedProject, aiConfidence, importedAt, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unmatched', ?, ?, ?, ?, ?)`,
                [txnId, tenantId, bankAccountId, txn.externalId || null, txn.date, txn.description || null, txn.amount, txn.type || (txn.amount >= 0 ? 'credit' : 'debit'), txn.runningBalance || null, txn.category || null, txn.counterparty || null, txn.reference || null, txn.aiSuggestedCategory || null, txn.aiSuggestedProject || null, txn.aiConfidence || null, now, now]
            );
            imported++;
        }

        // Update last synced
        await db.run(`UPDATE bank_accounts SET lastSyncedAt = ?, updatedAt = ? WHERE id = ? AND companyId = ?`,
            [now, now, bankAccountId, tenantId]);

        res.json({ success: true, imported, total: transactions.length });
    } catch (error) { next(error); }
};

/** GET /api/v1/accounting/bank-transactions */
export const getBankTransactions = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { bankAccountId, reconciliationStatus, startDate, endDate } = req.query;

        let sql = `SELECT bt.*, ba.bankName, ba.accountName FROM bank_transactions bt LEFT JOIN bank_accounts ba ON ba.id = bt.bankAccountId WHERE bt.companyId = ?`;
        const params: any[] = [tenantId];

        if (bankAccountId) { sql += ` AND bt.bankAccountId = ?`; params.push(bankAccountId); }
        if (reconciliationStatus) { sql += ` AND bt.reconciliationStatus = ?`; params.push(reconciliationStatus); }
        if (startDate) { sql += ` AND bt.date >= ?`; params.push(startDate); }
        if (endDate) { sql += ` AND bt.date <= ?`; params.push(endDate); }
        sql += ` ORDER BY bt.date DESC LIMIT 500`;

        const txns = await db.all(sql, params);
        res.json(txns);
    } catch (error) { next(error); }
};

/** PUT /api/v1/accounting/bank-transactions/:id/reconcile */
export const reconcileBankTransaction = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;
        const { matchedTransactionId, matchedInvoiceId, projectId, costCodeId, category } = req.body;

        await db.run(
            `UPDATE bank_transactions SET reconciliationStatus = 'matched', matchedTransactionId = ?, matchedInvoiceId = ?, projectId = ?, costCodeId = ?, category = ? WHERE id = ? AND companyId = ?`,
            [matchedTransactionId || null, matchedInvoiceId || null, projectId || null, costCodeId || null, category || null, id, tenantId]
        );

        res.json({ success: true });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PAYROLL
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/payroll-runs */
export const getPayrollRuns = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const runs = await db.all(`SELECT * FROM payroll_runs WHERE companyId = ? ORDER BY payDate DESC LIMIT 50`, [tenantId]);
        res.json(runs);
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/payroll-runs */
export const createPayrollRun = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { periodStart, periodEnd, payDate, notes } = req.body;

        if (!periodStart || !periodEnd || !payDate) {
            res.status(400).json({ error: 'periodStart, periodEnd, and payDate are required' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO payroll_runs (id, companyId, periodStart, periodEnd, payDate, status, totalGross, totalDeductions, totalNet, totalEmployerNI, totalEmployeeNI, totalPAYE, totalCIS, totalPension, employeeCount, notes, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 'draft', 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?)`,
            [id, tenantId, periodStart, periodEnd, payDate, notes || null, userId, now, now]
        );

        res.status(201).json({ id, status: 'draft', periodStart, periodEnd, payDate });
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/payroll-runs/:id/items */
export const addPayrollItem = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id: payrollRunId } = req.params;
        const item = req.body;

        if (!item.employeeId || !item.employeeName) {
            res.status(400).json({ error: 'employeeId and employeeName are required' });
            return;
        }

        // Calculate UK tax deductions
        const grossPay = (item.hoursWorked || 0) * (item.hourlyRate || 0) + (item.overtimeHours || 0) * (item.overtimeRate || 0) + (item.allowances || 0);
        const basicPay = (item.hoursWorked || 0) * (item.hourlyRate || 0);
        const overtimePay = (item.overtimeHours || 0) * (item.overtimeRate || 0);

        // UK PAYE calculation (simplified 2024/25 rates)
        const annualPay = grossPay * 12;
        let paye = 0;
        const personalAllowance = 12570;
        const taxablePay = Math.max(0, annualPay - personalAllowance);
        if (taxablePay <= 37700) paye = taxablePay * 0.20;
        else if (taxablePay <= 125140) paye = 37700 * 0.20 + (taxablePay - 37700) * 0.40;
        else paye = 37700 * 0.20 + 87440 * 0.40 + (taxablePay - 125140) * 0.45;
        paye = Math.round((paye / 12) * 100) / 100;

        // UK NI calculation (simplified)
        const weeklyPay = grossPay / 4.33;
        let employeeNI = 0;
        if (weeklyPay > 242) employeeNI = Math.max(0, (Math.min(weeklyPay, 967) - 242) * 0.08 + Math.max(0, weeklyPay - 967) * 0.02);
        employeeNI = Math.round(employeeNI * 4.33 * 100) / 100;

        let employerNI = 0;
        if (weeklyPay > 175) employerNI = (weeklyPay - 175) * 0.138;
        employerNI = Math.round(employerNI * 4.33 * 100) / 100;

        // CIS deduction (20% standard rate for subcontractors)
        const cisDeduction = item.isCIS ? Math.round(grossPay * 0.20 * 100) / 100 : 0;

        // Pension (auto-enrollment 5% employee + 3% employer on qualifying earnings)
        const pensionEmployee = Math.round(Math.max(0, grossPay - 520) * 0.05 * 100) / 100;
        const pensionEmployer = Math.round(Math.max(0, grossPay - 520) * 0.03 * 100) / 100;

        const totalDeductions = paye + employeeNI + cisDeduction + pensionEmployee + (item.studentLoan || 0);
        const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

        const lineId = uuidv4();
        await db.run(
            `INSERT INTO payroll_items (id, payrollRunId, companyId, employeeId, employeeName, projectId, hoursWorked, overtimeHours, hourlyRate, overtimeRate, grossPay, basicPay, overtimePay, allowances, deductions, employeeNI, employerNI, paye, cisDeduction, pensionEmployee, pensionEmployer, studentLoan, netPay, taxCode, niCategory, isCIS, costCodeId, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [lineId, payrollRunId, tenantId, item.employeeId, item.employeeName, item.projectId || null, item.hoursWorked || 0, item.overtimeHours || 0, item.hourlyRate || 0, item.overtimeRate || 0, grossPay, basicPay, overtimePay, item.allowances || 0, totalDeductions, employeeNI, employerNI, paye, cisDeduction, pensionEmployee, pensionEmployer, item.studentLoan || 0, netPay, item.taxCode || '1257L', item.niCategory || 'A', item.isCIS ? 1 : 0, item.costCodeId || null, item.notes || null]
        );

        // Update run totals
        await db.run(
            `UPDATE payroll_runs SET
                totalGross = totalGross + ?, totalDeductions = totalDeductions + ?, totalNet = totalNet + ?,
                totalEmployerNI = totalEmployerNI + ?, totalEmployeeNI = totalEmployeeNI + ?,
                totalPAYE = totalPAYE + ?, totalCIS = totalCIS + ?, totalPension = totalPension + ?,
                employeeCount = employeeCount + 1, updatedAt = ?
             WHERE id = ? AND companyId = ?`,
            [grossPay, totalDeductions, netPay, employerNI, employeeNI, paye, cisDeduction, pensionEmployee + pensionEmployer, new Date().toISOString(), payrollRunId, tenantId]
        );

        res.status(201).json({ id: lineId, employeeName: item.employeeName, grossPay, paye, employeeNI, employerNI, cisDeduction, pensionEmployee, pensionEmployer, netPay });
    } catch (error) { next(error); }
};

/** GET /api/v1/accounting/payroll-runs/:id/items */
export const getPayrollItems = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;
        const items = await db.all(`SELECT * FROM payroll_items WHERE payrollRunId = ? AND companyId = ? ORDER BY employeeName ASC`, [id, tenantId]);
        res.json(items);
    } catch (error) { next(error); }
};

/** PUT /api/v1/accounting/payroll-runs/:id/approve */
export const approvePayrollRun = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { id } = req.params;
        const now = new Date().toISOString();

        await db.run(
            `UPDATE payroll_runs SET status = 'approved', approvedBy = ?, approvedAt = ?, updatedAt = ? WHERE id = ? AND companyId = ?`,
            [userId, now, now, id, tenantId]
        );

        res.json({ success: true, status: 'approved' });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAX COMPLIANCE & HMRC
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/tax-returns */
export const getTaxReturns = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { type } = req.query;
        let sql = `SELECT * FROM tax_returns WHERE companyId = ?`;
        const params: any[] = [tenantId];
        if (type) { sql += ` AND type = ?`; params.push(type); }
        sql += ` ORDER BY periodEnd DESC LIMIT 50`;
        const returns = await db.all(sql, params);
        const parsed = returns.map((r: any) => ({ ...r, boxes: r.boxes ? JSON.parse(r.boxes) : null }));
        res.json(parsed);
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/tax-returns/vat/calculate */
export const calculateVATReturn = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { periodStart, periodEnd } = req.body;

        if (!periodStart || !periodEnd) {
            res.status(400).json({ error: 'periodStart and periodEnd are required' });
            return;
        }

        // Calculate VAT boxes from invoices and expenses
        const salesInvoices = await db.all(
            `SELECT COALESCE(SUM(total), 0) as totalSales, COALESCE(SUM(tax), 0) as totalOutputVAT
             FROM invoices WHERE companyId = ? AND date >= ? AND date <= ? AND status IN ('Approved', 'Paid')`,
            [tenantId, periodStart, periodEnd]
        );

        const purchaseInvoices = await db.all(
            `SELECT COALESCE(SUM(amount), 0) as totalPurchases
             FROM expense_claims WHERE companyId = ? AND date >= ? AND date <= ? AND status IN ('Approved', 'Paid')`,
            [tenantId, periodStart, periodEnd]
        );

        const totalOutputVAT = salesInvoices[0]?.totalOutputVAT || 0;
        const totalSales = salesInvoices[0]?.totalSales || 0;
        const totalPurchases = purchaseInvoices[0]?.totalPurchases || 0;
        const totalInputVAT = Math.round(totalPurchases * 0.20 * 100) / 100; // Standard rate assumption
        const netVAT = Math.round((totalOutputVAT - totalInputVAT) * 100) / 100;

        // HMRC VAT Return boxes
        const boxes = {
            box1: totalOutputVAT,                                   // VAT due on sales
            box2: 0,                                                 // VAT due on acquisitions from EU
            box3: totalOutputVAT,                                   // Total VAT due (1+2)
            box4: totalInputVAT,                                    // VAT reclaimed on purchases
            box5: Math.abs(netVAT),                                 // Net VAT to pay/reclaim
            box6: Math.round(totalSales * 100) / 100,               // Total sales ex VAT
            box7: Math.round(totalPurchases * 100) / 100,           // Total purchases ex VAT
            box8: 0,                                                 // Total supplies to EU
            box9: 0,                                                 // Total acquisitions from EU
        };

        const id = uuidv4();
        const now = new Date().toISOString();
        const dueDate = new Date(new Date(periodEnd).getTime() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await db.run(
            `INSERT INTO tax_returns (id, companyId, type, periodStart, periodEnd, status, totalOutput, totalInput, netAmount, amountDue, boxes, dueDate, createdAt, updatedAt)
             VALUES (?, ?, 'VAT', ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, tenantId, periodStart, periodEnd, totalOutputVAT, totalInputVAT, netVAT, netVAT > 0 ? netVAT : 0, JSON.stringify(boxes), dueDate, now, now]
        );

        res.status(201).json({ id, type: 'VAT', periodStart, periodEnd, boxes, netVAT, amountDue: netVAT > 0 ? netVAT : 0, dueDate, status: 'draft' });
    } catch (error) { next(error); }
};

/** PUT /api/v1/accounting/tax-returns/:id/submit */
export const submitTaxReturn = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { id } = req.params;
        const now = new Date().toISOString();

        // In production, this would call HMRC MTD API
        const hmrcCorrelationId = `HMRC-${uuidv4().slice(0, 8).toUpperCase()}`;
        const hmrcReceiptId = `RCPT-${Date.now().toString(36).toUpperCase()}`;

        await db.run(
            `UPDATE tax_returns SET status = 'submitted', submittedAt = ?, submittedBy = ?, hmrcCorrelationId = ?, hmrcReceiptId = ?, updatedAt = ? WHERE id = ? AND companyId = ?`,
            [now, userId, hmrcCorrelationId, hmrcReceiptId, now, id, tenantId]
        );

        broadcastToCompany(tenantId, { type: 'tax_return_submitted', data: { id, hmrcCorrelationId, hmrcReceiptId } });

        res.json({ success: true, hmrcCorrelationId, hmrcReceiptId, submittedAt: now });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  INTEGRATION CREDENTIALS (Xero, QuickBooks)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/integrations */
export const getIntegrations = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const integrations = await db.all(
            `SELECT id, provider, organisationName, status, lastSyncAt, scopes, createdAt FROM integration_credentials WHERE companyId = ?`,
            [tenantId]
        );
        res.json(integrations);
    } catch (error) { next(error); }
};

/** POST /api/v1/accounting/integrations */
export const createIntegration = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { provider, accessToken, refreshToken, tokenExpiry, tenantId: extTenantId, organisationName, scopes } = req.body;

        if (!provider) { res.status(400).json({ error: 'provider is required' }); return; }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO integration_credentials (id, companyId, provider, accessToken, refreshToken, tokenExpiry, tenantId, organisationName, scopes, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'connected', ?, ?)`,
            [id, tenantId, provider, accessToken || null, refreshToken || null, tokenExpiry || null, extTenantId || null, organisationName || null, scopes || null, now, now]
        );

        res.status(201).json({ id, provider, organisationName, status: 'connected' });
    } catch (error) { next(error); }
};

/** DELETE /api/v1/accounting/integrations/:id */
export const deleteIntegration = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;
        await db.run(`DELETE FROM integration_credentials WHERE id = ? AND companyId = ?`, [id, tenantId]);
        res.json({ success: true });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  INVOICE CHASERS / AUTOMATED REMINDERS
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/accounting/invoice-chasers/generate */
export const generateInvoiceChasers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        // Find overdue invoices
        const overdueInvoices = await db.all(
            `SELECT * FROM invoices WHERE companyId = ? AND status IN ('Pending', 'Approved') AND dueDate < ?`,
            [tenantId, today]
        );

        const reminders: any[] = [];
        for (const inv of overdueInvoices) {
            const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));

            // Determine reminder type based on days overdue
            let reminderType = 'friendly';
            if (daysOverdue > 30) reminderType = 'firm';
            if (daysOverdue > 60) reminderType = 'final';

            // Check if reminder already sent recently
            const recentReminder = await db.get(
                `SELECT id FROM invoice_reminders WHERE invoiceId = ? AND companyId = ? AND sentAt > ? AND reminderType = ?`,
                [inv.id, tenantId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), reminderType]
            );
            if (recentReminder) continue;

            const reminderId = uuidv4();
            const subject = reminderType === 'friendly'
                ? `Payment Reminder: Invoice ${inv.number}`
                : reminderType === 'firm'
                    ? `Overdue Payment: Invoice ${inv.number} - ${daysOverdue} days overdue`
                    : `Final Notice: Invoice ${inv.number} - Immediate payment required`;

            await db.run(
                `INSERT INTO invoice_reminders (id, companyId, invoiceId, reminderType, scheduledDate, recipientName, subject, status, daysOverdue, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
                [reminderId, tenantId, inv.id, reminderType, today, inv.vendor, subject, daysOverdue, now]
            );

            reminders.push({ id: reminderId, invoiceId: inv.id, invoiceNumber: inv.number, vendor: inv.vendor, daysOverdue, reminderType, subject });
        }

        res.json({ generated: reminders.length, reminders });
    } catch (error) { next(error); }
};

/** GET /api/v1/accounting/invoice-chasers */
export const getInvoiceChasers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const chasers = await db.all(
            `SELECT ir.*, i.number as invoiceNumber, i.amount as invoiceAmount, i.vendor as invoiceVendor
             FROM invoice_reminders ir
             LEFT JOIN invoices i ON i.id = ir.invoiceId
             WHERE ir.companyId = ? ORDER BY ir.createdAt DESC LIMIT 100`,
            [tenantId]
        );
        res.json(chasers);
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  JOB COSTING & PROFITABILITY
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/job-costing */
export const getJobCosting = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { projectId } = req.query;

        let projectFilter = '';
        const params: any[] = [tenantId];
        if (projectId) { projectFilter = ` AND p.id = ?`; params.push(projectId); }

        // Get projects with financial summary
        const projects = await db.all(
            `SELECT p.id, p.name, p.status, p.budget,
                    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.projectId = p.id AND t.companyId = ? AND t.type = 'income' AND t.status = 'completed'), 0) as totalRevenue,
                    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.projectId = p.id AND t.companyId = ? AND t.type = 'expense' AND t.status = 'completed'), 0) as totalExpenses,
                    COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.projectId = p.id AND i.companyId = ? AND i.status = 'Paid'), 0) as paidInvoices,
                    COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.projectId = p.id AND i.companyId = ? AND i.status IN ('Pending', 'Approved')), 0) as outstandingInvoices,
                    COALESCE((SELECT SUM(ec.amount) FROM expense_claims ec WHERE ec.projectId = p.id AND ec.companyId = ? AND ec.status IN ('Approved', 'Paid')), 0) as approvedExpenses
             FROM projects p
             WHERE p.companyId = ?${projectFilter}
             ORDER BY p.name ASC`,
            [tenantId, tenantId, tenantId, tenantId, tenantId, ...params]
        );

        const result = projects.map((p: any) => {
            const totalCosts = p.totalExpenses + p.approvedExpenses;
            const profit = p.totalRevenue - totalCosts;
            const profitMargin = p.totalRevenue > 0 ? (profit / p.totalRevenue) * 100 : 0;
            const budgetUtilization = p.budget > 0 ? (totalCosts / p.budget) * 100 : 0;
            const budgetRemaining = (p.budget || 0) - totalCosts;

            return {
                projectId: p.id,
                projectName: p.name,
                status: p.status,
                budget: p.budget || 0,
                totalRevenue: p.totalRevenue,
                totalCosts,
                paidInvoices: p.paidInvoices,
                outstandingInvoices: p.outstandingInvoices,
                profit: Math.round(profit * 100) / 100,
                profitMargin: Math.round(profitMargin * 100) / 100,
                budgetUtilization: Math.round(budgetUtilization * 100) / 100,
                budgetRemaining: Math.round(budgetRemaining * 100) / 100,
                isOverBudget: budgetUtilization > 100,
                isLosingMoney: profit < 0
            };
        });

        // Company-wide summary
        const summary = {
            totalProjects: result.length,
            totalRevenue: result.reduce((s: number, p: any) => s + p.totalRevenue, 0),
            totalCosts: result.reduce((s: number, p: any) => s + p.totalCosts, 0),
            totalProfit: result.reduce((s: number, p: any) => s + p.profit, 0),
            overBudgetProjects: result.filter((p: any) => p.isOverBudget).length,
            losingMoneyProjects: result.filter((p: any) => p.isLosingMoney).length,
            avgProfitMargin: result.length > 0 ? result.reduce((s: number, p: any) => s + p.profitMargin, 0) / result.length : 0
        };

        res.json({ summary, projects: result });
    } catch (error) { next(error); }
};

/** GET /api/v1/accounting/job-costing/:projectId/breakdown */
export const getJobCostingBreakdown = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { projectId } = req.params;

        // Cost codes with actual vs budget
        const costCodes = await db.all(
            `SELECT cc.*,
                    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.costCodeId = cc.id AND t.companyId = ? AND t.type = 'expense'), 0) as actualFromTransactions,
                    COALESCE((SELECT SUM(ec.amount) FROM expense_claims ec WHERE ec.costCodeId = cc.id AND ec.companyId = ? AND ec.status IN ('Approved', 'Paid')), 0) as actualFromExpenses
             FROM cost_codes cc
             WHERE cc.projectId = ? AND cc.companyId = ?
             ORDER BY cc.code ASC`,
            [tenantId, tenantId, projectId, tenantId]
        );

        const breakdown = costCodes.map((cc: any) => {
            const actualSpend = cc.actualFromTransactions + cc.actualFromExpenses;
            const variance = cc.budget > 0 ? ((actualSpend - cc.budget) / cc.budget) * 100 : 0;
            return {
                id: cc.id,
                code: cc.code,
                description: cc.description,
                budget: cc.budget,
                actualSpend: Math.round(actualSpend * 100) / 100,
                remaining: Math.round((cc.budget - actualSpend) * 100) / 100,
                variance: Math.round(variance * 100) / 100,
                isOverBudget: actualSpend > cc.budget
            };
        });

        // Recent transactions for this project
        const recentTransactions = await db.all(
            `SELECT * FROM transactions WHERE projectId = ? AND companyId = ? ORDER BY date DESC LIMIT 20`,
            [projectId, tenantId]
        );

        res.json({ costCodes: breakdown, recentTransactions });
    } catch (error) { next(error); }
};
