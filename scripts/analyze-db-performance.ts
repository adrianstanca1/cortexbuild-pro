#!/usr/bin/env tsx

/**
 * Database Query Performance Analyzer
 * Identifies slow queries and suggests optimization opportunities
 */

import Database from 'better-sqlite3';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

interface QueryResult {
    query: string;
    duration: number;
    rows: number;
    suggestion?: string;
}

const DB_PATH = path.join(process.cwd(), 'server', 'database.sqlite');

console.log('🔍 CortexBuild Pro - Database Query Performance Analyzer');
console.log('========================================================');
console.log('');

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found at:', DB_PATH);
    console.log('💡 Make sure to run this from project root');
    process.exit(1);
}

const db = new Database(DB_PATH);

// Test queries
const testQueries = [
    {
        name: 'Get all expenses for company',
        query: 'SELECT * FROM expense_claims WHERE companyId = ? ORDER BY date DESC',
        params: ['c1']
    },
    {
        name: 'Get project tasks',
        query: 'SELECT * FROM tasks WHERE projectId = ?',
        params: ['p1']
    },
    {
        name: 'Get user projects with tasks count',
        query: `
      SELECT p.*, COUNT(t.id) as taskCount
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.projectId
      WHERE p.companyId = ?
      GROUP BY p.id
    `,
        params: ['c1']
    },
    {
        name: 'Get expense claims with cost code details',
        query: `
      SELECT e.*, c.code, c.description as costCodeDescription
      FROM expense_claims e
      LEFT JOIN cost_codes c ON e.costCodeId = c.id
      WHERE e.companyId = ?
    `,
        params: ['c1']
    },
    {
        name: 'Get all users',
        query: 'SELECT * FROM users LIMIT 100',
        params: []
    }
];

console.log('📊 Running performance tests...\n');

const results: QueryResult[] = [];

for (const test of testQueries) {
    try {
        const start = performance.now();
        const stmt = db.prepare(test.query);
        const rows = test.params.length > 0 ? stmt.all(...test.params) : stmt.all();
        const duration = performance.now() - start;

        const result: QueryResult = {
            query: test.name,
            duration: Math.round(duration * 100) / 100,
            rows: rows.length
        };

        // Add suggestions for slow queries
        if (duration > 100) {
            result.suggestion = 'Consider adding indexes or optimizing query';
        }

        results.push(result);

        console.log(`✓ ${test.name}`);
        console.log(`  Duration: ${result.duration}ms`);
        console.log(`  Rows: ${result.rows}`);
        if (result.suggestion) {
            console.log(`  💡 ${result.suggestion}`);
        }
        console.log('');
    } catch (error) {
        console.error(`❌ Error running query: ${test.name}`);
        console.error(error);
        console.log('');
    }
}

// Analyze indexes
console.log('📇 Checking indexes...\n');

const tables = ['users', 'projects', 'tasks', 'expense_claims', 'cost_codes'];

for (const table of tables) {
    try {
        const indexes = db.prepare(`PRAGMA index_list(${table})`).all();
        console.log(`Table: ${table}`);
        console.log(`  Indexes: ${indexes.length}`);

        if (indexes.length === 0) {
            console.log('  ⚠️  No indexes found - consider adding indexes on foreign keys');
        } else {
            indexes.forEach((idx: any) => {
                console.log(`    - ${idx.name} (unique: ${idx.unique})`);
            });
        }
        console.log('');
    } catch (error) {
        console.log(`  ⚠️  Table ${table} not found\n`);
    }
}

// Summary
console.log('📈 Performance Summary');
console.log('=====================\n');

const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
const slowQueries = results.filter(r => r.duration > 50);

console.log(`Average query time: ${Math.round(avgDuration * 100) / 100}ms`);
console.log(`Slow queries (>50ms): ${slowQueries.length}/${results.length}`);
console.log('');

if (slowQueries.length > 0) {
    console.log('⚠️  Slow queries detected:');
    slowQueries.forEach(q => {
        console.log(`  - ${q.query}: ${q.duration}ms`);
    });
    console.log('');
}

// Optimization recommendations
console.log('💡 Optimization Recommendations:');
console.log('--------------------------------\n');

console.log('1. Add indexes on foreign keys:');
console.log('   CREATE INDEX idx_tasks_projectId ON tasks(projectId);');
console.log('   CREATE INDEX idx_expenses_companyId ON expense_claims(companyId);');
console.log('   CREATE INDEX idx_projects_companyId ON projects(companyId);');
console.log('');

console.log('2. Add composite indexes for common queries:');
console.log('   CREATE INDEX idx_expenses_company_date ON expense_claims(companyId, date);');
console.log('   CREATE INDEX idx_tasks_project_status ON tasks(projectId, status);');
console.log('');

console.log('3. Consider query result caching for:');
console.log('   - Dashboard statistics');
console.log('   - User project lists');
console.log('   - Cost code lookups');
console.log('');

// Performance targets
console.log('🎯 Performance Targets:');
console.log('-----------------------\n');
console.log('✅ Excellent: < 10ms');
console.log('✅ Good: 10-50ms');
console.log('⚠️  Fair: 50-100ms');
console.log('❌ Poor: > 100ms');
console.log('');

db.close();

console.log('✨ Analysis complete!');
