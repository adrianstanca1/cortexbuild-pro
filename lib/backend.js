// Cortexx — backend layer
// Local-first store (localStorage) with reactive subscriptions + AI helpers.
// Mimics a real REST/SDK feel so the frontend can be wired to a real backend later
// just by swapping this file.

const Backend = (function() {
  const STORAGE_KEY = 'cortexx_db_v1';
  const subs = new Set();

  // ── Seed data ────────────────────────────────────────────
  const SEED = {
    projects: [
      { id: 1, name: 'Camden Mews Refurb', client: 'J. Patterson', value: 185000, pct: 68, status: 'active', addr: 'Camden, NW1', team: 4, due: '2026-06-19', margin: 24.5, createdAt: '2026-04-02' },
      { id: 2, name: 'Hackney Loft Conversion', client: 'Eve & Mark Lin', value: 42000, pct: 22, status: 'active', addr: 'Hackney, E8', team: 2, due: '2026-07-17', margin: 28.0, createdAt: '2026-03-15' },
      { id: 3, name: 'Brixton Shopfront', client: 'Tonic Café Ltd', value: 28000, pct: 90, status: 'snagging', addr: 'Brixton, SW9', team: 3, due: '2026-05-27', margin: 19.4, createdAt: '2026-02-08' },
      { id: 4, name: 'Islington Extension', client: 'B. Khoury', value: 96000, pct: 0, status: 'quoting', addr: 'Islington, N1', team: 0, due: null, margin: 0, createdAt: '2026-05-18' },
      { id: 5, name: 'Streatham Reroof', client: 'Park Towers Mgmt', value: 64000, pct: 100, status: 'complete', addr: 'Streatham, SW16', team: 0, due: '2026-03-30', margin: 26.2, createdAt: '2026-01-12' },
    ],
    tasks: [
      { id: 1, t: 'Order plasterboard 12.5mm', projectId: 1, assignee: 'Tom', due: '2026-05-22', prio: 'high', done: false },
      { id: 2, t: 'Confirm electrician site visit', projectId: 1, assignee: 'Aisha', due: '2026-05-23', prio: 'med', done: false },
      { id: 3, t: 'Sign Camden RAMS', projectId: 1, assignee: 'You', due: '2026-05-23', prio: 'high', done: false },
      { id: 4, t: "Approve Tom's timesheet", projectId: null, assignee: 'You', due: '2026-05-22', prio: 'med', done: false },
      { id: 5, t: 'Send INV-2042 chase', projectId: 1, assignee: 'You', due: '2026-05-26', prio: 'low', done: false },
      { id: 6, t: 'Skip pickup arranged', projectId: 1, assignee: 'Tom', due: '2026-05-22', prio: 'low', done: true },
      { id: 7, t: 'Photograph first-fix', projectId: 1, assignee: 'Aisha', due: '2026-05-21', prio: 'med', done: true },
      { id: 8, t: 'Brixton snag list signed off', projectId: 3, assignee: 'You', due: '2026-05-19', prio: 'high', done: true },
    ],
    team: [
      { id: 1, n: 'Tom Reilly',     r: 'Foreman',     color: '#2563eb', site: 'Camden Mews',  hours: 42.5, status: 'on-site', cscs: 'Gold' },
      { id: 2, n: 'Aisha Begum',    r: 'Electrician', color: '#f59e0b', site: 'Camden Mews',  hours: 38,   status: 'on-site', cscs: 'Blue' },
      { id: 3, n: 'Jack Mitchell',  r: 'Plasterer',   color: '#10b981', site: 'Camden Mews',  hours: 40,   status: 'on-site', cscs: 'Blue' },
      { id: 4, n: 'Sara Khan',      r: 'Apprentice',  color: '#8b5cf6', site: 'Camden Mews',  hours: 32,   status: 'on-site', cscs: 'Green' },
      { id: 5, n: 'Marcus Webb',    r: 'Carpenter',   color: '#06b6d4', site: 'Hackney Loft', hours: 36,   status: 'on-site', cscs: 'Gold' },
      { id: 6, n: 'Lila Owusu',     r: 'Painter',     color: '#ef4444', site: 'Brixton',      hours: 24,   status: 'off',     cscs: 'Blue' },
      { id: 7, n: 'Dan Pavel',      r: 'Labourer',    color: '#f59e0b', site: 'Hackney Loft', hours: 41,   status: 'on-site', cscs: 'Green' },
    ],
    invoices: [
      { id: 'INV-2038', projectId: 1, client: 'J. Patterson',  amount: 37000, status: 'paid',    issued: '2026-04-02', paid: '2026-04-08' },
      { id: 'INV-2040', projectId: 1, client: 'J. Patterson',  amount: 55000, status: 'paid',    issued: '2026-04-22', paid: '2026-04-28' },
      { id: 'INV-2042', projectId: 1, client: 'J. Patterson',  amount: 8420,  status: 'due',     issued: '2026-05-18', due: '2026-05-25' },
      { id: 'INV-2039', projectId: 3, client: 'Tonic Café Ltd', amount: 3890, status: 'overdue', issued: '2026-05-01', due: '2026-05-08' },
      { id: 'INV-2041', projectId: 2, client: 'Eve & Mark Lin', amount: 1900, status: 'due',     issued: '2026-05-15', due: '2026-06-03' },
    ],
    cisSubs: [],
    cisPayments: [],
    receipts: [
      { id: 1, vendor: 'Travis Perkins', amount: 342.18, date: '2026-05-21', category: 'materials', projectId: 1, assigned: true },
      { id: 2, vendor: 'Selco',          amount: 89.40,  date: '2026-05-21', category: 'materials', projectId: null, assigned: false },
      { id: 3, vendor: 'B&Q',            amount: 24.50,  date: '2026-05-20', category: 'consumables', projectId: null, assigned: false },
    ],
    activity: [
      { id: 1, who: 'Tom Reilly',    what: 'uploaded 4 photos',         where: 'Camden Mews',           when: '2026-05-22T09:29', icon: 'camera',  color: '#2563eb' },
      { id: 2, who: 'Cortex AI',     what: 'flagged margin slip',       where: 'Brixton · −1.2% vs quote', when: '2026-05-22T08:40', icon: 'spark',   color: '#8b5cf6' },
      { id: 3, who: 'Aisha Begum',   what: 'completed first-fix electrics', where: 'Camden · kitchen',  when: '2026-05-22T07:35', icon: 'check',   color: '#f59e0b' },
      { id: 4, who: 'Tom Reilly',    what: 'checked in',                where: 'Camden Mews',           when: '2026-05-22T07:30', icon: 'pin',     color: '#10b981' },
      { id: 5, who: 'You',           what: 'approved £1,450 plasterer rebooking', where: 'Camden Mews', when: '2026-05-21T16:22', icon: 'check',   color: '#10b981' },
    ],
    user: {
      name: 'Adrian Stanca', role: 'Director', company: 'CortexBuild Ltd',
      email: 'adrian@cortexbuild.app', cscs: 'Gold', safetyScore: 92,
      monthHours: 142, monthSites: 7, plan: 'Pro · £49/mo',
    },
    settings: {
      notifications: { safety: true, money: true, daily: false, mentions: true },
      theme: 'dark', units: 'metric', language: 'en-GB',
    },
  };

  // ── Storage ──────────────────────────────────────────────
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  };
  let state = load();
  // Migrate cached state: ensure new tables exist on every boot
  for (const k of ['cisSubs', 'cisPayments', 'timesheets', 'diary', 'snags', 'changeOrders', 'rfis', 'subs', 'materials', 'documentsMeta', 'equipment', 'notifications', 'siteMaps']) {
    if (!Array.isArray(state[k])) state[k] = [];
  }
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    subs.forEach(fn => fn(state));
  };

  // ── Subscribe ────────────────────────────────────────────
  const subscribe = (fn) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };

  // ── Local-first store ─────────────────────────────────────
  // Operations run against an in-memory + localStorage-persisted state, so
  // they complete synchronously. The API stays Promise-based (real async
  // contract) but adds zero artificial latency — no simulated network delay.
  const delay = () => Promise.resolve();

  // ── Table API factory ────────────────────────────────────
  // `arr` guarantees state[name] is always an array, even if a table was
  // registered without seed data (prevents "spread of undefined" crashes).
  const arr = (name) => (Array.isArray(state[name]) ? state[name] : (state[name] = []));
  const makeTable = (name) => ({
    list: async () => { await delay(); return [...arr(name)]; },
    listSync: () => [...arr(name)],
    get: async (id) => { await delay(); return arr(name).find(x => x.id == id); },
    getSync: (id) => arr(name).find(x => x.id == id),
    create: async (data) => {
      await delay();
      const ids = arr(name).map(x => typeof x.id === 'number' ? x.id : 0);
      const id = data.id ?? (Math.max(0, ...ids) + 1);
      const item = { ...data, id, _rev: Date.now() };
      state[name] = [item, ...arr(name)];
      persist();
      if (window.cortexxCloud) window.cortexxCloud.push(name, 'create', id, item);
      return item;
    },
    update: async (id, patch) => {
      await delay();
      state[name] = arr(name).map(x => x.id == id ? { ...x, ...patch, _rev: Date.now() } : x);
      persist();
      const item = arr(name).find(x => x.id == id);
      if (window.cortexxCloud) window.cortexxCloud.push(name, 'update', id, item);
      return item;
    },
    updateSync: (id, patch) => {
      state[name] = arr(name).map(x => x.id == id ? { ...x, ...patch, _rev: Date.now() } : x);
      persist();
      const item = arr(name).find(x => x.id == id);
      if (window.cortexxCloud) window.cortexxCloud.push(name, 'update', id, item);
    },
    remove: async (id) => {
      await delay();
      state[name] = arr(name).filter(x => x.id != id);
      persist();
      if (window.cortexxCloud) window.cortexxCloud.push(name, 'delete', id);
    },
  });

  const db = {
    projects: makeTable('projects'),
    tasks: makeTable('tasks'),
    team: makeTable('team'),
    invoices: makeTable('invoices'),
    cisSubs: makeTable('cisSubs'),
    cisPayments: makeTable('cisPayments'),
    receipts: makeTable('receipts'),
    activity: makeTable('activity'),
    // ── v1.3 gap closure: frontend tables that previously had no server home ──
    timesheets: makeTable('timesheets'),
    diary: makeTable('diary'),
    snags: makeTable('snags'),
    changeOrders: makeTable('changeOrders'),
    rfis: makeTable('rfis'),
    subs: makeTable('subs'),
    materials: makeTable('materials'),
    documentsMeta: makeTable('documentsMeta'),
    equipment: makeTable('equipment'),
    notifications: makeTable('notifications'),
    siteMaps: makeTable('siteMaps'),
    user: {
      get: async () => { await delay(); return { ...state.user }; },
      getSync: () => ({ ...state.user }),
      update: async (patch) => { await delay(); state.user = { ...state.user, ...patch }; persist(); return state.user; },
    },
    settings: {
      get: async () => { await delay(); return { ...state.settings }; },
      getSync: () => ({ ...state.settings }),
      update: async (patch) => { await delay(); state.settings = { ...state.settings, ...patch }; persist(); return state.settings; },
    },
    reset: () => { state = JSON.parse(JSON.stringify(SEED)); persist(); },
    subscribe,
    snapshot: () => state,
    // ── Cloud merge: last-write-wins upsert into local collections ──
    // Compares _rev (ms clock) per record; the newer side wins, so a stale
    // remote pull never clobbers a local edit you just made (and vice-versa).
    mergeRemote: (collections) => {
      if (!collections || typeof collections !== 'object') return;
      const MAP = { team_members: 'team' };  // server → local name
      let touched = false;
      Object.keys(collections).forEach(remoteName => {
        const local = MAP[remoteName] || remoteName;
        if (!Array.isArray(state[local])) return;   // only merge known collections
        const incoming = collections[remoteName];
        if (!Array.isArray(incoming)) return;
        const byId = new Map(state[local].map(x => [String(x.id), x]));
        incoming.forEach(rec => {
          if (!rec || rec.id == null) return;
          const key = String(rec.id);
          const cur = byId.get(key);
          const curRev = cur && cur._rev ? cur._rev : 0;
          const remRev = rec._rev || 0;
          // Last-write-wins: only overwrite if remote is newer (or local has no clock).
          if (!cur || remRev >= curRev) byId.set(key, { ...cur, ...rec });
        });
        const next = [...byId.values()];
        if (JSON.stringify(next) !== JSON.stringify(state[local])) { state[local] = next; touched = true; }
      });
      if (touched) persist();
      return touched;
    },
    pullRemote: () => { if (window.cortexxCloud) window.cortexxCloud.pull(); },
  };

  // ── Derived selectors ────────────────────────────────────
  const computed = {
    cashBalance: () => {
      const paid = state.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
      const out = state.receipts.reduce((s, r) => s + r.amount, 0);
      return paid - out;
    },
    outstanding: () => state.invoices.filter(i => ['due', 'overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0),
    overdueCount: () => state.invoices.filter(i => i.status === 'overdue').length,
    activeProjects: () => state.projects.filter(p => ['active', 'snagging'].includes(p.status)).length,
    teamOnSite: () => state.team.filter(t => t.status === 'on-site').length,
    tasksOpen: () => state.tasks.filter(t => !t.done).length,
    tasksHighPrio: () => state.tasks.filter(t => !t.done && t.prio === 'high').length,
    pipelineValue: () => state.projects.filter(p => ['active', 'snagging', 'quoting'].includes(p.status)).reduce((s, p) => s + p.value, 0),
    avgMargin: () => {
      const xs = state.projects.filter(p => p.margin > 0);
      return xs.length ? xs.reduce((s, p) => s + p.margin, 0) / xs.length : 0;
    },
  };

  // ── AI service — wraps window.claude.complete ────────────
  const SYS_BASE = (snap) => `You are Cortex AI, the embedded operations agent for a UK construction company called CortexBuild. Speak in UK English. Be tight — 1–3 short sentences unless asked for detail. Talk like a savvy ops lead, not corporate.

Current business state (live snapshot):
- Projects: ${snap.projects.map(p => `${p.name} (${p.status}, ${p.pct}%, £${(p.value/1000).toFixed(0)}k, margin ${p.margin}%)`).join('; ')}
- Outstanding: £${computed.outstanding().toLocaleString()}; overdue: ${computed.overdueCount()}.
- Cash balance: £${computed.cashBalance().toLocaleString()}.
- Team on site: ${computed.teamOnSite()} of ${snap.team.length}.
- Open tasks: ${computed.tasksOpen()} (${computed.tasksHighPrio()} high-priority).`;

  const ai = {
    // Race any AI promise against a hard timeout so the UI never lingers.
    // Returns the fallback value if the model doesn't answer in `ms`.
    withTimeout: (promise, ms, fallback) => {
      return Promise.race([
        promise.catch(() => fallback),
        new Promise((resolve) => setTimeout(() => resolve(fallback), ms || 6000)),
      ]);
    },

    // Generic ask — used by the chat sheet
    ask: async (userMsg, opts = {}) => {
      const sys = opts.system || SYS_BASE(state);
      const res = await window.claude.complete({
        messages: [{ role: 'user', content: `${sys}\n\nUser: ${userMsg}` }],
      });
      return res.trim();
    },

    // Morning briefing — 2-3 sentence summary of what to know today.
    // Races AI against a 3s cap; falls back to a real computed briefing so the
    // dashboard never shows a dead spinner.
    briefing: async () => {
      const prompt = `${SYS_BASE(state)}\n\nWrite a 2-sentence morning briefing for Adrian. Lead with cashflow direction this week, then the one thing he most needs to act on today. Conversational, friendly, no formatting.`;
      return ai.withTimeout(ai.ask('', { system: prompt }), 3000, ai.localBriefing());
    },

    // Deterministic briefing from live numbers — instant, offline.
    localBriefing: () => {
      const cash = computed.cashBalance();
      const out = computed.outstanding();
      const overdue = computed.overdueCount();
      const highPrio = computed.tasksHighPrio();
      const onSite = computed.teamOnSite();
      const cashLine = cash >= 0
        ? `Cash is positive at £${cash.toLocaleString()}`
        : `Cash is tight at £${cash.toLocaleString()}`;
      const focus = overdue > 0
        ? `chase ${overdue} overdue invoice${overdue > 1 ? 's' : ''} (£${out.toLocaleString()} outstanding)`
        : highPrio > 0
          ? `clear ${highPrio} high-priority task${highPrio > 1 ? 's' : ''}`
          : `keep the ${onSite} crew on site moving`;
      return `${cashLine}, with £${out.toLocaleString()} still to collect. Today's priority: ${focus}.`;
    },

    // Categorize a receipt — returns { category, projectId, confidence }
    categorizeReceipt: async (receipt) => {
      const projects = state.projects.filter(p => ['active','snagging','quoting'].includes(p.status))
        .map(p => `${p.id}:${p.name}`).join(', ');
      const prompt = `Categorize this receipt for a UK construction company. Reply ONLY with JSON like {"category":"materials","projectId":1,"confidence":0.85}.
Categories: materials, tools, fuel, consumables, subsistence, plant-hire, other.
Active projects: ${projects}.
Receipt: vendor="${receipt.vendor}", amount=£${receipt.amount}, date=${receipt.date}.`;
      const fallback = ai.heuristicReceipt(receipt);
      const aiCall = (async () => {
        const raw = await window.claude.complete({ messages: [{ role: 'user', content: prompt }] });
        const json = raw.match(/\{[\s\S]*\}/)?.[0];
        const r = JSON.parse(json);
        return { category: r.category || fallback.category, projectId: r.projectId != null ? r.projectId : fallback.projectId, confidence: r.confidence || fallback.confidence };
      })();
      return ai.withTimeout(aiCall, 2500, fallback);
    },

    // Instant receipt categoriser by vendor keywords — offline.
    heuristicReceipt: (receipt) => {
      const v = String(receipt && receipt.vendor || '').toLowerCase();
      const rules = [
        [/(travis|jewson|wickes|screwfix|selco|builder|timber|plaster|brick|cement|merchant)/, 'materials'],
        [/(dewalt|makita|toolstation|hire|plant|jcb|scaffold)/, 'plant-hire'],
        [/(shell|bp|esso|texaco|fuel|petrol|diesel|garage)/, 'fuel'],
        [/(screw|fix|nail|consumable|tape|sealant)/, 'consumables'],
        [/(greggs|tesco|cafe|costa|pret|subsistence|lunch)/, 'subsistence'],
        [/(tool|drill|saw|grinder)/, 'tools'],
      ];
      let category = 'materials';
      for (const [re, cat] of rules) { if (re.test(v)) { category = cat; break; } }
      const active = state.projects.find(p => ['active','snagging'].includes(p.status));
      return { category, projectId: active ? active.id : null, confidence: 0.6 };
    },

    // Parse a free-form task description into structured fields.
    // Strategy: compute a strong LOCAL heuristic instantly (works offline),
    // then race an AI refinement against a short timeout. The user always gets
    // a usable parse fast; AI improves it when it answers in time.
    parseTask: async (text) => {
      const heuristic = ai.heuristicTask(text);
      const projects = state.projects.map(p => `${p.id}:${p.name}`).join(', ');
      const team = state.team.map(t => t.n.split(' ')[0]).join(', ');
      const today = new Date().toISOString().slice(0, 10);
      const prompt = `Parse this task into JSON. Reply ONLY with JSON: {"title":"...","projectId":1|null,"assignee":"Tom"|"You","prio":"high"|"med"|"low","due":"YYYY-MM-DD"|null}.
Today is ${today}.
Projects: ${projects}. Team: ${team}, You.
Task: "${text}"`;
      const aiCall = (async () => {
        const raw = await window.claude.complete({ messages: [{ role: 'user', content: prompt }] });
        const json = raw.match(/\{[\s\S]*\}/)?.[0];
        const parsed = JSON.parse(json);
        // Merge: trust AI fields when present, else keep the heuristic's.
        return {
          title: parsed.title || heuristic.title,
          projectId: parsed.projectId != null ? parsed.projectId : heuristic.projectId,
          assignee: parsed.assignee || heuristic.assignee,
          prio: parsed.prio || heuristic.prio,
          due: parsed.due || heuristic.due,
        };
      })();
      // Resolve in ≤2.5s: AI if it's quick, otherwise the instant heuristic.
      return ai.withTimeout(aiCall, 2500, heuristic);
    },

    // Deterministic, instant task parser — no network. Extracts project (by
    // name match), assignee (team first-name match), priority (keywords) and a
    // due date (today/tomorrow/weekday/"by Friday"/DD Mon) from plain English.
    heuristicTask: (text) => {
      const t = String(text || '').trim();
      const low = t.toLowerCase();
      // Project: match any known project name token
      let projectId = null;
      for (const p of state.projects) {
        const words = p.name.toLowerCase().split(/[\s,–-]+/).filter(w => w.length > 3);
        if (words.some(w => low.includes(w))) { projectId = p.id; break; }
      }
      // Assignee: match a team member's first name; else "You"
      let assignee = 'You';
      for (const m of state.team) {
        const first = (m.n || '').split(' ')[0];
        if (first && new RegExp('\\b' + first.toLowerCase() + '\\b').test(low)) { assignee = first; break; }
      }
      // Priority
      let prio = 'med';
      if (/\b(urgent|asap|high prio\w*|critical|important|today|immediately)\b/.test(low)) prio = 'high';
      else if (/\b(low prio\w*|whenever|sometime|eventually|no rush)\b/.test(low)) prio = 'low';
      // Due date
      let due = null;
      const now = new Date();
      const iso = (d) => d.toISOString().slice(0, 10);
      const addDays = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      if (/\btoday\b/.test(low)) due = iso(now);
      else if (/\btomorrow\b/.test(low)) due = iso(addDays(1));
      else if (/\bnext week\b/.test(low)) due = iso(addDays(7));
      else {
        const dm = days.findIndex(d => new RegExp('\\b' + d + '\\b').test(low));
        if (dm >= 0) { let delta = (dm - now.getDay() + 7) % 7; if (delta === 0) delta = 7; due = iso(addDays(delta)); }
        else {
          // "12 May" / "12th May" style
          const m = low.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
          if (m) {
            const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            const d = new Date(now.getFullYear(), months.indexOf(m[2]), parseInt(m[1]));
            if (d < now) d.setFullYear(now.getFullYear() + 1);
            due = iso(d);
          }
        }
      }
      // Title: strip leading priority/filler words, capitalise
      let title = t.replace(/\b(high prio\w*|urgent|asap|please|pls)\b[:,\s]*/gi, '').trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
      return { title: title || t, projectId, assignee, prio, due };
    },

    // Draft an invoice chase email
    draftChase: async (invoiceId) => {
      const inv = state.invoices.find(i => i.id === invoiceId);
      if (!inv) return null;
      const prompt = `Draft a brief polite chase email to ${inv.client} about overdue invoice ${inv.id} for £${inv.amount.toLocaleString()} (issued ${inv.issued}, due ${inv.due}). UK English, professional but warm, 3 short paragraphs, sign as "Adrian Stanca, CortexBuild Ltd". Reply with the email body only, no subject line.`;
      const fallback = `Hi ${inv.client},\n\nI hope you're well. I wanted to gently follow up on invoice ${inv.id} for £${inv.amount.toLocaleString()}, which was issued on ${inv.issued} and became due on ${inv.due}.\n\nIf payment is already on its way, please disregard this note — otherwise I'd be grateful if you could let me know when we can expect it, or flag any queries so we can resolve them quickly.\n\nMany thanks for your help.\n\nAdrian Stanca\nCortexBuild Ltd`;
      return ai.withTimeout(ai.ask('', { system: prompt }), 3500, fallback);
    },

    // Daily decisions — 2-3 things needing approval. Races AI against a 3s cap;
    // falls back to decisions computed from the live state so the desk is never
    // empty when AI is slow/offline.
    decisions: async () => {
      const prompt = `${SYS_BASE(state)}\n\nLooking at the live state, surface 3 concrete decisions Adrian should make today. Reply ONLY with JSON array: [{"q":"…short question…","ctx":"…1 sentence why…","approve":"Approve label","reject":"Reject label","kind":"approval|schedule|finance"}]`;
      const aiCall = (async () => {
        const raw = await window.claude.complete({ messages: [{ role: 'user', content: prompt }] });
        const json = raw.match(/\[[\s\S]*\]/)?.[0];
        const arr = JSON.parse(json);
        return (Array.isArray(arr) && arr.length) ? arr : ai.localDecisions();
      })();
      return ai.withTimeout(aiCall, 3000, ai.localDecisions());
    },

    // Deterministic "decisions" from live data — instant, offline.
    localDecisions: () => {
      const out = [];
      const overdue = state.invoices.filter(i => i.status === 'overdue' || (i.due && new Date(i.due) < new Date() && i.status !== 'paid'));
      if (overdue.length) {
        const top = overdue.sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
        out.push({ q: `Chase ${top.client} for £${(top.amount || 0).toLocaleString()}?`, ctx: `Invoice ${top.id} is overdue (due ${top.due}).`, approve: 'Send chase', reject: 'Later', kind: 'finance' });
      }
      const quoting = state.projects.filter(p => p.status === 'quoting');
      if (quoting.length) {
        const p = quoting[0];
        out.push({ q: `Follow up the ${p.name} quote?`, ctx: `Still at quoting stage — worth £${(p.value || 0).toLocaleString()}.`, approve: 'Follow up', reject: 'Hold', kind: 'approval' });
      }
      const hi = state.tasks.filter(t => (t.prio === 'high') && !t.done);
      if (hi.length) {
        out.push({ q: `Assign "${hi[0].t || hi[0].title}" now?`, ctx: `${hi.length} high-priority task${hi.length > 1 ? 's' : ''} still open.`, approve: 'Assign', reject: 'Skip', kind: 'schedule' });
      }
      return out.slice(0, 3);
    },
  };

  // Expose sync hooks at the top level too — cloud-sync.js calls them as
  // Backend.mergeRemote / Backend.pullRemote (not under .db).
  return { db, computed, ai, mergeRemote: db.mergeRemote, pullRemote: db.pullRemote };
})();

// ── React hooks for the backend ──────────────────────────
function useDB(table) {
  const [items, setItems] = React.useState(
    table === 'user' || table === 'settings'
      ? Backend.db[table].getSync()
      : Backend.db[table].listSync()
  );
  React.useEffect(() => {
    const unsub = Backend.db.subscribe(() => {
      setItems(
        table === 'user' || table === 'settings'
          ? Backend.db[table].getSync()
          : Backend.db[table].listSync()
      );
    });
    return unsub;
  }, [table]);
  return items;
}

function useComputed(key) {
  const fn = Backend.computed[key];
  const [val, setVal] = React.useState(fn());
  React.useEffect(() => {
    const unsub = Backend.db.subscribe(() => setVal(fn()));
    return unsub;
  }, [key]);
  return val;
}

Object.assign(window, { Backend, useDB, useComputed });
