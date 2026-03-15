import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedAdrian() {
    const dbPath = join(__dirname, '..', 'buildpro_db.sqlite');
    const db = new Database(dbPath);

    console.log('Creating user for adrian.stanca1@gmail.com...');

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('adrian.stanca1@gmail.com');

    if (existingUser) {
        console.log('✅ User adrian.stanca1@gmail.com already exists');
        db.close();
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const now = new Date().toISOString();

    // Insert user
    db.prepare(`
    INSERT INTO users (id, email, password, name, role, companyId, status, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('adrian-admin', 'adrian.stanca1@gmail.com', hashedPassword, 'Adrian Stanca', 'SUPERADMIN', 'c1', 'active', 1, now, now);

    // Insert membership
    db.prepare(`
    INSERT INTO memberships (id, userId, companyId, role, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('m-adrian', 'adrian-admin', 'c1', 'SUPERADMIN', 'active', now, now);

    console.log('✅ User created successfully');
    console.log('Email: adrian.stanca1@gmail.com');
    console.log('Password: Admin123!');
    console.log('Role: SUPERADMIN');

    db.close();
}

seedAdrian().catch(console.error);
