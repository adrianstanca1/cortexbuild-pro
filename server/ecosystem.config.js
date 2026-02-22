// PM2 Ecosystem Configuration
// Note: Sensitive values should be set via environment variables or PM2 environment files
// Use: pm2 start ecosystem.config.js --env production
// IMPORTANT: DB_NAME, DB_USER, and DB_PASSWORD must be set as environment variables
module.exports = {
    apps: [{
        name: 'cortexbuild-backend',
        script: './dist/index.js',
        cwd: '/home/u875310796/domains/cortexbuildpro.com/public_html/api',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 8080,
            DATABASE_TYPE: 'mysql',
            DB_HOST: process.env.DB_HOST || 'localhost',
            DB_PORT: process.env.DB_PORT || 3306,
            DB_NAME: process.env.DB_NAME,
            DB_USER: process.env.DB_USER,
            DB_PASSWORD: process.env.DB_PASSWORD
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        min_uptime: '10s',
        max_restarts: 10,
        restart_delay: 4000
    }]
};