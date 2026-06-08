// Cortexx — Global side menu (hamburger + slide-out drawer)
// Lives at the app-shell level so it's reachable on every page. Opens a
// categorised drawer of the whole app; every row routes through the global
// window.cortexxNav(key[, payload]) dispatcher. Tabs use ('tab', <id>).

function GlobalSideMenu({ accent = T.blue }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');

  // Expose an imperative opener so any screen can pop the menu.
  React.useEffect(() => {
    window.cortexxOpenMenu = () => setOpen(true);
    window.cortexxCloseMenu = () => setOpen(false);
    return () => { delete window.cortexxOpenMenu; delete window.cortexxCloseMenu; };
  }, []);

  // Esc closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (k, payload) => {
    setOpen(false);
    setTimeout(() => { try { window.cortexxNav(k, payload); } catch (e) {} }, 170);
  };

  const SECTIONS = [
    { h: 'Workspace', items: [
      { l: 'Dashboard', i: Ic.dashboard, k: 'tab', p: 'dashboard' },
      { l: 'Projects', i: Ic.projects, k: 'tab', p: 'projects' },
      { l: 'Tasks', i: Ic.tasks, k: 'tab', p: 'tasks' },
      { l: 'Team', i: Ic.team, k: 'tab', p: 'team' },
      { l: 'Money', i: Ic.money, k: 'money' },
      { l: 'Safety', i: Ic.safety, k: 'safety' },
    ] },
    { h: 'Site & field', items: [
      { l: 'On site now', i: Ic.pin, k: 'attendance' },
      { l: 'NFC site tags', i: Ic.flag, k: 'nfctags' },
      { l: 'Site map', i: Ic.pin, k: 'sitemap' },
      { l: 'Site diary', i: Ic.book, k: 'diary' },
      { l: 'Snags', i: Ic.alert, k: 'snags' },
      { l: 'RFIs', i: Ic.inbox, k: 'rfis' },
      { l: 'Drawings', i: Ic.layers, k: 'drawings' },
      { l: 'Photos', i: Ic.camera, k: 'photos' },
    ] },
    { h: 'Commercial', items: [
      { l: 'Quotes', i: Ic.doc, k: 'quotes' },
      { l: 'Purchase orders', i: Ic.receipt, k: 'pos' },
      { l: 'Change orders', i: Ic.edit, k: 'changes' },
      { l: 'Materials', i: Ic.box, k: 'materials' },
      { l: 'Subcontractors', i: Ic.team, k: 'subs' },
      { l: 'Reports', i: Ic.trend, k: 'reports' },
    ] },
    { h: 'Intelligence', items: [
      { l: 'AI assistant', i: Ic.spark, k: 'ai' },
      { l: 'Inbox triage', i: Ic.inbox, k: 'inbox' },
      { l: 'Vera autopilot', i: Ic.bot, k: 'vera' },
      { l: 'CEO persona', i: Ic.briefcase, k: 'personas' },
      { l: 'Performance', i: Ic.trend, k: 'performance' },
    ] },
    { h: 'People & time', items: [
      { l: 'Timesheets', i: Ic.clock, k: 'time' },
      { l: 'Check in / out', i: Ic.clock, k: 'clock' },
      { l: 'Live status', i: Ic.team, k: 'livestatus' },
      { l: 'Mileage', i: Ic.truck, k: 'mileage' },
      { l: 'Payroll', i: Ic.money, k: 'payroll' },
      { l: 'Training', i: Ic.hardhat, k: 'training' },
    ] },
    { h: 'Documents', items: [
      { l: 'Documents', i: Ic.doc, k: 'docs' },
      { l: 'Templates', i: Ic.copy, k: 'templates' },
      { l: 'Forms', i: Ic.list, k: 'forms' },
      { l: 'Upload', i: Ic.upload, k: 'upload' },
      { l: 'Database', i: Ic.archive, k: 'database' },
    ] },
    { h: 'Settings', items: [
      { l: 'Settings', i: Ic.cog, k: 'settings' },
      { l: 'Cloud sync', i: Ic.cloud, k: 'cloudsync' },
      { l: 'Diagnostics', i: Ic.activity || Ic.shield, k: 'diagnostics' },
      { l: 'Audit log', i: Ic.shield, k: 'auditlog' },
      { l: 'Admin', i: Ic.team, k: 'admin' },
      { l: 'Help', i: Ic.book, k: 'help' },
    ] },
  ];

  // Search filter across all items.
  const ql = q.trim().toLowerCase();
  const filtered = SECTIONS.map(s => ({
    h: s.h,
    items: s.items.filter(it => !ql || it.l.toLowerCase().includes(ql)),
  })).filter(s => s.items.length);

  const ICON = (i) => i ? React.cloneElement(i, { size: 18 }) : null;

  return React.createElement(React.Fragment, null,
    // ── Hamburger button: top-left, below the status bar. z above content,
    //    below sheets so it never fights a sheet's Back button. ──
    React.createElement('button', {
      'aria-label': 'Open menu', onClick: () => setOpen(true),
      style: {
        position: 'absolute', top: 49, left: 12, zIndex: 9,
        width: 38, height: 38, borderRadius: 12,
        background: 'rgba(10,18,30,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: `0.5px solid ${T.hair}`, color: T.t1, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3.5,
      },
    },
      React.createElement('span', { style: { width: 16, height: 2, borderRadius: 2, background: T.t1 } }),
      React.createElement('span', { style: { width: 16, height: 2, borderRadius: 2, background: T.t1 } }),
      React.createElement('span', { style: { width: 16, height: 2, borderRadius: 2, background: T.t1 } })),

    // ── Drawer overlay (above everything, incl. sheets) ──
    open && React.createElement('div', {
      onClick: () => setOpen(false),
      style: { position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', animation: 'cxMenuFade .2s' },
    },
      React.createElement('div', {
        onClick: (e) => e.stopPropagation(),
        style: {
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 290, maxWidth: '85%',
          background: T.bg1, borderRight: `0.5px solid ${T.hairMid}`,
          display: 'flex', flexDirection: 'column', animation: 'cxMenuSlide .26s cubic-bezier(0.2,0.8,0.2,1)',
          boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
        },
      },
        // Header
        React.createElement('div', { style: { padding: '46px 16px 12px', display: 'flex', alignItems: 'center', gap: 11 } },
          React.createElement('div', { style: { width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${accent}, ${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' } }, React.cloneElement(Ic.spark, { size: 18 })),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontFamily: SF, fontSize: 16, fontWeight: 750, color: T.t1, letterSpacing: -0.3 } }, 'Cortexx'),
            React.createElement('div', { style: { fontFamily: SF, fontSize: 11, color: T.t3 } }, 'cortexbuildpro.com')),
          React.createElement('button', { 'aria-label': 'Close', onClick: () => setOpen(false), style: { width: 30, height: 30, borderRadius: 15, background: T.bg2, border: `0.5px solid ${T.hair}`, color: T.t2, cursor: 'pointer', fontSize: 16, lineHeight: 1 } }, '✕')),
        // Search
        React.createElement('div', { style: { padding: '4px 16px 10px' } },
          React.createElement('input', {
            value: q, onChange: (e) => setQ(e.target.value), placeholder: 'Search menu…',
            style: { width: '100%', boxSizing: 'border-box', background: T.bg2, border: `0.5px solid ${T.hairMid}`, borderRadius: 10, padding: '9px 12px', color: T.t1, fontFamily: SF, fontSize: 13.5, outline: 'none' },
          })),
        // Scrollable list
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '4px 10px 24px' } },
          filtered.length === 0
            ? React.createElement('div', { style: { padding: 24, textAlign: 'center', fontFamily: SF, fontSize: 13, color: T.t3 } }, 'No matches')
            : filtered.map((s) => React.createElement('div', { key: s.h, style: { marginBottom: 6 } },
                React.createElement('div', { style: { fontFamily: SF, fontSize: 10.5, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: 0.7, padding: '12px 10px 5px' } }, s.h),
                s.items.map((it) => React.createElement('button', {
                  key: it.l, onClick: () => go(it.k, it.p),
                  style: {
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 9,
                    background: 'transparent', border: 'none', color: T.t1, cursor: 'pointer', textAlign: 'left',
                    fontFamily: SF, fontSize: 14, fontWeight: 550,
                  },
                  onMouseEnter: (e) => { e.currentTarget.style.background = T.bg2; },
                  onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
                },
                  React.createElement('span', { style: { color: accent, display: 'flex', width: 20, justifyContent: 'center' } }, ICON(it.i)),
                  React.createElement('span', { style: { flex: 1 } }, it.l))))))),
      React.createElement('style', null, '@keyframes cxMenuFade{from{opacity:0}to{opacity:1}}@keyframes cxMenuSlide{from{transform:translateX(-100%)}to{transform:translateX(0)}}')));
}

Object.assign(window, { GlobalSideMenu });
