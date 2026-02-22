import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

/**
 * Get financial overview/dashboard data
 * Aggregates invoices, expenses, revenue, and costs
 */
export async function getFinancialOverview(req: any, res: Response, next: NextFunction) {
    try {
        const db = getDb();
        const companyId = req.context?.companyId || req.companyId;

        // Get invoices summary (invoices table exists)
        const invoiceStats = await db.get(
            `SELECT 
                COUNT(*) as totalInvoices,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as totalRevenue,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingRevenue,
                SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdueAmount
            FROM invoices 
            WHERE companyId = ?`,
            [companyId]
        );

        // Get expenses from expense_claims table
        let totalExpenses = 0;
        let expenseCount = 0;

        try {
            const expenseStats = await db.get(
                `SELECT 
                    COUNT(*) as totalExpenses,
                    SUM(amount) as totalExpenseAmount
                FROM expense_claims 
                WHERE companyId = ? AND status != 'REJECTED'`,
                [companyId]
            );
            totalExpenses = Number(expenseStats?.totalExpenseAmount || 0);
            expenseCount = Number(expenseStats?.totalExpenses || 0);
        } catch (err) {
            // Table might not exist, use default values
            logger.warn('Expense_claims table not found, using default expense values', err);
        }

        // Get monthly revenue trend (last 6 months)
        const monthlyRevenue = await db.all(
            `SELECT 
                strftime('%Y-%m', createdAt) as month,
                SUM(amount) as revenue,
                COUNT(*) as invoiceCount
            FROM invoices
            WHERE companyId = ? 
            AND status = 'paid'
            AND createdAt >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', createdAt)
            ORDER BY month DESC
            LIMIT 6`,
            [companyId]
        );

        // Calculate profit
        const totalRevenue = Number(invoiceStats?.totalRevenue || 0);
        const profit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        res.json({
            totalRevenue,
            pendingRevenue: Number(invoiceStats?.pendingRevenue || 0),
            overdueAmount: Number(invoiceStats?.overdueAmount || 0),
            totalExpenses,
            profit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            invoiceCount: Number(invoiceStats?.totalInvoices || 0),
            expenseCount,
            monthlyTrend: monthlyRevenue || []
        });
    } catch (error) {
        logger.error('Error fetching financial overview:', error);
        next(error);
    }
}
