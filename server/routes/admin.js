// CortexBuild Pro API — Platform Admin (multi-tenant operator console)
// Backs Admin Console.html. Real PostgreSQL-backed endpoints for the SaaS
// operator view: workspaces (tenants), users across tenants, billing, audit.
// Mounted at /api/admin/*. All routes require a valid JWT whose role is
// 'owner' or 'platform_admin' (enforced by requireAdmin below).
//
// Tables are created on first use (idempotent), so this works on a fresh DB.

const express = require('express');

module.exports = function adminRoutes(pool, auth) {
  const router = express.Router();

  // ── Schema (idempotent) ──────────────────────────────────────
  async function ensure() {
    await pool.query(`CREATE TABLE IF NOT EXISTS workspaces (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      owner       TEXT,
      plan        TEXT DEFAULT 'Starter',
      seats       INT  DEFAULT 3,
      seats_used  INT  DEFAULT 1,
      mrr         INT  DEFAULT 0,
      status      TEXT DEFAULT 'trial',
      region      TEXT,
      projects    INT  DEFAULT 0,
      storage_mb  INT  DEFAULT 0,
      created     TIMESTAMPTZ DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS admin_audit (
      id      BIGSERIAL PRIMARY KEY,
      actor   TEXT,
      action  TEXT,
      target  TEXT,
      meta    TEXT,
      at      TIMESTAMPTZ DEFAULT now()
    )`);
  }
  let ready = ensure().catch((e) => console.error('[admin] schema', e.message));

  // ── Admin-role gate ──────────────────────────────────────────
  function requireAdmin(req, res, next) {
    const role = (req.user && (req.user.role || req.user.scope)) || '';
    if (role === 'owner' || role === 'platform_admin' || req.user?.admin === true) return next();
    return res.status(403).json({ error: 'admin_required' });
  }
  // Every admin route: authenticate, ensure schema, then check role.
  router.use('/admin', auth, requireAdmin, async (req, res, next) => { try { await ready; next(); } catch (e) { next(e); } });

  async function audit(actor, action, target, meta) {
    try { await pool.query('INSERT INTO admin_audit (actor, action, target, meta) VALUES ($1,$2,$3,$4)', [actor || 'admin', action, target || '', meta || '']); }
    catch (e) { /* non-fatal */ }
  }
  const rowWs = (r) => ({ id: r.id, name: r.name, owner: r.owner, plan: r.plan, seats: r.seats, seatsUsed: r.seats_used, mrr: r.mrr, status: r.status, region: r.region, projects: r.projects, storageMB: r.storage_mb, created: r.created });

  // ── Metrics ──────────────────────────────────────────────────
  router.get('/admin/metrics', async (req, res, next) => {
    try {
      const w = (await pool.query('SELECT * FROM workspaces')).rows;
      const active = w.filter((x) => x.status === 'active');
      const mrr = w.reduce((s, x) => s + ((x.status === 'active' || x.status === 'past_due') ? x.mrr : 0), 0);
      const seats = w.reduce((s, x) => s + x.seats_used, 0);
      const seatCap = w.reduce((s, x) => s + x.seats, 0);
      const u = (await pool.query('SELECT COUNT(*)::int AS n FROM users').catch(() => ({ rows: [{ n: 0 }] }))).rows[0].n;
      res.json({
        mrr, arr: mrr * 12, active: active.length, total: w.length,
        seats, seatCap, trials: w.filter((x) => x.status === 'trial').length,
        pastDue: w.filter((x) => x.status === 'past_due').length,
        storageGB: w.reduce((s, x) => s + x.storage_mb, 0) / 1024,
        projects: w.reduce((s, x) => s + x.projects, 0), users: u,
      });
    } catch (e) { next(e); }
  });

  // ── Workspaces CRUD ──────────────────────────────────────────
  router.get('/admin/workspaces', async (req, res, next) => {
    try { const r = await pool.query('SELECT * FROM workspaces ORDER BY created DESC'); res.json(r.rows.map(rowWs)); }
    catch (e) { next(e); }
  });
  router.post('/admin/workspaces', async (req, res, next) => {
    try {
      const { name, owner, plan } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name_required' });
      const id = 'ws_' + Math.random().toString(36).slice(2, 9);
      const cap = plan === 'Business' ? 40 : plan === 'Pro' ? 12 : 3;
      const mrr = plan === 'Starter' ? 0 : 49;
      await pool.query('INSERT INTO workspaces (id,name,owner,plan,seats,seats_used,mrr,status,region) VALUES ($1,$2,$3,$4,$5,1,$6,$7,$8)',
        [id, name, owner || '—', plan || 'Starter', cap, mrr, 'trial', (req.body && req.body.region) || 'UK-London']);
      await audit(req.user.email, 'workspace.created', name, plan || 'Starter');
      const r = await pool.query('SELECT * FROM workspaces WHERE id=$1', [id]);
      res.status(201).json(rowWs(r.rows[0]));
    } catch (e) { next(e); }
  });
  router.patch('/admin/workspaces/:id', async (req, res, next) => {
    try {
      const cur = (await pool.query('SELECT * FROM workspaces WHERE id=$1', [req.params.id])).rows[0];
      if (!cur) return res.status(404).json({ error: 'not_found' });
      const b = req.body || {};
      const status = b.status || cur.status;
      let plan = b.plan || cur.plan, seats = cur.seats, mrr = cur.mrr;
      if (b.plan) { seats = b.plan === 'Business' ? 40 : b.plan === 'Pro' ? 12 : 3; mrr = b.plan === 'Starter' ? 0 : Math.round(cur.seats_used * 49); }
      if (b.addSeat) seats = cur.seats + (b.addSeat | 0);
      await pool.query('UPDATE workspaces SET status=$1, plan=$2, seats=$3, mrr=$4 WHERE id=$5', [status, plan, seats, mrr, req.params.id]);
      if (b.status && b.status !== cur.status) await audit(req.user.email, 'workspace.status.changed', cur.name, cur.status + ' → ' + b.status);
      if (b.plan && b.plan !== cur.plan) await audit(req.user.email, 'workspace.plan.changed', cur.name, cur.plan + ' → ' + b.plan);
      if (b.addSeat) await audit(req.user.email, 'workspace.seat.added', cur.name, '+' + b.addSeat);
      const r = await pool.query('SELECT * FROM workspaces WHERE id=$1', [req.params.id]);
      res.json(rowWs(r.rows[0]));
    } catch (e) { next(e); }
  });
  router.delete('/admin/workspaces/:id', async (req, res, next) => {
    try {
      const cur = (await pool.query('SELECT name FROM workspaces WHERE id=$1', [req.params.id])).rows[0];
      await pool.query('DELETE FROM workspaces WHERE id=$1', [req.params.id]);
      if (cur) await audit(req.user.email, 'workspace.deleted', cur.name, '');
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // ── Users (cross-tenant) ─────────────────────────────────────
  router.get('/admin/users', async (req, res, next) => {
    try { const r = await pool.query('SELECT id,name,email,workspace_id AS ws,role,status,mfa,last_seen FROM users ORDER BY last_seen DESC NULLS LAST').catch(() => ({ rows: [] })); res.json(r.rows); }
    catch (e) { next(e); }
  });
  router.patch('/admin/users/:id', async (req, res, next) => {
    try {
      const b = req.body || {};
      const sets = [], vals = []; let i = 1;
      if (b.role) { sets.push(`role=$${i++}`); vals.push(b.role); }
      if (b.status) { sets.push(`status=$${i++}`); vals.push(b.status); }
      if (b.resetMfa) { sets.push(`mfa=$${i++}`); vals.push(false); }
      if (!sets.length) return res.status(400).json({ error: 'no_fields' });
      vals.push(req.params.id);
      await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${i}`, vals);
      await audit(req.user.email, 'user.updated', req.params.id, JSON.stringify(b));
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // ── Audit log ────────────────────────────────────────────────
  router.get('/admin/audit', async (req, res, next) => {
    try { const r = await pool.query('SELECT actor,action,target,meta,at FROM admin_audit ORDER BY at DESC LIMIT 200'); res.json(r.rows); }
    catch (e) { next(e); }
  });

  return router;
};
