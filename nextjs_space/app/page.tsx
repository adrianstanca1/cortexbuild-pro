import Link from "next/link";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  HardHat, ClipboardList, Users, FileText, BarChart3, ArrowRight, Zap, Shield, Clock,
  CheckCircle, Building2, TrendingUp, Globe, Layers, Lock, Smartphone, Star,
  ChevronRight, Play, Award, Target, Workflow, BrainCircuit, Sparkles,
  PoundSterling, Wrench, Activity, Gauge, CircleDot, MousePointerClick,
  Rocket, Timer, PieChart, MessageSquare, ArrowUpRight, Bot
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Project Management",
    desc: "Full project lifecycle from pre-construction to handover with AI-powered scheduling and automated workflows",
    gradient: "from-blue-500 to-cyan-400",
    metric: "40% faster"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Real-time comms, smart task assignment, role-based access, and live location tracking across all sites",
    gradient: "from-purple-500 to-pink-400",
    metric: "23 avg online"
  },
  {
    icon: FileText,
    title: "Document Control",
    desc: "Centralised drawings, specs, RFI management with AI-powered search and automatic version control",
    gradient: "from-orange-500 to-amber-400",
    metric: "Zero lost docs"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live dashboards, custom KPI tracking, predictive cost forecasting, and exportable board-ready reports",
    gradient: "from-green-500 to-emerald-400",
    metric: "< 200ms"
  },
  {
    icon: Shield,
    title: "Safety & Compliance",
    desc: "RAMS, permits, toolbox talks, incident tracking, CDM 2015 compliant — all digitised and audit-ready",
    gradient: "from-red-500 to-rose-400",
    metric: "72% fewer incidents"
  },
  {
    icon: Workflow,
    title: "Smart Automation",
    desc: "AI-triggered approvals, invoice matching, payroll processing, compliance reminders — 80% less admin",
    gradient: "from-indigo-500 to-violet-400",
    metric: "80% less admin"
  }
];

const stats = [
  { value: "500+", label: "Projects Managed", icon: Building2, desc: "Across the UK" },
  { value: "98%", label: "On-Time Delivery", icon: Target, desc: "Industry leading" },
  { value: "£2B+", label: "Budget Tracked", icon: PoundSterling, desc: "And counting" },
  { value: "24/7", label: "UK Support", icon: Clock, desc: "Always here" }
];

const testimonials = [
  {
    quote: "CortexBuild Pro has completely revolutionised how we manage projects at AS Cladding. From site diaries to RAMS documentation, everything is now in one place. It's exactly what the UK construction industry needs.",
    author: "Adrian Stanca",
    role: "Director & Owner",
    company: "AS Cladding And Roofing Ltd",
    metric: "-60% admin time"
  },
  {
    quote: "As a builder, I was drowning in paperwork. CortexBuild Pro changed that overnight. Now I can focus on what I do best — building quality work on site.",
    author: "Cosmin Enachi",
    role: "Builder",
    company: "Independent Contractor",
    metric: "2x productivity"
  },
  {
    quote: "Managing multiple rolling shutter projects used to be a nightmare. With CortexBuild Pro, I have complete visibility across all my jobs and teams.",
    author: "Manuela Gavrila",
    role: "Owner",
    company: "Rolling Solutions Ltd",
    metric: "5 sites managed"
  },
  {
    quote: "The glass installation industry demands precision and coordination. CortexBuild Pro helps us track every measurement, every fitting, and every deadline.",
    author: "Sebastian",
    role: "Owner",
    company: "SM Glass Ltd",
    metric: "Zero missed deadlines"
  },
  {
    quote: "Starting my first cladding business was daunting, but CortexBuild Pro gave me the professional tools I needed from day one. It's like having a project manager in my pocket.",
    author: "Octavian",
    role: "Cladder & Business Owner",
    company: "First-time Business Owner",
    metric: "Day-1 ready"
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ═══ Custom Animations ═══ */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes gradient-x { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulse-slow { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .animate-float{animation:float 4s ease-in-out infinite}
        .animate-marquee{animation:marquee 35s linear infinite}
        .animate-gradient-x{background-size:200% 200%;animation:gradient-x 6s ease infinite}
        .animate-pulse-slow{animation:pulse-slow 3s ease-in-out infinite}
      `}</style>

      {/* ═══ Navigation ═══ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur-sm opacity-50" />
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                  <HardHat className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  CortexBuild
                </span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm">
                  PRO
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
           HERO — Split Layout with Live Dashboard
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f106_1px,transparent_1px),linear-gradient(to_bottom,#6366f106_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold text-indigo-700">Built for UK Construction &bull; AI-Powered</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.75rem] font-bold tracking-tight mb-6 leading-[1.1]">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Build Projects.
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
                  Not Paperwork.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
                The intelligent construction platform that predicts delays, automates admin,
                and gives you real-time visibility across every project &mdash; from planning to handover.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-2xl text-base font-semibold border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <Play className="h-5 w-5 text-indigo-600" />
                  See It In Action
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>GDPR & CDM 2015</span>
                </div>
              </div>
            </div>

            {/* Right — Live Dashboard Preview */}
            <div className="relative hidden lg:block">
              {/* Floating cards */}
              <div className="absolute -top-2 -left-6 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-slate-100 flex items-center gap-3 animate-float z-20">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Revenue</div>
                  <div className="text-sm font-bold text-slate-900">+34% this quarter</div>
                </div>
              </div>

              <div className="absolute top-20 -right-4 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-slate-100 flex items-center gap-3 animate-float z-20" style={{ animationDelay: '1.5s' }}>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Safety</div>
                  <div className="text-sm font-bold text-slate-900">98.7% compliant</div>
                </div>
              </div>

              <div className="absolute bottom-8 -left-4 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-slate-100 flex items-center gap-3 animate-float z-20" style={{ animationDelay: '3s' }}>
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <BrainCircuit className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">AI Prediction</div>
                  <div className="text-sm font-bold text-slate-900">No delays detected</div>
                </div>
              </div>

              {/* Dashboard Card */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden">
                {/* Chrome */}
                <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4 bg-slate-200/80 rounded-lg py-1.5 px-3 text-xs text-slate-500 font-medium">
                    app.cortexbuild.pro/dashboard
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </div>
                </div>
                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Active', value: '12', bg: 'bg-blue-50', color: 'text-blue-600' },
                      { label: 'Due Today', value: '47', bg: 'bg-emerald-50', color: 'text-emerald-600' },
                      { label: 'Online', value: '23', bg: 'bg-purple-50', color: 'text-purple-600' },
                      { label: 'Health', value: '94%', bg: 'bg-amber-50', color: 'text-amber-600' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-3`}>
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Progress</span>
                      <span className="text-[10px] text-slate-500">This month</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                      {[40, 55, 45, 65, 58, 75, 70, 85, 78, 92, 88, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-indigo-400" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  {/* AI bar */}
                  <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                    <BrainCircuit className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs text-indigo-700 font-medium">
                      <span className="font-bold">AI:</span> Riverside Tower predicted 4 days early. Reallocate 2 crew to Bridge Renewal.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trusted By Marquee ═══ */}
      <section className="py-8 bg-white border-y border-slate-100 overflow-hidden">
        <div className="text-center mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Trusted by construction firms across the UK</p>
        </div>
        <div className="flex animate-marquee whitespace-nowrap">
          {[0, 1].map(dupeIdx => (
            <div key={dupeIdx} className="flex items-center gap-16 px-8">
              {['AS Cladding & Roofing', 'Rolling Solutions', 'SM Glass Ltd', 'BuildTech Global', 'Titan Construction', 'Summit Builders', 'Crown Infrastructure', 'Apex Developments'].map((name, i) => (
                <div key={`${dupeIdx}-${i}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-bold whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           HOW IT WORKS — 3 Steps
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-6">
              <MousePointerClick className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Simple to Start</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Live in 3 Minutes.
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Seriously.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              No consultants. No setup fees. No six-month implementation. Just sign up and go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-20 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200" />

            {[
              { step: '01', icon: Rocket, title: 'Sign Up & Import', desc: 'Create your account, invite your team, and import existing project data. We support CSV, Excel, and direct API sync.', gradient: 'from-indigo-600 to-indigo-700' },
              { step: '02', icon: BrainCircuit, title: 'AI Learns Your Business', desc: 'Our neural engine analyses your projects, costs, and team patterns to build a predictive model unique to your company.', gradient: 'from-violet-600 to-purple-700' },
              { step: '03', icon: TrendingUp, title: 'Watch Results Grow', desc: 'Get real-time insights, automated alerts, and AI recommendations that cut costs and eliminate delays from week one.', gradient: 'from-blue-600 to-cyan-700' },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                <div className={`w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform relative z-10`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-6xl font-black text-slate-100 mb-3">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           FEATURES — Enhanced
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Layers className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-white/80">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Purpose-built tools designed specifically for construction professionals who demand excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-5`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed mb-4">{feature.desc}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
                  <CircleDot className="h-2.5 w-2.5" /> {feature.metric}
                </div>
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-5 w-5 text-white/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           BEFORE/AFTER COMPARISON
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">The Transformation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Before vs After <span className="text-indigo-600">CortexBuild Pro</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Before */}
            <div className="bg-slate-100 rounded-3xl p-8 border border-slate-200 relative">
              <div className="absolute top-6 right-6 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">Before</div>
              <h3 className="text-xl font-bold text-slate-900 mb-6">The Old Way</h3>
              <div className="space-y-4">
                {[
                  'Spreadsheets for everything',
                  'Paper-based safety forms',
                  'Manual invoice processing',
                  'WhatsApp for team comms',
                  'No real-time project visibility',
                  'Guessing at costs & timelines',
                  'Hours of weekly admin'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">&times;</span>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative">
                <div className="absolute top-0 right-0 bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full">After</div>
                <h3 className="text-xl font-bold mb-6">With CortexBuild Pro</h3>
                <div className="space-y-4">
                  {[
                    'One platform for everything',
                    'Digital safety management',
                    'AI-powered invoice matching',
                    'Built-in team collaboration',
                    'Real-time dashboards & alerts',
                    'AI predictions & forecasting',
                    '80% less admin work'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-3 w-3 text-emerald-900" />
                      </div>
                      <span className="text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           BENEFITS — Enhanced with AI Highlight
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
                <Award className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">Why CortexBuild</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Deliver Projects On Time,
                <span className="text-indigo-600"> Every Time</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Join hundreds of construction companies who have transformed their project delivery with our intelligent platform.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Zap, title: "40% Faster Delivery", desc: "Automated workflows and AI scheduling reduce delays" },
                  { icon: Lock, title: "Enterprise Security", desc: "Bank-level encryption and role-based access controls" },
                  { icon: Smartphone, title: "Mobile-First Design", desc: "Full functionality on any device, online or offline" },
                  { icon: Globe, title: "Multi-Site Support", desc: "Manage unlimited projects across all your locations" },
                  { icon: Bot, title: "AI Command Centre", desc: "3 specialised AI bots for finance, ops, and business advice" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 lg:p-10 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative">
                  <Gauge className="h-12 w-12 text-indigo-200 mb-6" />
                  <h3 className="text-2xl font-bold mb-2">Average Customer Impact</h3>
                  <p className="text-indigo-200 mb-8">Within the first 90 days</p>

                  <div className="space-y-5">
                    {[
                      { label: 'Admin Time Saved', value: '60%', width: 'w-[60%]' },
                      { label: 'Cost Overrun Reduction', value: '45%', width: 'w-[45%]' },
                      { label: 'On-Time Improvement', value: '38%', width: 'w-[38%]' },
                      { label: 'Safety Incident Reduction', value: '72%', width: 'w-[72%]' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-indigo-200">{item.label}</span>
                          <span className="text-sm font-bold">{item.value}</span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${item.width} bg-gradient-to-r from-white/40 to-white/80 rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="text-2xl font-bold">4.2x</div>
                      <div className="text-xs text-indigo-200">Avg ROI</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="text-2xl font-bold">28 days</div>
                      <div className="text-xs text-indigo-200">Time to Value</div>
                    </div>
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
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-amber-700">Trusted by Industry Leaders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hear from construction professionals who have transformed their operations.
            </p>
          </div>

          {/* Featured testimonial - Adrian Stanca */}
          <div className="mb-12">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative grid lg:grid-cols-[1fr,auto] gap-10 items-center">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-6 w-6 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl mb-8 leading-relaxed font-medium">&quot;{testimonials[0].quote}&quot;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                      {testimonials[0].author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{testimonials[0].author}</div>
                      <div className="text-indigo-200">{testimonials[0].role}</div>
                      <div className="text-indigo-200">{testimonials[0].company}</div>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:flex flex-col gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 text-center">
                    <div className="text-3xl font-bold">-60%</div>
                    <div className="text-xs text-indigo-200">Admin Time</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 text-center">
                    <div className="text-3xl font-bold">2x</div>
                    <div className="text-xs text-indigo-200">Throughput</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other testimonials grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.slice(1).map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-5 leading-relaxed text-sm">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{testimonial.author}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {testimonial.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <br />Construction Projects?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of construction professionals who are building smarter, not harder.
            Start free. See results in your first week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </div>
          <p className="text-indigo-200 text-sm flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Full access</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Cancel anytime</span>
          </p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 pb-12 border-b border-slate-800">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                  <HardHat className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">CortexBuild Pro</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The intelligent construction management platform built for modern UK project teams.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Customers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 CortexBuild Pro. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" /> SOC 2 Compliant
              </span>
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" /> GDPR Ready
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
