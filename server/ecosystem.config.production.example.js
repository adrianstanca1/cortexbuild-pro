// PM2 Ecosystem Configuration for Production
// Copy this file to ecosystem.config.production.js and fill in your actual values
// Do NOT commit the production file with actual credentials!
// The 'cwd' should point to the server directory containing the dist/ folder

module.exports = {
    apps: [{
        name: 'cortexbuild-backend',
        script: './dist/index.js',
        cwd: '/your/deployment/path/server', // Path to server directory (contains dist/)
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 8080,
            DATABASE_TYPE: 'mysql',
            DB_HOST: 'your-db-host',
            DB_PORT: 3306,
            DB_NAME: 'your-database-name',
            DB_USER: 'your-database-user',
            DB_PASSWORD: 'your-secure-password'
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
