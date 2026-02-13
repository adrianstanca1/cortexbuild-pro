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
        const parsed = returns.map((r: any) => {
            let boxes = null;
            if (r.boxes) { try { boxes = JSON.parse(r.boxes); } catch { /* malformed JSON */ } }
            return { ...r, boxes };
        });
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

// ═══════════════════════════════════════════════════════════════════════════════
//  BILL-TO-PO MATCHING (Payables & Procurement)
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/accounting/bill-po-match */
export const matchBillToPO = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { invoiceId, purchaseOrderId } = req.body;

        if (!invoiceId || !purchaseOrderId) {
            res.status(400).json({ error: 'invoiceId and purchaseOrderId are required' });
            return;
        }

        // Fetch the PO
        const po = await db.get(`SELECT * FROM purchase_orders WHERE id = ? AND companyId = ?`, [purchaseOrderId, tenantId]);
        if (!po) { res.status(404).json({ error: 'Purchase order not found' }); return; }

        // Fetch the invoice/bill
        const invoice = await db.get(`SELECT * FROM invoices WHERE id = ? AND companyId = ?`, [invoiceId, tenantId]);
        if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }

        // Sum all invoices already matched to this PO
        const existingMatched = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as totalBilled FROM invoices WHERE companyId = ? AND id != ? AND id IN (
                SELECT id FROM invoices WHERE companyId = ? AND vendorId = ? AND status IN ('Pending', 'Approved', 'Paid')
            )`,
            [tenantId, invoiceId, tenantId, po.vendor]
        );

        // Also check transactions linked to this PO
        const linkedTransactions = await db.get(
            `SELECT COALESCE(SUM(amount), 0) as totalLinked FROM transactions WHERE linkedPurchaseOrderId = ? AND companyId = ? AND type = 'expense'`,
            [purchaseOrderId, tenantId]
        );

        const totalAlreadyBilled = (existingMatched?.totalBilled || 0) + (linkedTransactions?.totalLinked || 0);
        const invoiceAmount = invoice.total || invoice.amount;
        const poAmount = po.amount;
        const newTotal = totalAlreadyBilled + invoiceAmount;

        // Overbilling protection
        const overbillThreshold = poAmount * 1.10; // Allow 10% tolerance
        if (newTotal > overbillThreshold) {
            res.status(400).json({
                error: 'Overbilling detected',
                details: {
                    poAmount,
                    totalAlreadyBilled: Math.round(totalAlreadyBilled * 100) / 100,
                    thisInvoice: invoiceAmount,
                    projectedTotal: Math.round(newTotal * 100) / 100,
                    overageAmount: Math.round((newTotal - poAmount) * 100) / 100,
                    overagePercent: Math.round(((newTotal - poAmount) / poAmount) * 10000) / 100
                }
            });
            return;
        }

        // Link the invoice to the PO via a transaction record
        const txnId = uuidv4();
        const now = new Date().toISOString();
        await db.run(
            `INSERT INTO transactions (id, companyId, projectId, date, description, amount, type, category, status, costCodeId, linkedPurchaseOrderId, isExported)
             VALUES (?, ?, ?, ?, ?, ?, 'expense', 'Vendor Bill', 'completed', ?, ?, 0)`,
            [txnId, tenantId, po.projectId || invoice.projectId, now.split('T')[0], `Bill ${invoice.number} matched to PO ${po.poNumber}`, invoiceAmount, invoice.costCodeId || null, purchaseOrderId]
        );

        // Update cost code spent if applicable
        if (invoice.costCodeId) {
            await db.run(`UPDATE cost_codes SET spent = spent + ?, var = CASE WHEN budget > 0 THEN ((spent + ? - budget) / budget) * 100 ELSE 0 END WHERE id = ? AND companyId = ?`,
                [invoiceAmount, invoiceAmount, invoice.costCodeId, tenantId]);
        }

        broadcastToCompany(tenantId, { type: 'bill_matched_to_po', data: { invoiceId, purchaseOrderId, amount: invoiceAmount } });

        res.json({
            success: true,
            transactionId: txnId,
            poAmount,
            totalBilledAfterMatch: Math.round(newTotal * 100) / 100,
            remainingOnPO: Math.round((poAmount - newTotal) * 100) / 100,
            utilizationPercent: Math.round((newTotal / poAmount) * 10000) / 100
        });
    } catch (error) { next(error); }
};

/** GET /api/v1/accounting/po-billing-summary */
export const getPOBillingSummary = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;

        const purchaseOrders = await db.all(
            `SELECT po.*,
                COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.linkedPurchaseOrderId = po.id AND t.companyId = ? AND t.type = 'expense'), 0) as totalBilled
             FROM purchase_orders po WHERE po.companyId = ? ORDER BY po.date DESC`,
            [tenantId, tenantId]
        );

        const result = purchaseOrders.map((po: any) => ({
            id: po.id,
            poNumber: po.poNumber,
            vendor: po.vendor,
            projectId: po.projectId,
            date: po.date,
            poAmount: po.amount,
            totalBilled: Math.round(po.totalBilled * 100) / 100,
            remaining: Math.round((po.amount - po.totalBilled) * 100) / 100,
            utilizationPercent: po.amount > 0 ? Math.round((po.totalBilled / po.amount) * 10000) / 100 : 0,
            isOverbilled: po.totalBilled > po.amount,
            status: po.status
        }));

        res.json(result);
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  RECEIVABLES AGING REPORT
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/receivables-aging */
export const getReceivablesAging = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;

        const unpaidInvoices = await db.all(
            `SELECT * FROM invoices WHERE companyId = ? AND status IN ('Pending', 'Approved', 'Overdue') ORDER BY dueDate ASC`,
            [tenantId]
        );

        const today = new Date();
        const buckets = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 };
        const items: any[] = [];

        for (const inv of unpaidInvoices) {
            const dueDate = new Date(inv.dueDate);
            const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            const amount = inv.total || inv.amount;

            let bucket: string;
            if (daysOverdue <= 0) { bucket = 'current'; buckets.current += amount; }
            else if (daysOverdue <= 30) { bucket = '1-30'; buckets.days1to30 += amount; }
            else if (daysOverdue <= 60) { bucket = '31-60'; buckets.days31to60 += amount; }
            else if (daysOverdue <= 90) { bucket = '61-90'; buckets.days61to90 += amount; }
            else { bucket = '90+'; buckets.over90 += amount; }

            items.push({
                invoiceId: inv.id,
                invoiceNumber: inv.number,
                vendor: inv.vendor,
                projectId: inv.projectId,
                amount,
                dueDate: inv.dueDate,
                daysOverdue,
                bucket,
                status: inv.status
            });
        }

        const totalOutstanding = Object.values(buckets).reduce((s, v) => s + v, 0);

        res.json({
            totalOutstanding: Math.round(totalOutstanding * 100) / 100,
            buckets: {
                current: Math.round(buckets.current * 100) / 100,
                '1-30': Math.round(buckets.days1to30 * 100) / 100,
                '31-60': Math.round(buckets.days31to60 * 100) / 100,
                '61-90': Math.round(buckets.days61to90 * 100) / 100,
                '90+': Math.round(buckets.over90 * 100) / 100,
            },
            invoiceCount: items.length,
            items
        });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  FINANCIAL ALERTS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/accounting/financial-alerts */
export const getFinancialAlerts = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const alerts: any[] = [];
        const today = new Date().toISOString().split('T')[0];

        // 1. Over-budget projects
        const projects = await db.all(`SELECT id, name, budget FROM projects WHERE companyId = ? AND budget > 0`, [tenantId]);
        for (const proj of projects) {
            const spending = await db.get(
                `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE projectId = ? AND companyId = ? AND type = 'expense' AND status = 'completed'`,
                [proj.id, tenantId]
            );
            const expenses = await db.get(
                `SELECT COALESCE(SUM(amount), 0) as total FROM expense_claims WHERE projectId = ? AND companyId = ? AND status IN ('Approved', 'Paid')`,
                [proj.id, tenantId]
            );
            const totalSpent = (spending?.total || 0) + (expenses?.total || 0);
            const utilization = (totalSpent / proj.budget) * 100;

            if (utilization > 100) {
                alerts.push({ type: 'over_budget', severity: 'critical', projectId: proj.id, projectName: proj.name, message: `${proj.name} is ${(utilization - 100).toFixed(1)}% over budget`, budget: proj.budget, spent: totalSpent, utilization: Math.round(utilization * 100) / 100 });
            } else if (utilization > 85) {
                alerts.push({ type: 'budget_warning', severity: 'warning', projectId: proj.id, projectName: proj.name, message: `${proj.name} is at ${utilization.toFixed(1)}% of budget`, budget: proj.budget, spent: totalSpent, utilization: Math.round(utilization * 100) / 100 });
            }
        }

        // 2. Cost code spikes (any code > 120% of budget)
        const costCodes = await db.all(`SELECT * FROM cost_codes WHERE companyId = ? AND budget > 0`, [tenantId]);
        for (const cc of costCodes) {
            if (cc.spent > cc.budget * 1.2) {
                alerts.push({ type: 'cost_spike', severity: 'critical', costCodeId: cc.id, code: cc.code, description: cc.description, message: `Cost code ${cc.code} has spiked ${((cc.spent / cc.budget - 1) * 100).toFixed(0)}% over budget`, budget: cc.budget, spent: cc.spent });
            }
        }

        // 3. Overdue invoices older than 30 days
        const overdueInvoices = await db.all(
            `SELECT id, number, vendor, amount, total, dueDate FROM invoices WHERE companyId = ? AND status IN ('Pending', 'Approved') AND dueDate < ?`,
            [tenantId, today]
        );
        const severelyOverdue = overdueInvoices.filter((i: any) => {
            const days = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return days > 30;
        });
        if (severelyOverdue.length > 0) {
            const totalOverdue = severelyOverdue.reduce((s: number, i: any) => s + (i.total || i.amount), 0);
            alerts.push({ type: 'severe_overdue', severity: 'critical', message: `${severelyOverdue.length} invoices overdue by 30+ days totalling ${totalOverdue.toFixed(2)}`, count: severelyOverdue.length, totalAmount: totalOverdue });
        }

        // 4. Cash flow warning (more expenses than income in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const recentIncome = await db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE companyId = ? AND type = 'income' AND date >= ?`, [tenantId, thirtyDaysAgo]);
        const recentExpenses = await db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE companyId = ? AND type = 'expense' AND date >= ?`, [tenantId, thirtyDaysAgo]);
        if ((recentExpenses?.total || 0) > (recentIncome?.total || 0) * 1.5 && (recentExpenses?.total || 0) > 0) {
            alerts.push({ type: 'cash_flow_warning', severity: 'warning', message: `Expenses (${(recentExpenses?.total || 0).toFixed(0)}) are 50%+ higher than income (${(recentIncome?.total || 0).toFixed(0)}) in the last 30 days`, income: recentIncome?.total || 0, expenses: recentExpenses?.total || 0 });
        }

        // 5. Unreconciled bank transactions warning
        const unmatchedCount = await db.get(`SELECT COUNT(*) as count FROM bank_transactions WHERE companyId = ? AND reconciliationStatus = 'unmatched'`, [tenantId]);
        if ((unmatchedCount?.count || 0) > 20) {
            alerts.push({ type: 'unreconciled_transactions', severity: 'info', message: `${unmatchedCount.count} bank transactions need reconciliation`, count: unmatchedCount.count });
        }

        // Sort by severity
        const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

        res.json({ count: alerts.length, alerts });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DEFAULT CHART OF ACCOUNTS (Construction-Specific)
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/accounting/gl-accounts/seed-defaults */
export const seedDefaultGLAccounts = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;

        // Check if already seeded
        const existing = await db.get(`SELECT COUNT(*) as count FROM gl_accounts WHERE companyId = ? AND isSystem = 1`, [tenantId]);
        if (existing?.count > 0) { res.json({ message: 'Default accounts already exist', count: existing.count }); return; }

        const now = new Date().toISOString();
        const defaults = [
            // Assets
            { code: '1000', name: 'Cash at Bank', type: 'asset', category: 'Current Assets' },
            { code: '1010', name: 'Petty Cash', type: 'asset', category: 'Current Assets' },
            { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
            { code: '1110', name: 'Retentions Receivable', type: 'asset', category: 'Current Assets' },
            { code: '1200', name: 'Materials Inventory', type: 'asset', category: 'Current Assets' },
            { code: '1300', name: 'Work in Progress', type: 'asset', category: 'Current Assets' },
            { code: '1500', name: 'Plant & Equipment', type: 'asset', category: 'Fixed Assets' },
            { code: '1510', name: 'Vehicles', type: 'asset', category: 'Fixed Assets' },
            { code: '1520', name: 'Tools & Small Equipment', type: 'asset', category: 'Fixed Assets' },
            { code: '1600', name: 'Accumulated Depreciation', type: 'asset', category: 'Fixed Assets' },
            // Liabilities
            { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2010', name: 'Retentions Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2100', name: 'VAT Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2110', name: 'VAT Receivable', type: 'liability', category: 'Current Liabilities' },
            { code: '2200', name: 'PAYE & NI Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2210', name: 'CIS Tax Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2220', name: 'Pension Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2300', name: 'Corporation Tax Payable', type: 'liability', category: 'Current Liabilities' },
            { code: '2400', name: 'Accruals', type: 'liability', category: 'Current Liabilities' },
            { code: '2500', name: 'Bank Loans', type: 'liability', category: 'Long-term Liabilities' },
            // Equity
            { code: '3000', name: 'Share Capital', type: 'equity', category: 'Equity' },
            { code: '3100', name: 'Retained Earnings', type: 'equity', category: 'Equity' },
            { code: '3200', name: 'Dividends', type: 'equity', category: 'Equity' },
            // Revenue
            { code: '4000', name: 'Contract Revenue', type: 'revenue', category: 'Direct Income' },
            { code: '4010', name: 'Variation Income', type: 'revenue', category: 'Direct Income' },
            { code: '4020', name: 'Retention Releases', type: 'revenue', category: 'Direct Income' },
            { code: '4030', name: 'Daywork Income', type: 'revenue', category: 'Direct Income' },
            { code: '4100', name: 'Other Income', type: 'revenue', category: 'Other Income' },
            // Direct Costs (Construction)
            { code: '5000', name: 'Direct Labour', type: 'expense', category: 'Cost of Sales' },
            { code: '5010', name: 'Subcontractor Costs', type: 'expense', category: 'Cost of Sales' },
            { code: '5020', name: 'Materials - Concrete & Cement', type: 'expense', category: 'Cost of Sales' },
            { code: '5030', name: 'Materials - Steel & Rebar', type: 'expense', category: 'Cost of Sales' },
            { code: '5040', name: 'Materials - Timber', type: 'expense', category: 'Cost of Sales' },
            { code: '5050', name: 'Materials - Electrical', type: 'expense', category: 'Cost of Sales' },
            { code: '5060', name: 'Materials - Plumbing', type: 'expense', category: 'Cost of Sales' },
            { code: '5070', name: 'Materials - General', type: 'expense', category: 'Cost of Sales' },
            { code: '5100', name: 'Plant Hire', type: 'expense', category: 'Cost of Sales' },
            { code: '5110', name: 'Scaffolding', type: 'expense', category: 'Cost of Sales' },
            { code: '5120', name: 'Skip & Waste Disposal', type: 'expense', category: 'Cost of Sales' },
            { code: '5200', name: 'Site Prelims', type: 'expense', category: 'Cost of Sales' },
            { code: '5210', name: 'Site Security', type: 'expense', category: 'Cost of Sales' },
            { code: '5220', name: 'Temporary Works', type: 'expense', category: 'Cost of Sales' },
            // Overheads
            { code: '6000', name: 'Salaries - Office Staff', type: 'expense', category: 'Overheads' },
            { code: '6010', name: 'Employer NI Contributions', type: 'expense', category: 'Overheads' },
            { code: '6020', name: 'Pension Contributions', type: 'expense', category: 'Overheads' },
            { code: '6100', name: 'Office Rent & Rates', type: 'expense', category: 'Overheads' },
            { code: '6110', name: 'Office Utilities', type: 'expense', category: 'Overheads' },
            { code: '6200', name: 'Insurance - Employers Liability', type: 'expense', category: 'Overheads' },
            { code: '6210', name: 'Insurance - Public Liability', type: 'expense', category: 'Overheads' },
            { code: '6220', name: 'Insurance - Contractors All Risk', type: 'expense', category: 'Overheads' },
            { code: '6300', name: 'Vehicle Running Costs', type: 'expense', category: 'Overheads' },
            { code: '6400', name: 'Professional Fees', type: 'expense', category: 'Overheads' },
            { code: '6500', name: 'IT & Software', type: 'expense', category: 'Overheads' },
            { code: '6600', name: 'Marketing & Advertising', type: 'expense', category: 'Overheads' },
            { code: '6700', name: 'Training & CPD', type: 'expense', category: 'Overheads' },
            { code: '6800', name: 'Bank Charges & Interest', type: 'expense', category: 'Overheads' },
            { code: '6900', name: 'Depreciation', type: 'expense', category: 'Overheads' },
        ];

        let count = 0;
        for (const acc of defaults) {
            const id = uuidv4();
            await db.run(
                `INSERT INTO gl_accounts (id, companyId, code, name, type, category, currency, isActive, isSystem, balance, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'GBP', 1, 1, 0, ?, ?)`,
                [id, tenantId, acc.code, acc.name, acc.type, acc.category, now, now]
            );
            count++;
        }

        res.status(201).json({ success: true, accountsCreated: count });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AI BANK TRANSACTION CATEGORIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/accounting/bank-transactions/auto-categorize */
export const autoCategorizeTransactions = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;

        // Get unmatched transactions
        const unmatched = await db.all(
            `SELECT * FROM bank_transactions WHERE companyId = ? AND reconciliationStatus = 'unmatched' LIMIT 100`,
            [tenantId]
        );

        // Get known patterns from already-matched transactions
        const knownPatterns = await db.all(
            `SELECT counterparty, category, projectId, costCodeId, COUNT(*) as matchCount
             FROM bank_transactions WHERE companyId = ? AND reconciliationStatus = 'matched' AND counterparty IS NOT NULL
             GROUP BY counterparty, category, projectId, costCodeId ORDER BY matchCount DESC LIMIT 200`,
            [tenantId]
        );

        // Get vendor names from invoices for cross-referencing
        const vendors = await db.all(`SELECT DISTINCT vendor, vendorId, projectId FROM invoices WHERE companyId = ?`, [tenantId]);

        // Rule-based categorization engine
        const categoryRules: Array<{ pattern: RegExp; category: string; confidence: number }> = [
            { pattern: /payroll|salary|wages|paye/i, category: 'Payroll', confidence: 0.95 },
            { pattern: /hmrc|tax|vat|revenue.*customs/i, category: 'Tax & HMRC', confidence: 0.95 },
            { pattern: /travis perkins|jewson|wickes|screwfix|toolstation|selco/i, category: 'Materials', confidence: 0.90 },
            { pattern: /speedy|sunbelt|hewden|a-plant|coates/i, category: 'Plant Hire', confidence: 0.90 },
            { pattern: /concrete|rmc|hanson|cemex|aggregate/i, category: 'Materials - Concrete', confidence: 0.85 },
            { pattern: /scaffolding|scaffold|altrad/i, category: 'Scaffolding', confidence: 0.90 },
            { pattern: /skip|waste|biffa|veolia|viridor/i, category: 'Waste Disposal', confidence: 0.90 },
            { pattern: /insurance|zurich|aviva|hiscox|allianz/i, category: 'Insurance', confidence: 0.85 },
            { pattern: /fuel|bp|shell|esso|texaco|diesel/i, category: 'Fuel & Vehicle', confidence: 0.85 },
            { pattern: /electric|gas|water|utility|british gas|edf|eon/i, category: 'Utilities', confidence: 0.80 },
            { pattern: /rent|lease|landlord/i, category: 'Rent', confidence: 0.80 },
            { pattern: /phone|mobile|vodafone|ee|o2|bt/i, category: 'Telecoms', confidence: 0.80 },
            { pattern: /amazon|office|stationery|ink|paper/i, category: 'Office Supplies', confidence: 0.75 },
        ];

        let categorized = 0;
        const results: any[] = [];

        for (const txn of unmatched) {
            const desc = (txn.description || '') + ' ' + (txn.counterparty || '');
            let bestCategory: string | null = null;
            let bestProject: string | null = null;
            let bestCostCode: string | null = null;
            let bestConfidence = 0;

            // 1. Try known pattern matching (historical data)
            if (txn.counterparty) {
                const knownMatch = knownPatterns.find((p: any) => p.counterparty && txn.counterparty?.toLowerCase().includes(p.counterparty.toLowerCase()));
                if (knownMatch) {
                    bestCategory = knownMatch.category;
                    bestProject = knownMatch.projectId;
                    bestCostCode = knownMatch.costCodeId;
                    bestConfidence = Math.min(0.95, 0.70 + (knownMatch.matchCount * 0.05));
                }
            }

            // 2. Try rule-based matching
            if (bestConfidence < 0.80) {
                for (const rule of categoryRules) {
                    if (rule.pattern.test(desc) && rule.confidence > bestConfidence) {
                        bestCategory = rule.category;
                        bestConfidence = rule.confidence;
                    }
                }
            }

            // 3. Try vendor matching from invoices
            if (!bestProject && txn.counterparty) {
                const vendorMatch = vendors.find((v: any) => v.vendor && txn.counterparty?.toLowerCase().includes(v.vendor.toLowerCase()));
                if (vendorMatch) {
                    if (!bestCategory) bestCategory = 'Vendor Payment';
                    bestProject = vendorMatch.projectId;
                    bestConfidence = Math.max(bestConfidence, 0.75);
                }
            }

            // Update transaction with AI suggestions
            if (bestCategory && bestConfidence >= 0.60) {
                await db.run(
                    `UPDATE bank_transactions SET aiSuggestedCategory = ?, aiSuggestedProject = ?, aiConfidence = ? WHERE id = ? AND companyId = ?`,
                    [bestCategory, bestProject, bestConfidence, txn.id, tenantId]
                );
                categorized++;
                results.push({ id: txn.id, description: txn.description, suggestedCategory: bestCategory, suggestedProject: bestProject, confidence: Math.round(bestConfidence * 100) });
            }
        }

        res.json({ total: unmatched.length, categorized, results });
    } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTOMATED BUDGET UPDATES
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/accounting/sync-project-budgets */
export const syncProjectBudgets = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;

        // Recalculate all cost code spent amounts from source data
        const costCodes = await db.all(`SELECT * FROM cost_codes WHERE companyId = ?`, [tenantId]);
        let updated = 0;

        for (const cc of costCodes) {
            const txnSpent = await db.get(
                `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE costCodeId = ? AND companyId = ? AND type = 'expense' AND status = 'completed'`,
                [cc.id, tenantId]
            );
            const invSpent = await db.get(
                `SELECT COALESCE(SUM(COALESCE(total, amount)), 0) as total FROM invoices WHERE costCodeId = ? AND companyId = ? AND status IN ('Approved', 'Paid')`,
                [cc.id, tenantId]
            );
            const expSpent = await db.get(
                `SELECT COALESCE(SUM(amount), 0) as total FROM expense_claims WHERE costCodeId = ? AND companyId = ? AND status IN ('Approved', 'Paid')`,
                [cc.id, tenantId]
            );

            const totalSpent = (txnSpent?.total || 0) + (invSpent?.total || 0) + (expSpent?.total || 0);
            const variance = cc.budget > 0 ? ((totalSpent - cc.budget) / cc.budget) * 100 : 0;

            await db.run(
                `UPDATE cost_codes SET spent = ?, var = ? WHERE id = ? AND companyId = ?`,
                [Math.round(totalSpent * 100) / 100, Math.round(variance * 100) / 100, cc.id, tenantId]
            );
            updated++;
        }

        res.json({ success: true, costCodesUpdated: updated });
    } catch (error) { next(error); }
};
