/**
 * Health Check Endpoints
 * Production-grade health monitoring with DB, Redis, S3 checks
 */

import { Request, Response } from 'express';
import { pool } from '../database';
import { redisClient } from '../config/redis';
import { S3Client } from '@aws-sdk/client-s3';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  service: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastChecked: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Check PostgreSQL database connectivity
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const result = await pool.query('SELECT NOW() as timestamp, 1 as connected');
    const latency = Date.now() - startTime;
    
    return {
      service: 'database',
      name: 'PostgreSQL',
      status: 'healthy',
      latency,
      lastChecked: new Date().toISOString(),
      message: 'Database connection active',
      details: {
        connected: result.rows[0]?.connected === 1,
        timestamp: result.rows[0]?.timestamp,
        poolSize: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (error) {
    return {
      service: 'database',
      name: 'PostgreSQL',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: `Database connection failed: ${(error as Error).message}`,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedisHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    if (!redisClient) {
      return {
        service: 'redis',
        name: 'Redis',
        status: 'unhealthy',
        latency: 0,
        lastChecked: new Date().toISOString(),
        message: 'Redis client not initialized',
      };
    }
    
    await redisClient.ping();
    const latency = Date.now() - startTime;
    const info = await redisClient.info('memory');
    
    return {
      service: 'redis',
      name: 'Redis',
      status: 'healthy',
      latency,
      lastChecked: new Date().toISOString(),
      message: 'Redis connection active',
      details: {
        connected: true,
        memoryUsed: info?.used_memory_human,
        memoryPeak: info?.used_memory_peak_human,
      },
    };
  } catch (error) {
    return {
      service: 'redis',
      name: 'Redis',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: `Redis connection failed: ${(error as Error).message}`,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Check S3 connectivity
 */
async function checkS3Health(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    
    await s3Client.send({
      ...new (await import('@aws-sdk/client-s3')).ListBucketsCommand({}),
    });
    
    const latency = Date.now() - startTime;
    
    return {
      service: 's3',
      name: 'Amazon S3',
      status: 'healthy',
      latency,
      lastChecked: new Date().toISOString(),
      message: 'S3 connection active',
      details: {
        connected: true,
        region: process.env.AWS_REGION || 'us-east-1',
      },
    };
  } catch (error) {
    return {
      service: 's3',
      name: 'Amazon S3',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      message: `S3 connection failed: ${(error as Error).message}`,
      details: { error: (error as Error).message },
    };
  }
}

/**
 * Check application startup readiness
 */
function checkStartupReadiness(): ServiceHealth {
  const isReady = !!(
    process.env.DATABASE_URL &&
    process.env.PORT
  );
  
  return {
    service: 'startup',
    name: 'Application Readiness',
    status: isReady ? 'healthy' : 'unhealthy',
    latency: 0,
    lastChecked: new Date().toISOString(),
    message: isReady ? 'Application ready to receive traffic' : 'Missing required configuration',
    details: {
      ready: isReady,
      hasDatabase: !!process.env.DATABASE_URL,
      hasPort: !!process.env.PORT,
    },
  };
}

/**
 * Check application liveness
 */
function checkLiveness(): ServiceHealth {
  return {
    service: 'liveness',
    name: 'Application Liveness',
    status: 'healthy',
    latency: 0,
    lastChecked: new Date().toISOString(),
    message: 'Application is alive',
  };
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
  const unhealthy = services.filter(s => s.status === 'unhealthy').length;
  const degraded = services.filter(s => s.status === 'degraded').length;
  
  if (unhealthy > 0) return 'unhealthy';
  if (degraded > 0) return 'degraded';
  return 'healthy';
}

/**
 * GET /api/health - Basic health check
 */
export async function basicHealth(req: Request, res: Response): Promise<void> {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: [],
  };
  
  res.json(health);
}

/**
 * GET /api/health/extended - Extended health check with all services
 */
export async function extendedHealth(req: Request, res: Response): Promise<void> {
  const [dbHealth, redisHealth, s3Health] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkS3Health(),
  ]);
  
  const services = [dbHealth, redisHealth, s3Health];
  const overall = calculateOverallStatus(services);
  
  const health: HealthStatus = {
    status: overall,
    timestamp: new Date().toISOString(),
    services,
  };
  
  res.status(overall === 'healthy' ? 200 : 503).json(health);
}

/**
 * GET /api/ready - Startup probe
 */
export async function readinessProbe(req: Request, res: Response): Promise<void> {
  const readiness = checkStartupReadiness();
  
  const response = {
    status: readiness.status,
    timestamp: new Date().toISOString(),
    service: readiness,
  };
  
  res.status(readiness.status === 'healthy' ? 200 : 503).json(response);
}

/**
 * GET /api/live - Liveness probe
 */
export async function livenessProbe(req: Request, res: Response): Promise<void> {
  const liveness = checkLiveness();
  
  const response = {
    status: liveness.status,
    timestamp: new Date().toISOString(),
    service: liveness,
  };
  
  res.status(200).json(response);
}
