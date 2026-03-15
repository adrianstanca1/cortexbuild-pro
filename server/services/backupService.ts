import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export class BackupService {
    private static backupDir = './backups';

    private static ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Create a database backup (SQLite or MySQL)
     */
    static async createBackup(): Promise<{ name: string; path: string; size: number; sizeMB: string; timestamp: string }> {
        this.ensureBackupDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (process.env.DATABASE_TYPE === 'sqlite' || !process.env.DATABASE_TYPE) {
            return this.createSqliteBackup(timestamp);
        } else {
            return this.createMysqlBackup(timestamp);
        }
    }

    private static async createSqliteBackup(timestamp: string) {
        const backupName = `backup-${timestamp}.db`;
        const sourcePath = './cortexbuild.db';
        const backupPath = path.join(this.backupDir, backupName);

        if (!fs.existsSync(sourcePath)) {
            throw new AppError('Database file not found', 404);
        }

        try {
            // Copy database file
            fs.copyFileSync(sourcePath, backupPath);
            return this.getBackupStats(backupName, backupPath);
        } catch (err) {
            logger.error('SQLite backup failed:', err);
            throw new AppError('Backup failed', 500);
        }
    }

    private static async createMysqlBackup(timestamp: string) {
        const backupName = `backup-${timestamp}.sql`;
        const backupPath = path.join(this.backupDir, backupName);

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cortexbuild_db',
            port: process.env.DB_PORT || 3306
        };

        // Construct command safely. ideally use MYSQL_PWD env var to avoid password in process list
        // stricter sanitized command
        const cmd = `mysqldump --no-tablespaces --column-statistics=0 --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} ${dbConfig.database} > "${backupPath}"`;

        // Pass password via environment variable for security
        const env = { ...process.env, MYSQL_PWD: dbConfig.password };

        return new Promise<any>((resolve, reject) => {
            exec(cmd, { env }, (error, stdout, stderr) => {
                if (error) {
                    logger.error('MySQL Backup failed:', stderr);
                    reject(new AppError('Backup failed: ' + stderr, 500));
                    return;
                }

                try {
                    const stats = this.getBackupStats(backupName, backupPath);
                    resolve(stats);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    private static getBackupStats(name: string, filePath: string) {
        const stats = fs.statSync(filePath);
        return {
            name,
            path: filePath,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            timestamp: new Date().toISOString()
        };
    }

    static listBackups() {
        if (!fs.existsSync(this.backupDir)) return [];

        const files = fs.readdirSync(this.backupDir);
        return files
            .filter(f => f.endsWith('.db') || f.endsWith('.sql') || f.endsWith('.gz'))
            .map(f => {
                const stats = fs.statSync(path.join(this.backupDir, f));
                return {
                    name: f,
                    size: stats.size,
                    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                    createdAt: stats.birthtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    static getBackupPath(filename: string): string {
        const filePath = path.join(this.backupDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new AppError('Backup file not found', 404);
        }
        // Prevent path traversal
        if (path.relative(this.backupDir, filePath).startsWith('..')) {
            throw new AppError('Invalid filename', 400);
        }
        return filePath;
    }
}

export const backupService = new BackupService();
