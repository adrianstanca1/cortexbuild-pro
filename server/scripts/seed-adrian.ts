import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedAdrian() {
    const email = process.env.ADMIN_EMAIL || 'adrian.stanca1@gmail.com';
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
        console.error('❌ ADMIN_PASSWORD environment variable is required.');
        console.error('   Usage: ADMIN_PASSWORD=YourSecurePassword npx tsx scripts/seed-adrian.ts');
        process.exit(1);
    }

    const dbPath = join(__dirname, '..', 'buildpro_db.sqlite');
    const db = new Database(dbPath);

    console.log(`Creating user for ${email}...`);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
        console.log(`✅ User ${email} already exists`);
        db.close();
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    // Insert user
    db.prepare(`
    INSERT INTO users (id, email, password, name, role, companyId, status, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('adrian-admin', email, hashedPassword, 'Adrian Stanca', 'SUPERADMIN', 'c1', 'active', 1, now, now);

    // Insert membership
    db.prepare(`
    INSERT INTO memberships (id, userId, companyId, role, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('m-adrian', 'adrian-admin', 'c1', 'SUPERADMIN', 'active', now, now);

    console.log('✅ User created successfully');
    console.log(`Email: ${email}`);
    console.log('Role: SUPERADMIN');

    db.close();
}

seedAdrian().catch(console.error);
