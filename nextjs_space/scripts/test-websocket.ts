#!/usr/bin/env tsx

/**
 * CortexBuild Pro - WebSocket Connection Test
 * 
 * This script tests the WebSocket server connectivity and real-time features
 * without requiring a full browser environment.
 */

import { io, Socket } from 'socket.io-client';

interface TestConfig {
  url: string;
  path: string;
  timeout: number;
}

const config: TestConfig = {
  url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000',
  path: '/api/socketio',
  timeout: 10000
};

console.log('🔌 CortexBuild Pro - WebSocket Connection Test\n');
console.log('Configuration:');
console.log(`  URL: ${config.url}`);
console.log(`  Path: ${config.path}`);
console.log(`  Timeout: ${config.timeout}ms\n`);

function runTest(): Promise<void> {
  return new Promise((resolve, reject) => {
    let connected = false;
    let authenticated = false;
    const socket: Socket = io(config.url, {
      path: config.path,
      transports: ['websocket', 'polling'],
      timeout: config.timeout,
      reconnection: false
    });

    // Set overall timeout
    const timeoutId = setTimeout(() => {
      socket.disconnect();
      if (!connected) {
        reject(new Error('Connection timeout - WebSocket server may not be running'));
      } else if (!authenticated) {
        reject(new Error('Authentication timeout - check authentication logic'));
      }
    }, config.timeout);
    
    // Ensure timeout is cleared on promise completion
    const clearTimeoutSafely = () => {
      clearTimeout(timeoutId);
    };

    // Connection established
    socket.on('connect', () => {
      connected = true;
      console.log('✅ Connection established');
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Transport: ${socket.io.engine.transport.name}`);
      
      // Try to authenticate (will fail without valid token, but we can test the mechanism)
      console.log('\n📝 Testing authentication mechanism...');
      socket.emit('authenticate', {
        token: 'test-token',
        userId: 'test-user-id'
      });
    });

    // Authentication response
    socket.on('authenticated', (data: any) => {
      authenticated = true;
      console.log('✅ Authenticated:', data);
      clearTimeoutSafely();
      socket.disconnect();
      resolve();
    });

    // Authentication error (expected without valid credentials)
    socket.on('authentication-error', (error: any) => {
      console.log('⚠️  Authentication error (expected):', error.message);
      console.log('   This is normal - we used test credentials');
      console.log('\n✅ Authentication mechanism is working');
      clearTimeoutSafely();
      socket.disconnect();
      resolve();
    });

    // Connection error
    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      clearTimeoutSafely();
      reject(error);
    });

    // Disconnect
    socket.on('disconnect', (reason: string) => {
      console.log('\n🔌 Disconnected:', reason);
    });

    // Generic error
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      clearTimeoutSafely();
      reject(error);
    });
  });
}

async function main() {
  try {
    await runTest();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ WebSocket Test PASSED');
    console.log('='.repeat(50));
    console.log('\nThe WebSocket server is properly configured and running.');
    console.log('\nNext steps:');
    console.log('1. Start the application: ./start-dev.sh');
    console.log('2. Sign in to get valid credentials');
    console.log('3. Test real-time features in the UI');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ WebSocket Test FAILED');
    console.log('='.repeat(50));
    console.error('\nError:', error instanceof Error ? error.message : error);
    
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the server is running:');
    console.log('   - Development: npm run dev');
    console.log('   - Production: node production-server.js');
    console.log('');
    console.log('2. Check NEXT_PUBLIC_WEBSOCKET_URL in .env');
    console.log('   Current: ' + config.url);
    console.log('');
    console.log('3. Verify the WebSocket path is correct');
    console.log('   Current: ' + config.path);
    console.log('');
    console.log('4. Check server logs for errors');
    console.log('');
    
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  main();
}
