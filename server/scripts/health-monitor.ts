import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Automated Health Monitor for Production
 * Continuously monitors API health and logs metrics
 */

const API_URL = process.env.API_URL || 'https://api.cortexbuildpro.com/api';
const CHECK_INTERVAL = 60000; // 60 seconds
const LOG_DIR = 'logs/health';
const ALERT_THRESHOLD = 3; // Alert after 3 consecutive failures

interface HealthMetrics {
    timestamp: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    database: string;
    websocket: {
        activeConnections: number;
    };
    system: {
        memory: string;
        load: number[];
    };
    consecutiveFailures: number;
}

let consecutiveFailures = 0;
let metrics: HealthMetrics[] = [];

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function checkHealth(): Promise<HealthMetrics> {
    const start = Date.now();

    try {
        const response = await axios.get(`${API_URL}/health`, {
            timeout: 5000
        });

        const responseTime = Date.now() - start;
        consecutiveFailures = 0;

        const metric: HealthMetrics = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            responseTime,
            database: response.data.database?.status || 'unknown',
            websocket: {
                activeConnections: response.data.websocket?.activeConnections || 0
            },
            system: {
                memory: response.data.system?.memory?.usage || 'unknown',
                load: response.data.system?.load || [0, 0, 0]
            },
            consecutiveFailures: 0
        };

        // Log success
        console.log(`✅ [${metric.timestamp}] Health Check OK - ${responseTime}ms`);
        console.log(`   Database: ${metric.database} | Memory: ${metric.system.memory} | Load: ${metric.system.load[0]}`);

        return metric;

    } catch (error: any) {
        consecutiveFailures++;
        const responseTime = Date.now() - start;

        const metric: HealthMetrics = {
            timestamp: new Date().toISOString(),
            status: consecutiveFailures >= ALERT_THRESHOLD ? 'down' : 'degraded',
            responseTime,
            database: 'unknown',
            websocket: { activeConnections: 0 },
            system: { memory: 'unknown', load: [0, 0, 0] },
            consecutiveFailures
        };

        console.error(`❌ [${metric.timestamp}] Health Check FAILED - ${error.message}`);
        console.error(`   Consecutive failures: ${consecutiveFailures}`);

        if (consecutiveFailures >= ALERT_THRESHOLD) {
            await sendAlert(metric, error);
        }

        return metric;
    }
}

async function sendAlert(metric: HealthMetrics, error: Error) {
    console.error('\n🚨 ALERT: Service is DOWN! 🚨');
    console.error(`Timestamp: ${metric.timestamp}`);
    console.error(`Consecutive Failures: ${metric.consecutiveFailures}`);
    console.error(`Error: ${error.message}`);
    console.error('Action Required: Check server logs and restart if necessary\n');

    // IMPLEMENTATION: Send email/Slack notification
    logger.error(`[CRITICAL] Service Downtime Alert: ${error.message}`);

    // Example: Integration with a notification service (e.g. Slack Webhook)
    const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
    if (SLACK_WEBHOOK) {
        try {
            await axios.post(SLACK_WEBHOOK, {
                text: `🚨 *CortexBuild Alert*: Service is DOWN!\n*Error*: ${error.message}\n*Time*: ${metric.timestamp}\n*Failures*: ${metric.consecutiveFailures}`
            });
            console.log('✅ Slack notification sent');
        } catch (webhookError: any) {
            console.error(`❌ Failed to send Slack notification: ${webhookError.message}`);
        }
    }
}

async function saveMetrics() {
    if (metrics.length === 0) return;

    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOG_DIR, `health-${date}.json`);

    try {
        let existingData: HealthMetrics[] = [];
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf-8');
            existingData = JSON.parse(content);
        }

        const allMetrics = [...existingData, ...metrics];
        fs.writeFileSync(logFile, JSON.stringify(allMetrics, null, 2));

        console.log(`📊 Metrics saved to ${logFile} (${metrics.length} new entries)`);
        metrics = []; // Clear after saving

    } catch (error: any) {
        console.error(`Failed to save metrics: ${error.message}`);
    }
}

async function runMonitor() {
    console.log('🔍 Starting Health Monitor...');
    console.log(`API URL: ${API_URL}`);
    console.log(`Check Interval: ${CHECK_INTERVAL / 1000}s`);
    console.log(`Alert Threshold: ${ALERT_THRESHOLD} failures`);
    console.log('─'.repeat(80));

    // Initial check
    const initialMetric = await checkHealth();
    metrics.push(initialMetric);

    // Schedule periodic checks
    setInterval(async () => {
        const metric = await checkHealth();
        metrics.push(metric);

        // Save metrics every 10 checks (10 minutes)
        if (metrics.length >= 10) {
            await saveMetrics();
        }
    }, CHECK_INTERVAL);

    // Save metrics on exit
    process.on('SIGINT', async () => {
        console.log('\n\n📊 Saving final metrics before exit...');
        await saveMetrics();
        console.log('✅ Health monitor stopped gracefully');
        process.exit(0);
    });

    // Keep process alive
    process.stdin.resume();
}

// Start monitoring
runMonitor().catch(error => {
    console.error('Fatal error in health monitor:', error);
    process.exit(1);
});
