import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306
};

async function runMigration() {
    let connection;

    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected successfully');

        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations/004_create_projects.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('\nRunning migration: 004_create_projects.sql');
        console.log('---');

        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement) {
                console.log(`Executing: ${statement.substring(0, 50)}...`);
                await connection.query(statement);
                console.log('✅ Success');
            }
        }

        console.log('\n✅ Migration completed successfully!');

        // Verify tables were created
        console.log('\nVerifying tables...');
        const [projectsTable] = await connection.query("SHOW TABLES LIKE 'projects'");
        const [membersTable] = await connection.query("SHOW TABLES LIKE 'project_members'");

        console.log('Projects table:', projectsTable.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND');
        console.log('Project members table:', membersTable.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed.');
        }
    }
}

runMigration();
