/**
 * OpenTelemetry Distributed Tracing
 * Production tracing configuration
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';

interface TracingConfig {
  serviceName: string;
  collectorUrl?: string;
  enableConsoleExporter?: boolean;
  sampleRate?: number;
}

/**
 * Initialize OpenTelemetry SDK
 */
export function initTracing(config: TracingConfig): NodeSDK {
  const {
    serviceName,
    collectorUrl = 'http://localhost:4318/v1/traces',
    enableConsoleExporter = false,
    sampleRate = 1.0,
  } = config;

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  });

  const traceExporter = new OTLPTraceExporter({
    url: collectorUrl,
    headers: {},
    concurrencyLimit: 10,
  });

  const spanProcessor = new BatchSpanProcessor(traceExporter, {
    maxQueueSize: 2048,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
    maxExportBatchSize: 512,
  });

  const instrumentations = [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requireParentforSpans: true,
        ignoreIncomingRequestUrls: [
          /\/health/,
          /\/metrics/,
          /\/ready/,
          /\/live/,
        ],
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        ignoreLayersType: ['middleware'],
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        requireParentforSpans: false,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ];

  const sdk = new NodeSDK({
    resource,
    spanProcessor,
    instrumentations,
    sampler: {
      shouldSample: () => {
        return {
          decision: sampleRate >= 1 ? 1 : Math.random() < sampleRate ? 1 : 0,
        };
      },
      toString: () => 'ParentBased(TraceIdRatioBased{' + sampleRate + '})',
    },
  });

  // Add console exporter for development
  if (enableConsoleExporter || process.env.NODE_ENV === 'development') {
    sdk.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  return sdk;
}

/**
 * Start tracing
 */
export async function startTracing(config: TracingConfig): Promise<void> {
  const sdk = initTracing(config);
  await sdk.start();
  
  process.on('SIGTERM', async () => {
    await sdk.shutdown();
  });
}

/**
 * Stop tracing
 */
export async function stopTracing(): Promise<void> {
  // SDK shutdown handled by signal handler
}

/**
 * Get current trace context
 */
export function getCurrentTraceContext(): {
  traceId?: string;
  spanId?: string;
} | null {
  const api = require('@opentelemetry/api');
  const context = api.context.active();
  const span = api.trace.getSpan(context);
  
  if (!span) return null;
  
  return {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
  };
}

/**
 * Create child span
 */
export function createSpan(_tracer: any, name: string, attributes?: Record<string, string>): any {
  const api = require('@opentelemetry/api');
  const tracer = api.trace.getTracer('cortexbuild');
  const span = tracer.startSpan(name, { attributes });
  return span;
}

/**
 * Record exception
 */
export function recordException(span: any, error: Error): void {
  span.recordException(error);
  span.setStatus({
    code: 2, // SpanStatusCode.ERROR
    message: error.message,
  });
}

/**
 * Inject trace headers into headers object
 */
export function injectTraceHeaders(headers: Record<string, string>): Record<string, string> {
  const api = require('@opentelemetry/api');
  const propagation = api.propagation;
  const context = api.context.active();
  
  propagation.inject(context, headers);
  
  return headers;
}

/**
 * Extract trace headers from request
 */
export function extractTraceHeaders(headers: Record<string, string>): any {
  const api = require('@opentelemetry/api');
  const propagation = api.propagation;
  
  return propagation.extract(api.context.ROOT_CONTEXT, headers);
}

/**
 * Trace async function
 */
export async function traceAsync<T>(
  tracer: any,
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  const span = createSpan(tracer, name, attributes);
  
  try {
    const result = await fn();
    span.end();
    return result;
  } catch (error) {
    recordException(span, error as Error);
    span.end();
    throw error;
  }
}

/**
 * Trace sync function
 */
export function traceSync<T>(
  tracer: any,
  name: string,
  fn: () => T,
  attributes?: Record<string, string>
): T {
  const span = createSpan(tracer, name, attributes);
  
  try {
    const result = fn();
    span.end();
    return result;
  } catch (error) {
    recordException(span, error as Error);
    span.end();
    throw error;
  }
}

/**
 * Database tracing wrapper
 */
export async function traceDBQuery<T>(
  query: string,
  fn: () => Promise<T>,
  database?: string
): Promise<T> {
  const api = require('@opentelemetry/api');
  const tracer = api.trace.getTracer('cortexbuild-db');
  
  return traceAsync(tracer, 'db.query', async () => {
    return fn();
  }, {
    'db.statement': query,
    'db.system': 'postgresql',
    'db.name': database || 'cortexbuild',
  });
}

/**
 * Cache tracing wrapper
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete',
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const api = require('@opentelemetry/api');
  const tracer = api.trace.getTracer('cortexbuild-cache');
  
  return traceAsync(tracer, 'cache.' + operation, async () => {
    return fn();
  }, {
    'cache.key': key,
    'cache.operation': operation,
  });
}

/**
 * HTTP client tracing wrapper
 */
export async function traceHTTPClient<T>(
  url: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  const api = require('@opentelemetry/api');
  const tracer = api.trace.getTracer('cortexbuild-http');
  
  return traceAsync(tracer, 'http.client', async () => {
    return fn();
  }, {
    'http.url': url,
    'http.method': method,
  });
}
