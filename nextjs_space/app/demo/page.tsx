'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, CheckCircle2, HardHat,
  LayoutDashboard, FileText, Users, BarChart3, Shield, 
  Building2, ArrowRight, Star, Quote, Target, Sparkles,
  Globe, Lock, Smartphone, BrainCircuit, Zap,
  Activity, 
  Timer, CheckCircle, MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─── Demo Features ──────────────────────────────────────────────────────── */
const demoFeatures = [
  {
    id: 'dashboard',
    title: 'Intelligent Dashboard',
    subtitle: 'Real-time project visibility',
    description: 'Get a bird\'s eye view of all your construction projects with AI-powered insights, predictive analytics, and smart alerts that help you stay ahead of issues.',
    highlights: ['Portfolio-wide health scoring', 'Predictive delay forecasting', 'Resource optimization suggestions', 'Smart deadline alerts'],
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
    mockData: { stats: [{ label: 'Active', value: '12', color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Due Today', value: '47', color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Online', value: '23', color: 'text-purple-600', bg: 'bg-purple-50' }, { label: 'Health', value: '94%', color: 'text-amber-600', bg: 'bg-amber-50' }] }
  },
  {
    id: 'projects',
    title: 'Project Management',
    subtitle: 'Complete project control',
    description: 'Manage every aspect of your construction projects from a single interface. Track progress, milestones, budgets, and team assignments in real-time.',
    highlights: ['Gantt chart timeline view', 'Milestone tracking', 'Budget vs actual monitoring', 'Multi-project portfolio view'],
    icon: Building2,
    color: 'from-purple-500 to-pink-500',
    mockData: { stats: [{ label: 'Projects', value: '8', color: 'text-purple-600', bg: 'bg-purple-50' }, { label: 'On Track', value: '6', color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Budget', value: '£2.1M', color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Complete', value: '67%', color: 'text-amber-600', bg: 'bg-amber-50' }] }
  },
  {
    id: 'safety',
    title: 'Health & Safety',
    subtitle: 'UK CDM compliant',
    description: 'Full RAMS management, toolbox talks, permits to work, and safety inspections. Built specifically for UK construction regulations.',
    highlights: ['Risk assessment matrices', 'Digital toolbox talks with signatures', 'Hot work & confined space permits', 'Incident reporting & tracking'],
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    mockData: { stats: [{ label: 'Score', value: '98.7%', color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Inspections', value: '24', color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Incidents', value: '0', color: 'text-green-600', bg: 'bg-green-50' }, { label: 'Permits', value: '12', color: 'text-amber-600', bg: 'bg-amber-50' }] }
  },
  {
    id: 'documents',
    title: 'Document Control',
    subtitle: 'Centralised document hub',
    description: 'Store, organise, and share all project documents. Version control, approval workflows, and instant access from any device.',
    highlights: ['Drawing register management', 'RFI & submittal tracking', 'Automatic version control', 'Mobile offline access'],
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    mockData: { stats: [{ label: 'Documents', value: '1,247', color: 'text-orange-600', bg: 'bg-orange-50' }, { label: 'Drawings', value: '89', color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'RFIs Open', value: '7', color: 'text-amber-600', bg: 'bg-amber-50' }, { label: 'Approved', value: '342', color: 'text-emerald-600', bg: 'bg-emerald-50' }] }
  },
  {
    id: 'team',
    title: 'Team Collaboration',
    subtitle: 'Connected workforce',
    description: 'Keep your entire team aligned with real-time updates, task assignments, and communication tools designed for construction sites.',
    highlights: ['Role-based access control', 'Time tracking & timesheets', 'Worker certifications', 'Site access management'],
    icon: Users,
    color: 'from-indigo-500 to-violet-500',
    mockData: { stats: [{ label: 'Members', value: '48', color: 'text-indigo-600', bg: 'bg-indigo-50' }, { label: 'On Site', value: '23', color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Tasks', value: '156', color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Hours', value: '1,240', color: 'text-amber-600', bg: 'bg-amber-50' }] }
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    subtitle: 'Data-driven decisions',
    description: 'Generate comprehensive reports and analyse project performance with powerful visualisations and exportable data.',
    highlights: ['Daily site reports', 'Progress claim generation', 'Cost analysis dashboards', 'Custom report builder'],
    icon: BarChart3,
    color: 'from-teal-500 to-cyan-500',
    mockData: { stats: [{ label: 'Reports', value: '87', color: 'text-teal-600', bg: 'bg-teal-50' }, { label: 'This Week', value: '12', color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Exported', value: '34', color: 'text-purple-600', bg: 'bg-purple-50' }, { label: 'Scheduled', value: '5', color: 'text-amber-600', bg: 'bg-amber-50' }] }
  }
];

const stats = [
  { value: '60%', label: 'Less Admin Time', icon: Timer },
  { value: '40%', label: 'Faster RFI Response', icon: Zap },
  { value: '99.9%', label: 'Uptime Guarantee', icon: Activity },
  { value: '24/7', label: 'UK Support', icon: Globe }
];

const testimonial = {
  quote: "CortexBuild Pro has completely revolutionised how we manage projects at AS Cladding. From site diaries to RAMS documentation, everything is now in one place. It's exactly what the UK construction industry needs.",
  author: "Adrian Stanca",
  role: "Director & Owner",
  company: "AS Cladding And Roofing Ltd"
};

/* ─── Simulated Live Activity Feed ───────────────────────────────────────── */
const liveEvents = [
  { user: 'AS', action: 'approved RAMS for Riverside Tower', time: '2m ago', color: 'bg-emerald-500' },
  { user: 'CE', action: 'uploaded 3 drawings to Bridge Renewal', time: '5m ago', color: 'bg-blue-500' },
  { user: 'MG', action: 'completed safety inspection Site 4', time: '8m ago', color: 'bg-green-500' },
  { user: 'SB', action: 'submitted progress claim £47,200', time: '12m ago', color: 'bg-purple-500' },
  { user: 'OC', action: 'logged 8h timesheet for cladding work', time: '15m ago', color: 'bg-indigo-500' },
];

export default function DemoPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [liveEventIdx, setLiveEventIdx] = useState(0);

  const currentFeature = demoFeatures[activeFeature];
  const IconComponent = currentFeature.icon;

  // Rotate live events
  useEffect(() => {
    const t = setInterval(() => setLiveEventIdx(i => (i + 1) % liveEvents.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Auto-advance features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(i => (i + 1) % demoFeatures.length), 8000);
    return () => clearInterval(t);
  }, []);

  const nextFeature = () => setActiveFeature((prev) => (prev + 1) % demoFeatures.length);
  const prevFeature = () => setActiveFeature((prev) => (prev - 1 + demoFeatures.length) % demoFeatures.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ═══ Animations ═══ */}
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)}50%{box-shadow:0 0 20px 4px rgba(99,102,241,0.2)}}
        .animate-float{animation:float 4s ease-in-out infinite}
        .animate-slide-up{animation:slide-up 0.6s ease-out}
        .animate-pulse-glow{animation:pulse-glow 2s ease-in-out infinite}
      `}</style>

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur-sm opacity-50" />
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                  <HardHat className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">CortexBuild</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm">PRO</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">Sign In</Link>
              <Link href="/signup" className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5">
                Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
           HERO — Interactive Product Showcase (replacing video)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f106_1px,transparent_1px),linear-gradient(to_bottom,#6366f106_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              Interactive Product Tour
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Experience CortexBuild Pro
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                Live & Interactive
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Explore our platform in real-time. See live dashboards, AI predictions, and smart
              automation working together &mdash; no signup required.
            </p>
          </div>

          {/* ═══ Interactive Dashboard Showcase ═══ */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden animate-pulse-glow">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-slate-200/80 rounded-lg py-1.5 px-3 text-xs text-slate-500 font-medium">
                  app.cortexbuild.pro/{currentFeature.id}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Demo
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 md:p-8">
                {/* Top nav tabs */}
                <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-100">
                  {demoFeatures.map((f, i) => {
                    const FIcon = f.icon;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setActiveFeature(i)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeFeature === i
                            ? `bg-gradient-to-r ${f.color} text-white shadow-md`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{f.title}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid lg:grid-cols-[1fr,280px] gap-6">
                  {/* Main area */}
                  <div className="space-y-4 animate-slide-up" key={currentFeature.id}>
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentFeature.color} flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{currentFeature.title}</h3>
                        <p className="text-xs text-slate-500">{currentFeature.subtitle}</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-3">
                      {currentFeature.mockData.stats.map((s, i) => (
                        <div key={i} className={`${s.bg} rounded-xl p-3`}>
                          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Chart mockup */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{currentFeature.title} Overview</span>
                        <span className="text-[10px] text-slate-500">Last 30 days</span>
                      </div>
                      <div className="flex items-end gap-1 h-24">
                        {Array.from({ length: 20 }, (_, i) => {
                          const h = 30 + Math.sin(i * 0.5 + activeFeature) * 25 + Math.random() * 20;
                          return (
                            <div
                              key={`${currentFeature.id}-${i}`}
                              className={`flex-1 rounded-sm bg-gradient-to-t ${currentFeature.color} transition-all duration-500`}
                              style={{ height: `${Math.min(100, h)}%`, opacity: 0.5 + (i / 20) * 0.5 }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Insight */}
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                      <BrainCircuit className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs text-indigo-700 font-medium">
                        <span className="font-bold">AI Insight:</span> Based on current {currentFeature.title.toLowerCase()} data, 3 optimisation opportunities detected. Click to review.
                      </span>
                    </div>

                    {/* Progress bars */}
                    <div className="grid grid-cols-2 gap-3">
                      {currentFeature.highlights.map((h, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className={`h-4 w-4 ${i < 3 ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <span className="text-xs text-slate-700 font-medium">{h}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${currentFeature.color} transition-all duration-1000`}
                              style={{ width: `${60 + i * 10 + activeFeature * 3}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right sidebar — Live Activity Feed */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Activity</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                      </span>
                    </div>
                    <div className="space-y-3">
                      {liveEvents.map((event, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2.5 transition-all duration-500 ${i === liveEventIdx ? 'opacity-100 scale-100' : 'opacity-60 scale-[0.98]'}`}
                        >
                          <div className={`w-7 h-7 rounded-full ${event.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                            {event.user}
                          </div>
                          <div>
                            <p className="text-xs text-slate-700 leading-relaxed">{event.action}</p>
                            <span className="text-[10px] text-slate-400">{event.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick metrics */}
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Active Users</span>
                        <span className="font-bold text-slate-700">23</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Actions Today</span>
                        <span className="font-bold text-slate-700">347</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">AI Predictions</span>
                        <span className="font-bold text-emerald-600">All Clear</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="icon" onClick={prevFeature} className="rounded-full h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1.5">
                {demoFeatures.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeFeature === i ? 'w-8 bg-gradient-to-r from-indigo-600 to-purple-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
              <Button variant="outline" size="icon" onClick={nextFeature} className="rounded-full h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <MousePointerClick className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-slate-700">Click tabs to explore</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-slate-700">Live data simulation</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <BrainCircuit className="h-4 w-4 text-violet-600" />
                <span className="text-sm text-slate-700">AI-powered insights</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                <stat.icon className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
           FEATURE DEEP DIVE
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Platform Deep Dive
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Every Feature, Built for Construction
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore the comprehensive suite of tools designed specifically for UK construction professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoFeatures.map((feature, i) => {
              const FIcon = feature.icon;
              return (
                <div key={feature.id} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer" onClick={() => { setActiveFeature(i); window.scrollTo({ top: 200, behavior: 'smooth' }); }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <FIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.highlights.slice(0, 3).map((h, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Testimonial ═══ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 md:p-16 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <Quote className="h-12 w-12 text-white/30 mb-6" />
              <p className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-bold text-lg">{testimonial.author}</div>
                  <div className="text-indigo-200">{testimonial.role}</div>
                  <div className="text-indigo-200">{testimonial.company}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Key Benefits ═══ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why Construction Teams Choose Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built by construction professionals, for construction professionals.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: 'UK-Specific', desc: 'Built for UK regulations including CDM 2015, Building Safety Act, and HSE requirements. Uses British English and pound sterling throughout.', gradient: 'from-green-500 to-emerald-500' },
              { icon: Smartphone, title: 'Mobile-First', desc: 'Access everything from site. Capture photos, log time, complete inspections, and sign documents right from your phone or tablet.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Lock, title: 'Enterprise Security', desc: 'Bank-level encryption, UK data residency, role-based permissions, and comprehensive audit trails for complete peace of mind.', gradient: 'from-purple-500 to-pink-500' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Projects?
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of UK construction companies already using CortexBuild Pro
            to deliver projects on time and on budget.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/signup" className="group inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              Start Free 14-Day Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 text-white/90 hover:text-white px-8 py-4 text-base font-medium transition-colors">
              Sign in to your account
            </Link>
          </div>
          <p className="text-indigo-200 text-sm flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Full access</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Cancel anytime</span>
          </p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold">CortexBuild Pro</span>
            </div>
            <div className="text-sm">&copy; {new Date().getFullYear()} CortexBuild Pro. Built for UK Construction.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
