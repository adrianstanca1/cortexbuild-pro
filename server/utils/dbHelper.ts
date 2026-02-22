import { getDb } from '../database.js';

export const dbHelper = {
    now: () => {
        return getDb().getType() === 'mysql' ? 'NOW()' : "datetime('now')";
    },

    // Returns SQL for "timestamp > now - interval"
    // e.g. timeAgo(24, 'hour') -> 
    // MySQL: "DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    // SQLite: "datetime('now', '-24 hours')"
    timeAgo: (amount: number, unit: 'hour' | 'day' | 'month' | 'minute') => {
        const type = getDb().getType();
        if (type === 'mysql') {
            return `DATE_SUB(NOW(), INTERVAL ${amount} ${unit.toUpperCase()})`;
        } else {
            // SQLite expects plural for some, but 'hour', 'day', 'month' usually work with 's' suffix or logic
            // standard sqlite modifiers: 'N days', 'N hours', 'N months'
            return `datetime('now', '-${amount} ${unit}s')`;
        }
    },

    // Returns SQL for extracting YYYY-MM
    groupByMonth: (column: string) => {
        const type = getDb().getType();
        if (type === 'mysql') {
            return `DATE_FORMAT(${column}, '%Y-%m')`;
        } else {
            return `strftime('%Y-%m', ${column})`;
        }
    },

    // Cast to Number
    castInt: (column: string) => {
        const type = getDb().getType();
        if (type === 'mysql') {
            return `CAST(${column} AS UNSIGNED)`;
        } else {
            return `CAST(${column} AS INTEGER)`;
        }
    },

    // JSON Extract (Not fully standardized here but placeholder)
    // MySQL: column->>'$.field'
    // SQLite: json_extract(column, '$.field')
};
