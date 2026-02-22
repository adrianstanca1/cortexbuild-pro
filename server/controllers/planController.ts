import { Request, Response } from 'express';
import { getDb } from '../database.js';
import { UserRole } from '../types.js';

// Mock plans data for now if no DB table exists, or we'll create a simple one via query if needed.
// Ideally, we should check if a 'plans' table exists. 
// For this iteration, I'll assume we might need to store it in a JSON column or new table.
// Given the lack of migration tools visible, I'll store it in a 'system_settings' or similar if available, 
// or I will implement a file-based store/mock if DB schema changes are risky.
// precise check: `platformController` uses `global.db` or imported `db`.

// Let's rely on what we see in platformController for DB access pattern.

export const getPlans = async (req: Request, res: Response) => {
    try {
        // Placeholder: Replace with actual DB call
        // const [plans] = await db.query('SELECT * FROM subscription_plans');

        // Mock response for initial implementation to get UI working
        const plans = [
            { id: '1', name: 'Starter', price: 0, interval: 'month', features: ['1 User', '1 Project'], active: true },
            { id: '2', name: 'Pro', price: 29, interval: 'month', features: ['5 Users', '5 Projects', 'Email Support'], active: true },
            { id: '3', name: 'Business', price: 99, interval: 'month', features: ['Unlimited Users', 'Unlimited Projects', 'Priority Support'], active: true }
        ];
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const plan = req.body;
        // Insert into DB
        res.status(201).json({ message: 'Plan created', plan });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Update DB
        res.json({ message: 'Plan updated', id, updates });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Delete from DB
        res.json({ message: 'Plan deleted', id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete plan' });
    }
};
