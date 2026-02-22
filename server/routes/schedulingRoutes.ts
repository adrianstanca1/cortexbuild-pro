import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/scheduling/optimize
 * Optimize resource allocation for a project
 */
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { projectId, startDate, endDate, resources, tasks, constraints } = req.body;

    if (!projectId || !tasks || tasks.length === 0) {
      return res.status(400).json({ error: 'Project ID and tasks are required' });
    }

    // Simple scheduling algorithm
    const schedule = optimizeSchedule(tasks, resources || [], constraints || {});

    res.json({
      projectId,
      schedule,
      metrics: {
        totalDuration: calculateTotalDuration(schedule),
        resourceUtilization: calculateResourceUtilization(schedule, resources || []),
        criticalPath: identifyCriticalPath(schedule)
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error optimizing schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scheduling/allocate
 * Allocate resources to tasks
 */
router.post('/allocate', authenticateToken, async (req, res) => {
  try {
    const { taskId, resourceIds, startDate, endDate, allocationPercentage } = req.body;

    if (!taskId || !resourceIds || resourceIds.length === 0) {
      return res.status(400).json({ error: 'Task ID and resource IDs are required' });
    }

    const db = getDb();
    const allocations = [];

    for (const resourceId of resourceIds) {
      const id = `ALLOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await db.run(
        `INSERT INTO resource_allocations (
          id, task_id, resource_id, start_date, end_date, 
          allocation_percentage, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          id,
          taskId,
          resourceId,
          startDate,
          endDate,
          allocationPercentage || 100,
          'allocated'
        ]
      );

      allocations.push({ id, taskId, resourceId, startDate, endDate, allocationPercentage });
    }

    res.status(201).json({ allocations });
  } catch (error: any) {
    logger.error('Error allocating resources:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scheduling/conflicts
 * Detect scheduling conflicts
 */
router.get('/conflicts', authenticateToken, async (req, res) => {
  try {
    const { projectId, resourceId, startDate, endDate } = req.query;
    const db = getDb();

    let query = `
      SELECT ra.*, t.name as task_name, t.project_id
      FROM resource_allocations ra
      JOIN tasks t ON ra.task_id = t.id
      WHERE ra.status = 'allocated'
    `;
    const params: any[] = [];

    if (projectId) {
      query += ' AND t.project_id = ?';
      params.push(projectId);
    }

    if (resourceId) {
      query += ' AND ra.resource_id = ?';
      params.push(resourceId);
    }

    if (startDate && endDate) {
      query += ' AND ((ra.start_date <= ? AND ra.end_date >= ?) OR (ra.start_date <= ? AND ra.end_date >= ?))';
      params.push(endDate, startDate, startDate, endDate);
    }

    const allocations = await db.all(query, params);

    // Group by resource to find conflicts
    const conflicts: any[] = [];
    const resourceMap = new Map();

    for (const allocation of allocations) {
      if (!resourceMap.has(allocation.resource_id)) {
        resourceMap.set(allocation.resource_id, []);
      }
      resourceMap.get(allocation.resource_id).push(allocation);
    }

    // Check for overlapping allocations
    for (const [resourceId, allocs] of resourceMap.entries()) {
      if (allocs.length > 1) {
        for (let i = 0; i < allocs.length; i++) {
          for (let j = i + 1; j < allocs.length; j++) {
            const a1 = allocs[i];
            const a2 = allocs[j];
            
            // Check if dates overlap
            if (datesOverlap(a1.start_date, a1.end_date, a2.start_date, a2.end_date)) {
              conflicts.push({
                resourceId,
                conflict: [a1, a2],
                severity: 'high',
                message: `Resource ${resourceId} is double-booked`
              });
            }
          }
        }
      }
    }

    res.json({ conflicts, count: conflicts.length });
  } catch (error: any) {
    logger.error('Error detecting conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scheduling/availability
 * Get resource availability
 */
router.get('/availability', authenticateToken, async (req, res) => {
  try {
    const { resourceIds, startDate, endDate } = req.query;
    const db = getDb();

    if (!resourceIds || !startDate || !endDate) {
      return res.status(400).json({ error: 'Resource IDs, start date, and end date are required' });
    }

    const ids = (resourceIds as string).split(',');
    const availability: any[] = [];

    for (const resourceId of ids) {
      const allocations = await db.all(
        `SELECT * FROM resource_allocations 
         WHERE resource_id = ? 
         AND status = 'allocated'
         AND start_date <= ? 
         AND end_date >= ?`,
        [resourceId, endDate, startDate]
      );

      const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocation_percentage || 100), 0);
      const availableCapacity = Math.max(0, 100 - totalAllocated);

      availability.push({
        resourceId,
        availableCapacity,
        allocations: allocations.length,
        isAvailable: availableCapacity > 0,
        details: allocations
      });
    }

    res.json({ availability });
  } catch (error: any) {
    logger.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scheduling/gantt
 * Get Gantt chart data for a project
 */
router.get('/gantt', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const db = getDb();

    const tasks = await db.all(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM resource_allocations WHERE task_id = t.id) as resource_count
       FROM tasks t 
       WHERE t.project_id = ?
       ORDER BY t.start_date`,
      [projectId]
    );

    const ganttData = tasks.map((task: any) => ({
      id: task.id,
      name: task.name,
      start: task.start_date,
      end: task.end_date,
      progress: task.progress || 0,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      resources: task.resource_count,
      status: task.status
    }));

    res.json({ tasks: ganttData });
  } catch (error: any) {
    logger.error('Error fetching Gantt data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function optimizeSchedule(tasks: any[], resources: any[], constraints: any) {
  // Simple priority-based scheduling
  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by priority, then by duration
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return (a.duration || 0) - (b.duration || 0);
  });

  const schedule: any[] = [];
  let currentDate = new Date();

  for (const task of sortedTasks) {
    const duration = task.duration || 1;
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + duration);

    schedule.push({
      taskId: task.id,
      taskName: task.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      duration,
      assignedResources: task.assignedTo || []
    });

    // Move to next available slot
    currentDate = endDate;
  }

  return schedule;
}

function calculateTotalDuration(schedule: any[]) {
  if (schedule.length === 0) return 0;
  
  const startDates = schedule.map(s => new Date(s.startDate));
  const endDates = schedule.map(s => new Date(s.endDate));
  
  const earliest = new Date(Math.min(...startDates.map(d => d.getTime())));
  const latest = new Date(Math.max(...endDates.map(d => d.getTime())));
  
  return Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateResourceUtilization(schedule: any[], resources: any[]) {
  if (resources.length === 0) return 0;
  
  const totalResourceDays = schedule.reduce((sum, task) => {
    return sum + (task.assignedResources.length * task.duration);
  }, 0);
  
  const totalAvailableDays = resources.length * calculateTotalDuration(schedule);
  
  return totalAvailableDays > 0 ? (totalResourceDays / totalAvailableDays) * 100 : 0;
}

function identifyCriticalPath(schedule: any[]) {
  // Simplified critical path - longest sequence of tasks
  const sortedByEnd = [...schedule].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
  
  return sortedByEnd.slice(0, 5).map(s => s.taskId);
}

function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 <= e2 && s2 <= e1;
}

export default router;
