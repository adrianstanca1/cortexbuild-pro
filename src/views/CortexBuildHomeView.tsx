import React, { useState, useEffect } from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import { BentoCard } from '@/components/BentoCard';
import {
  ArrowRight, Zap, Shield, BrainCircuit, Rocket, Cpu, Globe,
  BarChart3, Users2, Lock, Layers, ChevronRight, PlayCircle,
  CheckCircle2, TrendingUp, Clock, DollarSign, Target, Award, Building2,
  HardHat, Wrench, FileText, Activity, Sparkles, ArrowUpRight,
  CircleDot, Timer, PieChart, Gauge, MousePointerClick, Workflow
} from 'lucide-react';

/* ─── Animated counter hook ────────────────────────────────────────────────── */
const useCounter = (end: number, duration = 2000, suffix = '') => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count: `${count}${suffix}`, ref: (el: HTMLDivElement | null) => {
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
  }};
};

/* ─── Rotating headline words ──────────────────────────────────────────────── */
const RotatingWord: React.FC<{ words: string[] }> = ({ words }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % words.length), 3000); return () => clearInterval(t); }, [words.length]);
  return (
    <span className="relative inline-block min-w-[280px] sm:min-w-[360px]">
      {words.map((w, i) => (
        <span key={w} className={`absolute left-0 transition-all duration-700 ${i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
          {w}
        </span>
      ))}
      {/* invisible spacer */}
      <span className="invisible">{words.reduce((a, b) => a.length >= b.length ? a : b, '')}</span>
    </span>
  );
};

/* ─── Floating live stat card ──────────────────────────────────────────────── */
const FloatingStat: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; delay: string; position: string }> = ({ icon, label, value, color, delay, position }) => (
  <div className={`absolute ${position} bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-gray-100 flex items-center gap-3 animate-float z-20`} style={{ animationDelay: delay }}>
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
    <div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════ */

const CortexBuildHomeView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const stat1 = useCounter(500, 2000, '+');
  const stat2 = useCounter(99, 1600, '.4%');
  const stat3 = useCounter(40, 1400, '%');
  const stat4 = useCounter(10, 1200, 'x');

  return (
    <PublicLayout currentPage={Page.CORTEX_BUILD_HOME} setPage={setPage}>
      {/* ═══ INLINE ANIMATION STYLES ═══ */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulse-ring { 0%{transform:scale(.8);opacity:.5} 50%{transform:scale(1);opacity:1} 100%{transform:scale(.8);opacity:.5} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .animate-float{animation:float 4s ease-in-out infinite}
        .animate-marquee{animation:marquee 30s linear infinite}
        .animate-gradient{background-size:200% 200%;animation:gradient-shift 6s ease infinite}
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
           HERO SECTION — Immersive
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden">
        {/* Multi-layer background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-500/[0.04] rounded-full blur-[160px] -mr-80 -mt-60" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/[0.04] rounded-full blur-[140px] -ml-40 -mb-40" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Copy */}
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-xl border border-indigo-100/80 shadow-lg shadow-indigo-500/[0.06] text-indigo-700 text-xs font-black uppercase tracking-wider mb-8">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                v2.0 Architecture &bull; Now Live &bull; AI-Powered
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-black text-gray-900 tracking-tight leading-[1.08] mb-8">
                Construction
                <br />
                Intelligence For
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 animate-gradient">
                  <RotatingWord words={['Faster Delivery.', 'Smarter Teams.', 'Bigger Margins.', 'Zero Guesswork.']} />
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed mb-10 max-w-xl">
                The AI operating system that predicts risks before they happen, automates 80% of admin,
                and turns every project into a profit machine.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
                <button
                  onClick={() => setPage(Page.GET_STARTED)}
                  className="group w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  Start Free &mdash; No Card Required <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setPage(Page.NEURAL_NETWORK)}
                  className="w-full sm:w-auto bg-white text-gray-900 border border-gray-200 hover:border-indigo-300 px-8 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-lg"
                >
                  <PlayCircle size={20} className="text-indigo-600" /> See It Live
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2.5">
                    {['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981'].map((c, i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-[2.5px] border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ background: c }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-gray-600 font-semibold">500+ enterprises</span>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-500">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="text-gray-600 font-semibold ml-1.5">4.9/5 from 420+ reviews</span>
                </div>
              </div>
            </div>

            {/* Right — Interactive Dashboard Preview */}
            <div className="relative hidden lg:block">
              {/* Floating stat cards */}
              <FloatingStat icon={<TrendingUp size={18} className="text-emerald-600" />} label="Revenue" value="+34% this quarter" color="bg-emerald-100" delay="0s" position="top-4 -left-8" />
              <FloatingStat icon={<Shield size={18} className="text-blue-600" />} label="Safety Score" value="98.7% compliant" color="bg-blue-100" delay="1.2s" position="top-16 -right-4" />
              <FloatingStat icon={<Activity size={18} className="text-violet-600" />} label="AI Prediction" value="No delays detected" color="bg-violet-100" delay="2.4s" position="bottom-12 -left-4" />

              {/* Main dashboard mockup */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-900/10 border border-gray-100 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4 bg-gray-200/80 rounded-lg py-1.5 px-3 text-xs text-gray-500 font-medium">
                    app.cortexbuild.pro/dashboard
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6 space-y-4">
                  {/* Top stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Active Projects', value: '12', change: '+2', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Tasks Due Today', value: '47', change: '-8', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Team Online', value: '23', change: '+5', color: 'text-violet-600', bg: 'bg-violet-50' },
                      { label: 'Budget Health', value: '94%', change: '+3%', color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-3`}>
                        <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">{s.label}</div>
                        <div className={`text-[10px] font-bold mt-1 ${s.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{s.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart area placeholder */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue vs Costs</span>
                      <span className="text-[10px] font-medium text-gray-500">Last 6 months</span>
                    </div>
                    <div className="flex items-end gap-2 h-24">
                      {[45, 60, 55, 70, 65, 82, 78, 90, 85, 95, 88, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5">
                          <div className={`rounded-sm ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-indigo-200'}`} style={{ height: `${h}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI insight bar */}
                  <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                    <BrainCircuit size={18} className="text-indigo-600 flex-shrink-0" />
                    <div className="text-xs text-indigo-700 font-medium">
                      <span className="font-bold">AI Insight:</span> Project &quot;Riverside Tower&quot; predicted to complete 4 days early. Consider reallocating 2 crew members to &quot;Bridge Renewal&quot;.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           TRUSTED-BY MARQUEE
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-white border-y border-gray-100 overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Trusted by leading construction firms across the UK</p>
        </div>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, dupeIdx) => (
            <div key={dupeIdx} className="flex items-center gap-16 px-8">
              {['AS Cladding & Roofing', 'Rolling Solutions', 'SM Glass Ltd', 'BuildTech Global', 'Titan Construction', 'Summit Builders', 'Apex Developments', 'Crown Infrastructure'].map((name, i) => (
                <div key={`${dupeIdx}-${i}`} className="flex items-center gap-2.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <Building2 size={20} />
                  <span className="text-sm font-bold whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           HOW IT WORKS — 3 Steps
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              <MousePointerClick size={14} /> Simple to Start
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Live in 3 Minutes. <span className="text-indigo-600">Seriously.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">No consultants. No setup fees. No six-month implementation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-20 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200" />

            {[
              { step: '01', icon: Rocket, title: 'Sign Up & Import', desc: 'Create your account, invite your team, and import existing project data in minutes. We support CSV, Excel, and direct API sync.', color: 'from-indigo-600 to-indigo-700' },
              { step: '02', icon: BrainCircuit, title: 'AI Learns Your Business', desc: 'Our neural engine analyses your projects, spending patterns, and team dynamics to build a predictive model unique to your company.', color: 'from-violet-600 to-purple-700' },
              { step: '03', icon: TrendingUp, title: 'Watch Profits Grow', desc: 'Get real-time insights, automated alerts, and AI recommendations that consistently reduce costs and eliminate delays.', color: 'from-blue-600 to-cyan-700' },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                <div className={`w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform relative z-10`}>
                  <item.icon className="text-white" size={28} />
                </div>
                <div className="text-6xl font-black text-gray-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           FEATURES GRID — Enhanced
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles size={14} /> Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-6">
              Everything You Need.
              <span className="text-indigo-600"> Nothing You Don&apos;t.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto font-medium">
              A complete platform designed for construction excellence, from the ground up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: 'AI Neural Engine', desc: 'Predictive analytics that forecast delays, cost overruns, and resource conflicts weeks before they happen.', metric: '99.4% accuracy', color: 'indigo' },
              { icon: TrendingUp, title: 'Real-Time Insights', desc: 'Live dashboards with drill-down analytics, custom KPIs, and instant push notifications.', metric: '< 200ms updates', color: 'blue' },
              { icon: Shield, title: 'Enterprise Security', desc: 'SOC2 Type II certified. Military-grade AES-256 encryption with dedicated tenant isolation.', metric: 'Zero breaches', color: 'green' },
              { icon: Zap, title: 'Seamless Integrations', desc: 'Native connectors for Xero, QuickBooks, Sage, Procore, and 100+ construction tools.', metric: '100+ connectors', color: 'purple' },
              { icon: Globe, title: 'Global Scale', desc: 'Multi-region deployment with 99.99% uptime SLA, edge caching, and CDN-accelerated delivery.', metric: '99.99% uptime', color: 'cyan' },
              { icon: Workflow, title: 'Smart Automation', desc: 'Automated approvals, invoice matching, compliance reminders, and payroll processing.', metric: '80% less admin', color: 'orange' },
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`text-${feature.color}-600`} size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-4">{feature.desc}</p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold text-${feature.color}-600 bg-${feature.color}-50 px-3 py-1.5 rounded-full`}>
                  <CircleDot size={10} /> {feature.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           STATS SECTION — With Counters
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.12),transparent)]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Proven Performance. <span className="text-indigo-400">Measurable Results.</span>
            </h2>
            <p className="text-lg text-gray-400">Numbers that matter to your bottom line.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { ...stat1, label: 'Enterprise Clients', icon: Building2 },
              { ...stat2, label: 'Prediction Accuracy', icon: Target },
              { ...stat3, label: 'Cost Reduction', icon: DollarSign },
              { ...stat4, label: 'Faster Reporting', icon: Clock },
            ].map((s, idx) => (
              <div key={idx} className="text-center" ref={s.ref}>
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
                  <s.icon className="text-indigo-400" size={32} />
                </div>
                <div className="text-4xl sm:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">{s.count}</div>
                <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           BENTO GRID — Enhanced
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              The Platform <span className="text-indigo-600">Inside Out</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6">
            <BentoCard
              title="The Neural Core"
              description="State-of-the-art AI engine that transforms fragmented construction data into strategic intelligence."
              variant="hero"
              icon={BrainCircuit}
              className="md:col-span-4 lg:col-span-8 min-h-[400px]"
            >
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black mb-1 text-white">99.4%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80">Accuracy</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black mb-1 text-white">-40%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80">Overhead</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black mb-1 text-white">24ms</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80">Latency</div>
                </div>
              </div>
            </BentoCard>

            <BentoCard
              title="Portfolio Scale"
              description="From a single site to 500+ global operations. Managed centrally with real-time oversight."
              icon={Layers}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            />

            <BentoCard
              title="UK Compliance Built-In"
              description="CDM 2015, HMRC MTD, CIS deductions, VAT returns, and HSE reporting out of the box."
              icon={Shield}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            />

            <BentoCard
              title="Developer OS"
              description="Built on open primitives. REST & GraphQL APIs. Webhooks. Custom integrations in minutes."
              variant="dark"
              icon={Cpu}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            >
              <div className="bg-gray-950/50 rounded-lg p-4 font-mono text-xs text-gray-400 mt-4 border border-white/5">
                <div className="text-emerald-400">const project = await cortex</div>
                <div className="text-indigo-400 ml-2">.projects.create({'{'}</div>
                <div className="text-amber-400 ml-4">name: &apos;Tower Bridge Phase 2&apos;,</div>
                <div className="text-amber-400 ml-4">budget: 2_400_000,</div>
                <div className="text-indigo-400 ml-2">{'}'})</div>
              </div>
            </BentoCard>

            <BentoCard
              title="Edge Velocity"
              description="Real-time WebSockets, push notifications, and event-driven architecture across every module."
              icon={Zap}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           ROI IMPACT SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6">
                <PieChart size={14} /> Return on Investment
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-6">
                Companies See ROI in <span className="text-indigo-600">30 Days</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-10">
                Our customers consistently report dramatic improvements within the first month.
                Here&apos;s what the data shows across 500+ implementations.
              </p>

              <div className="space-y-6">
                {[
                  { label: 'Admin Time Saved', value: '60%', width: '60%', color: 'bg-indigo-600' },
                  { label: 'Cost Overrun Reduction', value: '45%', width: '45%', color: 'bg-violet-600' },
                  { label: 'On-Time Delivery Improvement', value: '38%', width: '38%', color: 'bg-blue-600' },
                  { label: 'Safety Incident Reduction', value: '72%', width: '72%', color: 'bg-emerald-600' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">{item.label}</span>
                      <span className="text-sm font-black text-gray-900">{item.value}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="relative">
                <Gauge size={48} className="text-indigo-200 mb-6" />
                <h3 className="text-3xl font-black mb-4">Average Savings</h3>
                <div className="text-6xl font-black mb-2">$347K</div>
                <p className="text-indigo-200 text-lg mb-8">per company per year</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-black">4.2x</div>
                    <div className="text-xs text-indigo-200 font-medium">Avg ROI Multiple</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-black">28 days</div>
                    <div className="text-xs text-indigo-200 font-medium">Time to Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           TESTIMONIALS — Enhanced
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Award size={14} /> Customer Stories
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Trusted By Industry Leaders
            </h2>
            <p className="text-lg text-gray-500">See what our customers are building.</p>
          </div>

          {/* Featured testimonial */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 lg:p-14 text-white relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-40 -mt-40" />
            <div className="relative grid lg:grid-cols-[1fr,auto] gap-10 items-center">
              <div>
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="w-6 h-6 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xl lg:text-2xl italic leading-relaxed mb-8 font-medium">
                  &quot;CortexBuild Pro transformed our operations. We eliminated paperwork, cut admin by 60%, and now have real-time visibility across every project. It&apos;s exactly what UK construction needed.&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-black border-2 border-white/30">AS</div>
                  <div>
                    <div className="font-bold text-lg">Adrian Stanca</div>
                    <div className="text-indigo-200">Director & Owner, AS Cladding And Roofing Ltd</div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex flex-col gap-3 text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                  <div className="text-3xl font-black">-60%</div>
                  <div className="text-xs text-indigo-200">Admin Time</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                  <div className="text-3xl font-black">2x</div>
                  <div className="text-xs text-indigo-200">Project Throughput</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "The AI predictions are incredibly accurate. We've eliminated project delays entirely.", author: "Marcus Rodriguez", role: "VP Engineering, Titan Construction" },
              { quote: "Best decision we made. The platform pays for itself in the first month. Our teams love it.", author: "Emily Watson", role: "CFO, Summit Builders" },
              { quote: "Managing multiple sites used to be a nightmare. Now I have complete visibility across all jobs.", author: "Manuela Gavrila", role: "Owner, Rolling Solutions Ltd" },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic leading-relaxed mb-6">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{testimonial.author}</div>
                    <div className="text-xs text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           FINAL CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_-20%,rgba(255,255,255,0.12),transparent)]" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] -mr-40" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] -ml-20" />

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
                Ready to Build Smarter?
              </h2>

              <p className="text-xl lg:text-2xl text-indigo-100 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
                Join 500+ enterprises transforming construction with AI-powered intelligence.
                Start free. See results in your first week.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => setPage(Page.GET_STARTED)}
                  className="group bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                >
                  Start Free Trial <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setPage(Page.PLATFORM_PLANS)}
                  className="border-2 border-white/40 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  View Pricing <ArrowRight size={20} />
                </button>
              </div>

              <p className="text-sm text-indigo-200 mt-8 flex items-center justify-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> No credit card required</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Cancel anytime</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default CortexBuildHomeView;
