import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Missing SUPABASE_DATABASE_URL or DATABASE_URL env variable');
    process.exit(1);
}

const schemaPath = path.resolve(__dirname, '../supabase/COMPLETE_SCHEMA.sql');

async function applySchema() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    console.log('Connecting to Supabase Postgres...');
    await client.connect();

    const raw = readFileSync(schemaPath, 'utf-8');
    const sanitized = raw
        .split(/\r?\n/)
        .map(line => line.trim().startsWith('--') ? '' : line)
        .join('\n');

    // Simple split on semicolon; keep inside transaction so partial failures roll back
    const statements = sanitized
        .split(/;\s*(?:\r?\n|$)/)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    try {
        await client.query('BEGIN');

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await client.query(statement);
                console.log(`✅ Statement ${i + 1}/${statements.length}`);
            } catch (error: any) {
                console.error(`❌ Statement ${i + 1} failed:`, error.message);
                console.error('Statement SQL:', statement);
                throw error;
            }
        }

        await client.query('COMMIT');
        console.log('🎉 Schema applied successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Schema application failed, rolled back changes.');
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

applySchema().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
