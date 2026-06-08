// CortexBuild Admin — app shell (sidebar + topbar + routing)
const AT_A = window.AT;

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'workspaces', label: 'Workspaces', icon: 'building' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'billing', label: 'Billing', icon: 'card' },
  { id: 'system', label: 'System Health', icon: 'activity' },
  { id: 'flags', label: 'Feature Flags', icon: 'flag' },
  { id: 'audit', label: 'Audit Log', icon: 'shield' },
];

function AdminApp() {
  const [route, setRoute] = React.useState(() => (location.hash.replace('#', '') || 'overview'));
  const [toastPush, toastNode] = useToast();

  React.useEffect(() => {
    const onHash = () => setRoute(location.hash.replace('#', '') || 'overview');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (id) => { location.hash = id; setRoute(id); };

  const m = AdminStore.metrics();
  const current = NAV.find((n) => n.id === route) || NAV[0];

  const VIEWS = {
    overview: OverviewView, workspaces: WorkspacesView, users: UsersView,
    projects: ProjectsView,
    billing: BillingView, system: SystemView, flags: FlagsView, audit: AuditView,
  };
  const View = VIEWS[route] || OverviewView;

  // Sidebar
  const sidebar = React.createElement('div', { style: {
    width: 244, flexShrink: 0, background: AT_A.sidebar, borderRight: `1px solid ${AT_A.hair}`,
    display: 'flex', flexDirection: 'column', padding: '20px 14px',
  } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 20px' } },
      React.createElement('div', { style: { width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${AT_A.blue}, ${AT_A.purple})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 17, fontFamily: AT_A.sans } }, 'C'),
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 14.5, fontWeight: 760, color: AT_A.t1, fontFamily: AT_A.sans, lineHeight: 1.1 } }, 'CortexBuild'),
        React.createElement('div', { style: { fontSize: 10.5, color: AT_A.t3, fontFamily: AT_A.mono, letterSpacing: 0.5 } }, 'ADMIN CONSOLE'))),
    React.createElement('nav', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
      NAV.map((n) => {
        const active = route === n.id;
        return React.createElement('button', { key: n.id, onClick: () => go(n.id), style: {
          display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9,
          background: active ? AT_A.blueDim : 'transparent', color: active ? AT_A.blueL : AT_A.t2,
          border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: active ? 660 : 560, fontFamily: AT_A.sans,
          textAlign: 'left', transition: 'background .12s',
        },
          onMouseEnter: (e) => { if (!active) e.currentTarget.style.background = AT_A.hover; },
          onMouseLeave: (e) => { if (!active) e.currentTarget.style.background = 'transparent'; },
        }, React.createElement(Icon, { name: n.icon, size: 17 }), n.label);
      })),
    React.createElement('div', { style: { flex: 1 } }),
    React.createElement('div', { style: { padding: '12px', borderRadius: 10, background: AT_A.card, border: `1px solid ${AT_A.hair}` } },
      React.createElement('div', { style: { fontSize: 11, color: AT_A.t3, fontFamily: AT_A.sans } }, 'MRR'),
      React.createElement('div', { style: { fontSize: 18, fontWeight: 740, color: AT_A.t1, fontFamily: AT_A.sans } }, fmtGBP(m.mrr)),
      React.createElement('div', { style: { fontSize: 11, color: AT_A.green, fontFamily: AT_A.sans, marginTop: 2 } }, m.active + ' active workspaces')),
    React.createElement('a', { href: 'Cortexx.html', style: { display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', marginTop: 8, color: AT_A.t3, fontSize: 12.5, fontFamily: AT_A.sans, textDecoration: 'none' } },
      React.createElement(Icon, { name: 'external', size: 15 }), 'Open mobile app'));

  // Topbar
  const topbar = React.createElement('div', { style: {
    height: 62, flexShrink: 0, borderBottom: `1px solid ${AT_A.hair}`, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 28px', background: AT_A.bg1,
  } },
    React.createElement('div', null,
      React.createElement('div', { style: { fontSize: 18, fontWeight: 740, color: AT_A.t1, fontFamily: AT_A.sans } }, current.label),
      React.createElement('div', { style: { fontSize: 12, color: AT_A.t3, fontFamily: AT_A.sans } }, 'Platform administration · cortexbuildpro.com')),
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
      React.createElement(Btn, { size: 'sm', kind: 'ghost', icon: 'refresh', onClick: () => { if (confirm('Reset all admin data to seed?')) { AdminStore.reset(); toastPush('Data reset to seed', 'info'); } } }, 'Reset data'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 9, padding: '6px 12px 6px 6px', background: AT_A.card, borderRadius: 22, border: `1px solid ${AT_A.hair}` } },
        React.createElement('div', { style: { width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${AT_A.blue}, ${AT_A.cyan})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: AT_A.sans } }, 'AS'),
        React.createElement('span', { style: { fontSize: 13, color: AT_A.t1, fontFamily: AT_A.sans, fontWeight: 600 } }, 'Adrian Stanca'))));

  return React.createElement('div', { style: { display: 'flex', height: '100vh', background: AT_A.bg0 } },
    sidebar,
    React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 } },
      topbar,
      React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: 28 } },
        React.createElement(View, { toast: toastPush }))),
    toastNode);
}

window.AdminApp = AdminApp;
