// Cortexx — Phase 34: Real charts in Reports (SVG, no deps)

function LineChart({ data, width = 320, height = 140, color = '#10b981', accent = '#2563eb' }) {
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => d.v));
  const min = Math.min(...data.map(d => d.v), 0);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const yFor = v => padding.top + h - ((v - min) / range) * h;
  const xFor = i => padding.left + i * stepX;
  const points = data.map((d, i) => `${xFor(i)},${yFor(d.v)}`).join(' ');
  const area = `${xFor(0)},${padding.top + h} ${points} ${xFor(data.length - 1)},${padding.top + h}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => min + range * p);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.reverse().map((t, i) => (
        <g key={i}>
          <line x1={padding.left} x2={padding.left + w} y1={yFor(t)} y2={yFor(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          <text x={padding.left - 6} y={yFor(t)+3} fontSize="9" fontFamily="SF Mono, monospace" fill="rgba(142,168,197,0.6)" textAnchor="end">£{(t/1000).toFixed(0)}k</text>
        </g>
      ))}
      <polyline points={area} fill="url(#areaG)" stroke="none"/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (
        <g key={i}>
          {i % Math.ceil(data.length / 6) === 0 && (
            <text x={xFor(i)} y={height - 6} fontSize="9" fontFamily="SF Mono, monospace" fill="rgba(82,116,154,0.8)" textAnchor="middle">{d.l}</text>
          )}
          {i === data.length - 1 && (
            <>
              <circle cx={xFor(i)} cy={yFor(d.v)} r="10" fill={color} opacity="0.2"/>
              <circle cx={xFor(i)} cy={yFor(d.v)} r="4" fill={color}/>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data, width = 320, height = 160 }) {
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => d.v));
  const barW = (w / data.length) * 0.6;
  const gap = (w / data.length) * 0.4;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const bh = (d.v / max) * h;
        const x = padding.left + i * (barW + gap) + gap / 2;
        const y = padding.top + h - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={d.c || '#2563eb'} opacity="0.85"/>
            <text x={x + barW/2} y={y - 4} fontSize="9" fontFamily="SF Mono, monospace" fill="rgba(238,243,250,0.9)" textAnchor="middle" fontWeight="700">£{(d.v/1000).toFixed(0)}k</text>
            <text x={x + barW/2} y={height - 12} fontSize="9" fontFamily="-apple-system" fill="rgba(142,168,197,0.7)" textAnchor="middle">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Replace the Reports KPI strip with real charts after the original strip
function ReportsCharts({ accent }) {
  const projects = useDB('projects');
  const invoices = useDB('invoices');
  const receipts = useDB('receipts');
  // REAL 12-week cashflow — paid invoice income minus receipt spend per ISO week,
  // derived from the live store. Weeks with no dated records plot as 0.
  const cashTrend = (() => {
    const now = new Date();
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 6);
      weeks.push({ start, end, v: 0, l: 'Wk' + (Math.ceil(((end - new Date(end.getFullYear(), 0, 1)) / 86400000 + 1) / 7)) });
    }
    const inRange = (ds, w) => { const d = new Date(ds); return d >= w.start && d <= w.end; };
    for (const inv of invoices) {
      const ds = inv.paidDate || inv.paid_on || inv.date || inv.due;
      if (!ds || (inv.status && !/paid|sent/.test(String(inv.status)))) continue;
      const w = weeks.find(w => inRange(ds, w));
      if (w) w.v += Number(inv.amount) || 0;
    }
    for (const r of receipts) {
      if (!r.date) continue;
      const w = weeks.find(w => inRange(r.date, w));
      if (w) w.v -= Number(r.amount) || 0;
    }
    return weeks.map(w => ({ l: w.l, v: Math.round(w.v) }));
  })();
  const projBars = projects.filter(p => p.value > 0).map(p => ({
    l: p.name.split(' ')[0], v: p.value, c: STATUS_C[p.status] || accent,
  }));
  return (
    <>
      <Section title="Cashflow · last 12 weeks">
        <div style={{ background: T.bg2, borderRadius: 14, padding: 12, border: `0.5px solid ${T.hair}` }}>
          <LineChart data={cashTrend} width={320} height={140} color={T.green}/>
        </div>
      </Section>
      <Section title="Project values">
        <div style={{ background: T.bg2, borderRadius: 14, padding: 12, border: `0.5px solid ${T.hair}` }}>
          <BarChart data={projBars} width={320} height={160}/>
        </div>
      </Section>
    </>
  );
}

Object.assign(window, { LineChart, BarChart, ReportsCharts });
