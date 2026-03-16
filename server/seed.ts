import database from './database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const db = database.getDb();

  // Check if already seeded
  const result = await db.all('SELECT count(*) as count FROM users');
  const userCount = result[0];

  if (userCount && (userCount.count > 0 || userCount.count === '1')) {
    logger.info('Database already seeded');
    return;
  }

  logger.info('Seeding database...');

  // --- Generate UUIDs for all entities ---
  const companyId = 'company-main-001'; // VARCHAR for companies table

  const userIds = {
    admin: uuidv4(),
    superAdmin: uuidv4(),
    user1: uuidv4(),
    user2: uuidv4(),
    demoUser: uuidv4()
  };

  const projectIds = {
    p1: uuidv4(),
    p2: uuidv4(),
    p3: uuidv4()
  };

  const taskIds = {
    t1: uuidv4(),
    t2: uuidv4()
  };

  // --- Companies (VARCHAR ID) ---
  await db.run(
    `INSERT INTO companies (id, name, slug, status, plan, subscriptiontier, maxprojects, maxusers, isactive, createdat, updatedat)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
    [companyId, 'BuildCorp Solutions', 'buildcorp', 'ACTIVE', 'ENTERPRISE', 'ENTERPRISE', 100, 50, true]
  );
  logger.info('Company seeded');

  // --- Users (UUID primary key) ---
  const users = [
    {
      id: userIds.superAdmin,
      email: 'admin@cortexbuildpro.com',
      password_hash: await bcrypt.hash('Admin123!', 12),
      name: 'Super Admin',
      role: 'SUPERADMIN',
      status: 'active',
      is_active: true
    },
    {
      id: userIds.admin,
      email: 'demo@buildpro.app',
      password_hash: await bcrypt.hash('demo123', 12),
      name: 'Demo User',
      role: 'admin',
      status: 'active',
      is_active: true
    },
    {
      id: userIds.user1,
      email: 'john@buildcorp.com',
      password_hash: await bcrypt.hash('password123', 12),
      name: 'John Anderson',
      role: 'admin',
      status: 'active',
      is_active: true
    },
    {
      id: userIds.user2,
      email: 'sarah@buildcorp.com',
      password_hash: await bcrypt.hash('password123', 12),
      name: 'Sarah Mitchell',
      role: 'admin',
      status: 'active',
      is_active: true
    }
  ];

  for (const u of users) {
    await db.run(
      `INSERT INTO users (id, email, password_hash, name, role, status, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [u.id, u.email, u.password_hash, u.name, u.role, u.status, u.is_active ? 1 : 0]
    );
  }
  logger.info('Users seeded');

  // --- Memberships (Link users to company) ---
  const memberships = [
    { id: 'mem-001', userId: userIds.superAdmin, companyId: companyId, role: 'SUPERADMIN' },
    { id: 'mem-002', userId: userIds.admin, companyId: companyId, role: 'COMPANY_ADMIN' },
    { id: 'mem-003', userId: userIds.user1, companyId: companyId, role: 'MEMBER' },
    { id: 'mem-004', userId: userIds.user2, companyId: companyId, role: 'MEMBER' }
  ];

  for (const m of memberships) {
    await db.run(
      `INSERT INTO memberships (id, userid, companyid, role, status, createdat, updatedat)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())`,
      [m.id, m.userId, m.companyId, m.role]
    );
  }
  logger.info('Memberships seeded');

  // --- Projects (UUID, owner_id references users) ---
  const projects = [
    {
      id: projectIds.p1,
      owner_id: userIds.admin,
      name: 'City Centre Plaza Development',
      description: 'A mixed-use development featuring 40 stories of office space and a luxury retail podium.',
      status: 'active',
      budget: 25000000,
      start_date: '2025-01-15',
      end_date: '2026-12-31',
      priority: 'high',
      riskscore: 25,
      tags: JSON.stringify(['commercial', 'high-rise', 'mixed-use']),
      metadata: JSON.stringify({
        location: 'Downtown Metro',
        type: 'Commercial',
        health: 'Good',
        progress: 74,
        spent: 18500000,
        manager: 'John Anderson',
        teamSize: 24,
        weatherLocation: { city: 'New York', temp: '72°', condition: 'Sunny' },
        aiAnalysis: 'Project is progressing ahead of schedule.',
        code: 'CCP-2025'
      })
    },
    {
      id: projectIds.p2,
      owner_id: userIds.user1,
      name: 'Residential Complex - Phase 2',
      description: 'Three tower residential complex with 400 units and shared amenities.',
      status: 'active',
      budget: 15000000,
      start_date: '2025-02-01',
      end_date: '2025-11-30',
      priority: 'high',
      riskscore: 65,
      tags: JSON.stringify(['residential', 'multi-family', 'phase-2']),
      metadata: JSON.stringify({
        location: 'Westside Heights',
        type: 'Residential',
        health: 'At Risk',
        progress: 45,
        spent: 16500000,
        manager: 'Sarah Mitchell',
        teamSize: 18,
        code: 'RCP-002'
      })
    },
    {
      id: projectIds.p3,
      owner_id: userIds.admin,
      name: 'Hospital Expansion - East Wing',
      description: 'New 5-story medical wing with 120 patient rooms and advanced surgical facilities.',
      status: 'active',
      budget: 35000000,
      start_date: '2025-03-01',
      end_date: '2027-06-30',
      priority: 'medium',
      riskscore: 40,
      tags: JSON.stringify(['healthcare', 'expansion', 'critical-infrastructure']),
      metadata: JSON.stringify({
        location: 'Medical District',
        type: 'Healthcare',
        health: 'Good',
        progress: 12,
        spent: 4200000,
        manager: 'John Anderson',
        teamSize: 32,
        code: 'HEX-2025'
      })
    }
  ];

  for (const p of projects) {
    await db.run(
      `INSERT INTO projects (id, owner_id, name, description, status, budget, start_date, end_date, priority, riskscore, tags, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [p.id, p.owner_id, p.name, p.description, p.status, p.budget, p.start_date, p.end_date, p.priority, p.riskscore, p.tags, p.metadata]
    );
  }
  logger.info('Projects seeded');

  // --- Tasks (UUID, project_id references projects) ---
  const tasks = [
    {
      id: taskIds.t1,
      project_id: projectIds.p1,
      title: 'Safety inspection - Site A',
      description: 'Conduct full perimeter safety check.',
      assignee_id: userIds.user1,
      status: 'todo',
      priority: 'high',
      due_date: '2025-11-12',
      metadata: JSON.stringify({ latitude: 40.7128, longitude: -74.0060 })
    },
    {
      id: taskIds.t2,
      project_id: projectIds.p1,
      title: 'Concrete pouring - Level 2',
      description: 'Pour and finish slab for level 2 podium.',
      assignee_id: userIds.user2,
      status: 'in_progress',
      priority: 'high',
      due_date: '2025-11-20',
      metadata: JSON.stringify({ latitude: 40.7135, longitude: -74.0055 })
    }
  ];

  for (const t of tasks) {
    await db.run(
      `INSERT INTO tasks (id, project_id, title, description, assignee_id, status, priority, due_date, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [t.id, t.project_id, t.title, t.description, t.assignee_id, t.status, t.priority, t.due_date, t.metadata]
    );
  }
  logger.info('Tasks seeded');

  // --- RFIs ---
  const rfis = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      number: 'RFI-001',
      subject: 'Clarification on Curtain Wall Anchors',
      description: 'The specs for anchors on level 4 seem to conflict with structural drawings.',
      response: null,
      assignedto: userIds.user2,
      status: 'open',
      duedate: '2025-11-15'
    },
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      number: 'RFI-002',
      subject: 'Lobby Flooring Material',
      description: 'Is the marble finish confirmed for the main entrance?',
      response: 'Yes, specs confirmed in Rev 3.',
      assignedto: userIds.user1,
      status: 'closed',
      duedate: '2025-10-30'
    }
  ];

  for (const r of rfis) {
    await db.run(
      `INSERT INTO rfis (id, companyid, projectid, number, subject, description, response, assignedto, status, duedate, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [r.id, r.companyid, r.project_id, r.number, r.subject, r.description, r.response, r.assignedto, r.status, r.duedate]
    );
  }
  logger.info('RFIs seeded');

  // --- Punch Items ---
  const punchItems = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      title: 'Paint scratch in hallway',
      location: 'Level 3, Corridor B',
      description: 'Minor scuff marks on north wall.',
      status: 'open',
      priority: 'low',
      assignedto: userIds.user1
    },
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      title: 'Loose electrical socket',
      location: 'Unit 402',
      description: 'Socket not flush with wall.',
      status: 'resolved',
      priority: 'medium',
      assignedto: userIds.user2
    }
  ];

  for (const p of punchItems) {
    await db.run(
      `INSERT INTO punch_items (id, companyid, projectid, title, location, description, status, priority, assignedto, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [p.id, p.companyid, p.project_id, p.title, p.location, p.description, p.status, p.priority, p.assignedto]
    );
  }
  logger.info('Punch items seeded');

  // --- Daily Logs ---
  const dailyLogs = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      date: '2025-11-10',
      weather: 'Sunny, 72°F',
      notes: 'Site visit by inspectors went well.',
      activities: 'Concrete pouring on sector 4 completed.',
      workforce: 18,
      created_by: userIds.user1
    },
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      date: '2025-11-09',
      weather: 'Cloudy, 68°F',
      notes: 'Delay in steel delivery caused 2h downtime.',
      activities: 'Formwork setup for Level 5.',
      workforce: 22,
      created_by: userIds.user1
    }
  ];

  for (const d of dailyLogs) {
    await db.run(
      `INSERT INTO daily_logs (id, companyid, projectid, date, weather, notes, activities, workforce, createdby, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [d.id, d.companyid, d.project_id, d.date, d.weather, d.notes, d.activities, d.workforce, d.created_by]
    );
  }
  logger.info('Daily logs seeded');

  // --- Dayworks ---
  const dayworks = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      date: '2025-11-08',
      description: 'Emergency cleanup after storm. Removed debris from north access road to allow delivery trucks.',
      status: 'approved',
      labor: JSON.stringify([{ name: 'Adrian', trade: 'Laborer', hours: 12, rate: 30 }]),
      materials: JSON.stringify([{ item: 'Sandbags', quantity: 50, unit: 'bags', cost: 5.50 }]),
      attachments: '[]',
      total_labor_cost: 360,
      total_material_cost: 275,
      grand_total: 635
    },
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      date: '2025-11-10',
      description: 'Extra excavation for utility line reroute due to unforeseen obstruction.',
      status: 'pending',
      labor: JSON.stringify([{ name: 'Team A', trade: 'Groundworks', hours: 8, rate: 45 }]),
      materials: JSON.stringify([{ item: 'Gravel', quantity: 2, unit: 'ton', cost: 80 }]),
      attachments: '[]',
      total_labor_cost: 360,
      total_material_cost: 160,
      grand_total: 520
    }
  ];

  for (const dw of dayworks) {
    await db.run(
      `INSERT INTO dayworks (id, companyid, projectid, date, description, status, labor, materials, attachments, totallaborcost, totalmaterialcost, grandtotal, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [dw.id, dw.companyid, dw.project_id, dw.date, dw.description, dw.status, dw.labor, dw.materials, dw.attachments, dw.total_labor_cost, dw.total_material_cost, dw.grand_total]
    );
  }
  logger.info('Dayworks seeded');

  // --- Permissions ---
  const RESOURCES = ['projects', 'tasks', 'users', 'roles', 'automations', 'reports', 'settings', 'daily_logs', 'documents', 'rfis', 'punch_items', 'safety_incidents', 'equipment', 'timesheets', 'chats', 'finance', 'inventory', 'defects', 'risks'];
  const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const permId = uuidv4();
      const permName = `${resource}.${action}`;

      const existing = await db.get('SELECT id FROM permissions WHERE name = $1', [permName]);
      if (!existing) {
        await db.run(
          `INSERT INTO permissions (id, name, resource, action, description, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [permId, permName, resource, action, `Allow ${action} on ${resource}`]
        );

        // Grant to SUPERADMIN role
        const existingRolePerm = await db.get('SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2', ['SUPERADMIN', permId]);
        if (!existingRolePerm) {
          await db.run(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            ['SUPERADMIN', permId]
          );
        }
      }
    }
  }
  logger.info('Permissions seeded');

  // --- Safety Incidents ---
  const incidents = [
    {
      id: uuidv4(),
      companyid: companyId,
      projectid: projectIds.p1,
      projectname: 'City Centre Plaza Development',
      title: 'Near miss with forklift',
      description: 'Forklift nearly struck worker in sector 4.',
      severity: 'Medium',
      status: 'investigating',
      date: '2025-11-01',
      type: 'Machinery'
    }
  ];

  for (const s of incidents) {
    await db.run(
      `INSERT INTO safety_incidents (id, companyid, projectid, projectname, title, description, severity, status, date, type, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [s.id, s.companyid, s.projectid, s.projectname, s.title, s.description, s.severity, s.status, s.date, s.type]
    );
  }
  logger.info('Safety incidents seeded');

  // --- Equipment ---
  const equipment = [
    {
      id: uuidv4(),
      companyid: companyId,
      name: 'Excavator CAT-320',
      type: 'Heavy Machinery',
      status: 'in_use',
      project_id: projectIds.p1,
      projectname: 'City Centre Plaza Development',
      last_service: '2025-09-15',
      next_maintenance: '2025-12-15',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
  ];

  for (const e of equipment) {
    await db.run(
      `INSERT INTO equipment (id, companyid, name, type, status, projectid, projectname, lastservice, nextmaintenance, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [e.id, e.companyid, e.name, e.type, e.status, e.project_id, e.projectname, e.last_service, e.next_maintenance, e.image]
    );
  }
  logger.info('Equipment seeded');

  // --- Timesheets ---
  const timesheets = [
    {
      id: uuidv4(),
      companyid: companyId,
      user_id: userIds.user1,
      username: 'John Anderson',
      project_id: projectIds.p1,
      projectname: 'City Centre Plaza Development',
      date: '2025-11-10',
      hours_worked: 8,
      start_time: '07:00',
      end_time: '15:00',
      status: 'approved'
    }
  ];

  for (const t of timesheets) {
    await db.run(
      `INSERT INTO timesheets (id, companyid, userid, username, projectid, projectname, date, hoursworked, starttime, endtime, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [t.id, t.companyid, t.user_id, t.username, t.project_id, t.projectname, t.date, t.hours_worked, t.start_time, t.end_time, t.status]
    );
  }
  logger.info('Timesheets seeded');

  // --- Chat Messages ---
  const chatMessages = [
    {
      id: uuidv4(),
      project_id: projectIds.p1,
      user_id: userIds.user1,
      message: 'Foundation work is progressing well. Should be done by Friday.',
      message_type: 'user'
    },
    {
      id: uuidv4(),
      project_id: projectIds.p1,
      user_id: userIds.user2,
      message: 'Great! I\'ll schedule the inspection for Saturday morning.',
      message_type: 'user'
    }
  ];

  for (const m of chatMessages) {
    await db.run(
      `INSERT INTO chat_messages (id, project_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [m.id, m.project_id, m.user_id, m.message, m.message_type]
    );
  }
  logger.info('Chat messages seeded');

  // --- Documents ---
  const documents = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      projectname: 'City Centre Plaza Development',
      name: 'Project Plans Rev 3.pdf',
      type: 'pdf',
      size: '2500000',
      status: 'active',
      url: '/uploads/plans-rev3.pdf'
    }
  ];

  for (const d of documents) {
    await db.run(
      `INSERT INTO documents (id, companyid, projectid, projectname, name, type, size, status, url, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [d.id, d.companyid, d.project_id, d.projectname, d.name, d.type, d.size, d.status, d.url]
    );
  }
  logger.info('Documents seeded');

  // --- Files ---
  const files = [
    {
      id: uuidv4(),
      project_id: projectIds.p1,
      uploaded_by: userIds.admin,
      filename: 'site-foundation.jpg',
      original_filename: 'Site Photo - Foundation.jpg',
      file_size: 1500000,
      mime_type: 'image/jpeg',
      file_path: '/uploads/site-foundation.jpg'
    }
  ];

  for (const f of files) {
    await db.run(
      `INSERT INTO files (id, project_id, uploaded_by, filename, original_filename, file_size, mime_type, file_path, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [f.id, f.project_id, f.uploaded_by, f.filename, f.original_filename, f.file_size, f.mime_type, f.file_path]
    );
  }
  logger.info('Files seeded');

  // --- Material Deliveries ---
  const deliveries = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      material: 'Steel Rebar #4',
      quantity: 5,
      unit: 'tons',
      supplier: 'SteelCity Inc',
      delivery_date: '2025-11-15',
      po_number: 'PO-998877',
      notes: 'Delivered to laydown area B'
    },
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      material: 'Lumber 2x4',
      quantity: 500,
      unit: 'pcs',
      supplier: 'WoodWorks',
      delivery_date: '2025-11-18',
      po_number: 'PO-998878',
      notes: 'Framing material'
    }
  ];

  for (const d of deliveries) {
    await db.run(
      `INSERT INTO material_deliveries (id, companyid, projectid, material, quantity, unit, supplier, deliverydate, ponumber, notes, createdat, updatedat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [d.id, d.companyid, d.project_id, d.material, d.quantity, d.unit, d.supplier, d.delivery_date, d.po_number, d.notes]
    );
  }
  logger.info('Material deliveries seeded');

  // --- Inspections ---
  const inspections = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      inspection_number: 'INSP-001',
      title: 'Pre-Pour Foundation Check',
      type: 'Structural',
      scheduled_date: '2025-11-19',
      inspector: 'City Official',
      status: 'passed',
      location: 'Foundation Sector A',
      pass_fail_status: 'Pass',
      notes: 'Rebar spacing verified ok.'
    }
  ];

  for (const i of inspections) {
    await db.run(
      `INSERT INTO inspections (id, companyid, projectid, inspectionnumber, title, type, scheduleddate, inspector, status, location, passfailstatus, notes, createdat, updatedat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [i.id, i.companyid, i.project_id, i.inspection_number, i.title, i.type, i.scheduled_date, i.inspector, i.status, i.location, i.pass_fail_status, i.notes]
    );
  }
  logger.info('Inspections seeded');

  // --- Concrete Pours ---
  const pours = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      pour_date: '2025-11-20',
      location: 'Foundation Sector A',
      element: 'Slab on Grade',
      volume: 450,
      unit: 'CY',
      mix_design: '4000PSI-EXT',
      supplier: 'Metro Concrete Supply',
      temperature: 65,
      slump: 4.5,
      status: 'completed'
    },
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      pour_date: '2025-12-05',
      location: 'Column Line B',
      element: 'Columns',
      volume: 120,
      unit: 'CY',
      mix_design: '5000PSI-STR',
      supplier: 'Metro Concrete Supply',
      temperature: 62,
      slump: 4,
      status: 'scheduled'
    }
  ];

  for (const p of pours) {
    await db.run(
      `INSERT INTO concrete_pours (id, companyid, projectid, pourdate, location, element, volume, unit, mixdesign, supplier, temperature, slump, status, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [p.id, p.companyid, p.project_id, p.pour_date, p.location, p.element, p.volume, p.unit, p.mix_design, p.supplier, p.temperature, p.slump, p.status]
    );
  }
  logger.info('Concrete pours seeded');

  // --- Weather Delays ---
  const delays = [
    {
      id: uuidv4(),
      companyid: companyId,
      project_id: projectIds.p1,
      date: '2025-11-25',
      weather_type: 'Heavy Rain',
      description: 'Site flooded, unable to access perimeter',
      hours_lost: 8,
      cost_impact: 2500,
      affected_activities: JSON.stringify(['Excavation', 'Rebar Installation']),
      created_by: userIds.user1
    }
  ];

  for (const wd of delays) {
    await db.run(
      `INSERT INTO weather_delays (id, companyid, projectid, date, weathertype, description, hourslost, costimpact, affectedactivities, createdby, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [wd.id, wd.companyid, wd.project_id, wd.date, wd.weather_type, wd.description, wd.hours_lost, wd.cost_impact, wd.affected_activities, wd.created_by]
    );
  }
  logger.info('Weather delays seeded');

  // --- Project Members ---
  const projectMembers = [
    {
      id: uuidv4(),
      project_id: projectIds.p1,
      user_id: userIds.admin,
      role: 'owner'
    },
    {
      id: uuidv4(),
      project_id: projectIds.p1,
      user_id: userIds.user1,
      role: 'member'
    },
    {
      id: uuidv4(),
      project_id: projectIds.p1,
      user_id: userIds.user2,
      role: 'member'
    }
  ];

  for (const pm of projectMembers) {
    await db.run(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES ($1, $2, $3, $4)`,
      [pm.id, pm.project_id, pm.user_id, pm.role]
    );
  }
  logger.info('Project members seeded');

  // --- Modules (Marketplace) ---
  const modules = [
    {
      id: uuidv4(),
      developer_id: userIds.admin,
      name: 'SiteGuard AI',
      slug: 'siteguard-ai',
      description: 'Real-time hazard detection using project cameras and AI computer vision.',
      category: 'Safety & Compliance',
      version: '2.1.0',
      price: 49.99,
      is_free: false,
      status: 'published',
      downloads: 1250,
      rating: 4.8,
      reviews_count: 42,
      icon: 'Eye'
    },
    {
      id: uuidv4(),
      developer_id: userIds.admin,
      name: 'AutoBill Pro',
      slug: 'autobill-pro',
      description: 'Automated invoice processing and material cost tracking with OCR.',
      category: 'Financials',
      version: '1.0.5',
      price: 0,
      is_free: true,
      status: 'published',
      downloads: 3400,
      rating: 4.5,
      reviews_count: 128,
      icon: 'Receipt'
    }
  ];

  for (const m of modules) {
    await db.run(
      `INSERT INTO modules (id, developerid, name, slug, description, category, version, price, isfree, status, publishedat, updatedat, downloads, rating, reviewscount, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11, $12, $13, $14)`,
      [m.id, m.developer_id, m.name, m.slug, m.description, m.category, m.version, m.price, m.is_free, m.status, m.downloads, m.rating, m.reviews_count, m.icon]
    );
  }
  logger.info('Modules seeded');

  // --- Module Categories ---
  const categories = [
    { id: uuidv4(), name: 'AI & Intelligence', slug: 'ai-intelligence', description: 'Advanced AI tools and predictive analytics.', icon: 'Brain', sortorder: 1 },
    { id: uuidv4(), name: 'Safety & Compliance', slug: 'safety-compliance', description: 'Tools for site safety and regulatory compliance.', icon: 'Shield', sortorder: 2 },
    { id: uuidv4(), name: 'Financials', slug: 'financials', description: 'Cost tracking, invoicing, and budgeting tools.', icon: 'DollarSign', sortorder: 3 },
    { id: uuidv4(), name: 'Field Tools', slug: 'field-tools', description: 'On-site reporting and construction management.', icon: 'HardHat', sortorder: 4 }
  ];

  for (const cat of categories) {
    await db.run(
      `INSERT INTO module_categories (id, name, slug, description, icon, sortorder) VALUES ($1, $2, $3, $4, $5, $6)`,
      [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.sortorder]
    );
  }
  logger.info('Module categories seeded');

  // --- Hazards ---
  const hazards = [
    {
      id: uuidv4(),
      company_id: companyId,
      project_id: projectIds.p1,
      type: 'Safety',
      title: 'Unprotected edge at Level 3',
      description: 'Missing guardrail on north side',
      severity: 'high',
      status: 'open',
      detected_by: userIds.user1
    }
  ];

  for (const h of hazards) {
    await db.run(
      `INSERT INTO hazards (id, company_id, project_id, type, title, description, severity, status, detected_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [h.id, h.company_id, h.project_id, h.type, h.title, h.description, h.severity, h.status, h.detected_by]
    );
  }
  logger.info('Hazards seeded');

  // --- Resource Allocations ---
  const allocations = [
    {
      id: uuidv4(),
      task_id: taskIds.t1,
      resource_id: 'res-001',
      start_date: '2025-11-10',
      end_date: '2025-11-12',
      notes: 'Required for perimeter check'
    }
  ];

  for (const a of allocations) {
    await db.run(
      `INSERT INTO resource_allocations (id, task_id, resource_id, start_date, end_date, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [a.id, a.task_id, a.resource_id, a.start_date, a.end_date, a.notes]
    );
  }
  logger.info('Resource allocations seeded');

  // --- Task Assignments ---
  const taskAssignments = [
    {
      id: uuidv4(),
      task_id: taskIds.t1,
      user_id: userIds.user1,
      username: 'John Anderson',
      role: 'lead',
      allocated_hours: 8
    },
    {
      id: uuidv4(),
      task_id: taskIds.t2,
      user_id: userIds.user2,
      username: 'Sarah Mitchell',
      role: 'member',
      allocated_hours: 6
    }
  ];

  for (const ta of taskAssignments) {
    await db.run(
      `INSERT INTO task_assignments (id, taskid, userid, username, role, allocatedhours)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ta.id, ta.task_id, ta.user_id, ta.username, ta.role, ta.allocated_hours]
    );
  }
  logger.info('Task assignments seeded');

  logger.info('Seeding complete!');
}

// Self-invocation for standalone execution
import { initializeDatabase } from './database.js';

async function main() {
  try {
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database initialized, starting seed...');
    await seedDatabase();
    logger.info('Seed script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed script failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}