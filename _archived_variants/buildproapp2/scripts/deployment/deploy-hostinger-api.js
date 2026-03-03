#!/usr/bin/env node

/**
 * Hostinger Backend Deployment Script
 * Uses Hostinger API to configure and start the Node.js application
 */

const readline = require('readline');

// Check if hostinger-api-sdk is available
let HostingerAPI;
try {
    HostingerAPI = require('hostinger-api-sdk');
} catch (error) {
    console.error('❌ Error: hostinger-api-sdk not found');
    console.error('Please run: npm install hostinger-api-sdk');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function deployBackend() {
    console.log('🚀 Hostinger Backend Deployment Tool\n');

    try {
        // Get API token
        const apiToken = await question('Enter your Hostinger API token: ');

        if (!apiToken || apiToken.trim() === '') {
            console.error('❌ API token is required');
            process.exit(1);
        }

        console.log('\n📡 Connecting to Hostinger API...');

        // Initialize Hostinger API client
        const client = new HostingerAPI(apiToken.trim());

        // Configuration
        const config = {
            domain: 'cortexbuildpro.com',
            appRoot: '/home/u875310796/domains/cortexbuildpro.com/api',
            startupFile: 'dist/index.js',
            nodeVersion: '20.x'
        };

        console.log('\n📋 Configuration:');
        console.log(`   Domain: ${config.domain}`);
        console.log(`   App Root: ${config.appRoot}`);
        console.log(`   Startup File: ${config.startupFile}`);
        console.log(`   Node Version: ${config.nodeVersion}`);

        // Note: The actual API methods depend on the hostinger-api-sdk implementation
        // This is a template that needs to be adjusted based on the SDK documentation

        console.log('\n⚠️  Note: Hostinger API SDK methods need to be verified');
        console.log('The SDK may not support Node.js app management via API.');
        console.log('\nAlternative: Use hPanel web interface');
        console.log('1. Go to https://hpanel.hostinger.com');
        console.log('2. Websites → Node.js → Create Application');
        console.log('3. Use the configuration shown above');

        rl.close();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPlease complete setup manually in hPanel:');
        console.error('https://hpanel.hostinger.com → Websites → Node.js');
        rl.close();
        process.exit(1);
    }
}

deployBackend();