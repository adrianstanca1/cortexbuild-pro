#!/usr/bin/env tsx
/**
 * API Connection Testing Script
 * 
 * Tests all configured API connections and validates their credentials.
 * 
 * Usage: npx tsx scripts/test-api-connections.ts [--service <name>] [--environment <env>]
 */

import { PrismaClient, ApiConnectionStatus, ApiEnvironment } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  connectionId: string;
  serviceName: string;
  environment: string;
  previousStatus: string;
  newStatus: string;
  success: boolean;
  responseTime?: number;
  message: string;
}

/**
 * Parse supported command-line flags and return normalized options for filtering and verbosity.
 *
 * @returns An object with:
 * - `service`: optional service name from `--service <name>` (as provided)
 * - `environment`: optional environment from `--environment <env>` converted to uppercase
 * - `verbose`: `true` if `--verbose` or `-v` is present, `false` otherwise
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options: { service?: string; environment?: string; verbose: boolean } = {
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const serviceIdx = args.indexOf('--service');
  if (serviceIdx !== -1 && args[serviceIdx + 1]) {
    options.service = args[serviceIdx + 1];
  }

  const envIdx = args.indexOf('--environment');
  if (envIdx !== -1 && args[envIdx + 1]) {
    options.environment = args[envIdx + 1].toUpperCase();
  }

  return options;
}

/**
 * Parse credentials from a JSON string or an encrypted JSON string prefixed with `enc:`.
 *
 * @param encryptedData - A JSON string containing credentials, or an encrypted string starting with `enc:` followed by base64-encoded JSON
 * @returns The parsed credentials as an object, or an empty object if parsing or decryption fails
 */
function decryptCredentials(encryptedData: string): Record<string, string> {
  try {
    if (encryptedData.startsWith('enc:')) {
      const decoded = Buffer.from(encryptedData.slice(4), 'base64').toString('utf-8');
      return JSON.parse(decoded);
    }
    return JSON.parse(encryptedData);
  } catch {
    return {};
  }
}

/**
 * Checks a SendGrid API key by requesting the SendGrid account endpoint.
 *
 * @param credentials - Object containing connection credentials; must include `apiKey`
 * @returns An object with:
 *  - `success`: `true` if the request returned a successful status, `false` otherwise.
 *  - `message`: human-readable result or error description.
 *  - `responseTime`: elapsed time for the test in milliseconds.
 */
async function testSendGrid(credentials: Record<string, string>): Promise<{ success: boolean; message: string; responseTime: number }> {
  const start = Date.now();
  try {
    if (!credentials.apiKey) {
      return { success: false, message: 'Missing API key', responseTime: Date.now() - start };
    }

    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      return { success: true, message: 'SendGrid connection successful', responseTime };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid API key', responseTime };
    } else {
      return { success: false, message: `API returned ${response.status}`, responseTime };
    }
  } catch (error: any) {
    return { success: false, message: error.message, responseTime: Date.now() - start };
  }
}

/**
 * Checks whether provided OpenAI API credentials can access the OpenAI models endpoint.
 *
 * @param credentials - Object containing OpenAI credentials; must include `apiKey`.
 * @returns An object with `success` indicating connectivity, `message` describing the outcome, and `responseTime` in milliseconds.
 */
async function testOpenAI(credentials: Record<string, string>): Promise<{ success: boolean; message: string; responseTime: number }> {
  const start = Date.now();
  try {
    if (!credentials.apiKey) {
      return { success: false, message: 'Missing API key', responseTime: Date.now() - start };
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      return { success: true, message: 'OpenAI connection successful', responseTime };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid API key', responseTime };
    } else {
      return { success: false, message: `API returned ${response.status}`, responseTime };
    }
  } catch (error: any) {
    return { success: false, message: error.message, responseTime: Date.now() - start };
  }
}

/**
 * Validates Stripe API credentials by requesting the account balance.
 *
 * @param credentials - An object containing Stripe credentials; should include `secretKey` or `apiKey`
 * @returns An object with `success` (`true` if the credentials allowed a successful request, `false` otherwise), `message` describing the outcome, and `responseTime` in milliseconds
 */
async function testStripe(credentials: Record<string, string>): Promise<{ success: boolean; message: string; responseTime: number }> {
  const start = Date.now();
  try {
    const apiKey = credentials.secretKey || credentials.apiKey;
    if (!apiKey) {
      return { success: false, message: 'Missing secret key', responseTime: Date.now() - start };
    }

    const response = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      return { success: true, message: 'Stripe connection successful', responseTime };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid API key', responseTime };
    } else {
      return { success: false, message: `API returned ${response.status}`, responseTime };
    }
  } catch (error: any) {
    return { success: false, message: error.message, responseTime: Date.now() - start };
  }
}

/**
 * Verifies Twilio account credentials by requesting the account resource.
 *
 * @param credentials - Object containing `accountSid` and `authToken`.
 * @returns An object with `success` indicating whether the credentials are valid, `message` with a short result or error, and `responseTime` in milliseconds.
 */
async function testTwilio(credentials: Record<string, string>): Promise<{ success: boolean; message: string; responseTime: number }> {
  const start = Date.now();
  try {
    if (!credentials.accountSid || !credentials.authToken) {
      return { success: false, message: 'Missing Account SID or Auth Token', responseTime: Date.now() - start };
    }

    const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      return { success: true, message: 'Twilio connection successful', responseTime };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid credentials', responseTime };
    } else {
      return { success: false, message: `API returned ${response.status}`, responseTime };
    }
  } catch (error: any) {
    return { success: false, message: error.message, responseTime: Date.now() - start };
  }
}

/**
 * Checks whether an HTTP endpoint is reachable by sending a HEAD request.
 *
 * @param baseUrl - The full URL of the endpoint to test
 * @returns An object with:
 *  - `success`: `true` if the HTTP response status is less than 500 or indicates success (`response.ok`), `false` otherwise.
 *  - `message`: A human-readable status description or error message.
 *  - `responseTime`: Elapsed time in milliseconds for the request.
 */
async function testGenericUrl(baseUrl: string): Promise<{ success: boolean; message: string; responseTime: number }> {
  const start = Date.now();
  try {
    const response = await fetch(baseUrl, {
      method: 'HEAD'
    });

    const responseTime = Date.now() - start;
    return { 
      success: response.ok || response.status < 500, 
      message: `Endpoint reachable (${response.status})`, 
      responseTime 
    };
  } catch (error: any) {
    return { success: false, message: error.message, responseTime: Date.now() - start };
  }
}

/**
 * Test an API connection, update its status and lastValidatedAt, and record the outcome in apiConnectionLog.
 *
 * @param connection - Connection to validate. `credentials` may be a plain object or an encrypted string (e.g., prefixed with `enc:` and base64-encoded); `baseUrl` is used when no service-specific test exists.
 * @returns An object with:
 *   - `connectionId`: the connection's id
 *   - `serviceName`: the connection's service name
 *   - `environment`: the connection's environment
 *   - `previousStatus`: status before the test
 *   - `newStatus`: status after the test (`ACTIVE` on success, `ERROR` on failure)
 *   - `success`: `true` if the test succeeded, `false` otherwise
 *   - `responseTime`: test elapsed time in milliseconds
 *   - `message`: human-readable result or error message
 */
async function testConnection(connection: {
  id: string;
  serviceName: string;
  name: string;
  credentials: any;
  baseUrl: string | null;
  status: ApiConnectionStatus;
  environment: ApiEnvironment;
}): Promise<TestResult> {
  // Handle credentials - could be JSON object or encrypted string
  let credentials: Record<string, string>;
  if (typeof connection.credentials === 'string') {
    credentials = decryptCredentials(connection.credentials);
  } else if (typeof connection.credentials === 'object' && connection.credentials !== null) {
    credentials = connection.credentials as Record<string, string>;
  } else {
    credentials = {};
  }
  const serviceLower = connection.serviceName.toLowerCase();

  let testResult: { success: boolean; message: string; responseTime: number };

  switch (serviceLower) {
    case 'sendgrid':
      testResult = await testSendGrid(credentials);
      break;
    case 'openai':
      testResult = await testOpenAI(credentials);
      break;
    case 'stripe':
      testResult = await testStripe(credentials);
      break;
    case 'twilio':
      testResult = await testTwilio(credentials);
      break;
    default:
      if (connection.baseUrl) {
        testResult = await testGenericUrl(connection.baseUrl);
      } else {
        testResult = { success: false, message: 'No test available for this service', responseTime: 0 };
      }
  }

  // Update connection status in database
  const newStatus: ApiConnectionStatus = testResult.success ? 'ACTIVE' : 'ERROR';
  
  await prisma.apiConnection.update({
    where: { id: connection.id },
    data: {
      status: newStatus,
      lastValidatedAt: new Date(),
      lastErrorMessage: testResult.success ? null : testResult.message
    }
  });

  // Log the test
  await prisma.apiConnectionLog.create({
    data: {
      connectionId: connection.id,
      action: 'TEST',
      details: {
        previousStatus: connection.status,
        newStatus,
        responseTime: testResult.responseTime,
        message: testResult.message
      },
      testSuccess: testResult.success,
      testResponseTime: testResult.responseTime,
      testErrorMessage: testResult.success ? null : testResult.message
    }
  });

  return {
    connectionId: connection.id,
    serviceName: connection.serviceName,
    environment: connection.environment,
    previousStatus: connection.status,
    newStatus,
    success: testResult.success,
    responseTime: testResult.responseTime,
    message: testResult.message
  };
}

/**
 * Run API connection tests for connections filtered by command-line options and print results to the console.
 *
 * Retrieves matching API connections from the database, executes a connectivity check for each entry, updates the connection's status and last-validated timestamp, records a test log entry, and prints per-connection outcomes and an overall summary to stdout.
 */
async function main() {
  const options = parseArgs();

  console.log('\n🔌 API Connection Testing');
  console.log('==========================\n');

  // Build query filters
  const where: any = {};
  if (options.service) {
    where.serviceName = { contains: options.service, mode: 'insensitive' };
  }
  if (options.environment) {
    where.environment = options.environment as ApiEnvironment;
  }

  // Fetch connections to test
  const connections = await prisma.apiConnection.findMany({
    where,
    orderBy: { serviceName: 'asc' }
  });

  if (connections.length === 0) {
    console.log('No API connections found to test.');
    if (options.service || options.environment) {
      console.log('Try running without filters to see all connections.');
    }
    return;
  }

  console.log(`Found ${connections.length} connection(s) to test...\n`);

  const results: TestResult[] = [];

  for (const connection of connections) {
    console.log(`Testing: ${connection.name} (${connection.serviceName})...`);
    const result = await testConnection(connection);
    results.push(result);

    const emoji = result.success ? '✅' : '❌';
    console.log(`  ${emoji} ${result.message} (${result.responseTime}ms)`);
    console.log(`     Status: ${result.previousStatus} → ${result.newStatus}\n`);
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n==========================');
  console.log('Test Summary');
  console.log('==========================');
  console.log(`Total tested: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed connections:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.serviceName}: ${r.message}`));
  }

  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());