import React, { useState } from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import {
  ArrowRight, LayoutGrid, CheckCircle2, Zap, Users, Shield,
  BarChart3, Clock, FileText, Settings, Smartphone, Cloud
} from 'lucide-react';

const PlatformFeaturesView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'project', label: 'Project Management' },
    { id: 'ai', label: 'AI & Analytics' },
    { id: 'team', label: 'Team Collaboration' },
    { id: 'safety', label: 'Safety & Compliance' },
  ];

  const features = [
    {
      category: ['all', 'project'],
      icon: LayoutGrid,
      title: 'Unified Dashboard',
      desc: 'Real-time project overview with customizable widgets and KPI tracking.',
      color: 'indigo'
    },
    {
      category: ['all', 'ai'],
      icon: BarChart3,
      title: 'Predictive Analytics',
      desc: 'AI-powered forecasting for cost, schedule, and resource planning.',
      color: 'blue'
    },
    {
      category: ['all', 'team'],
      icon: Users,
      title: 'Team Collaboration',
      desc: 'Built-in chat, video calls, and real-time document collaboration.',
      color: 'purple'
    },
    {
      category: ['all', 'safety'],
      icon: Shield,
      title: 'Safety Management',
      desc: 'Incident tracking, hazard reporting, and automated compliance checks.',
      color: 'green'
    },
    {
      category: ['all', 'project'],
      icon: Clock,
      title: 'Schedule Optimization',
      desc: 'Intelligent task dependencies with critical path analysis.',
      color: 'orange'
    },
    {
      category: ['all', 'project'],
      icon: FileText,
      title: 'Document Control',
      desc: 'Version-controlled blueprints, RFIs, and submittal management.',
      color: 'cyan'
    },
    {
      category: ['all', 'team'],
      icon: Smartphone,
      title: 'Mobile Field App',
      desc: 'Offline-first mobile app for field teams with photo capture.',
      color: 'pink'
    },
    {
      category: ['all', 'ai'],
      icon: Zap,
      title: 'Workflow Automation',
      desc: 'Custom workflows triggered by events, schedules, or conditions.',
      color: 'yellow'
    },
    {
      category: ['all', 'safety'],
      icon: Settings,
      title: 'Quality Control',
      desc: 'Inspection checklists, defect tracking, and NCR management.',
      color: 'red'
    },
  ];

  const filteredFeatures = features.filter(f => f.category.includes(activeCategory));

  return (
    <PublicLayout currentPage={Page.PLATFORM_FEATURES} setPage={setPage}>
      {/* --- HERO --- */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider mb-8">
              <LayoutGrid size={14} /> Complete Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8">
              Everything You Need.
              <br />
              <span className="text-indigo-600">One Intelligent Platform.</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed mb-10">
              From project management to financial controls, we&apos;ve built a comprehensive
              suite that grows with your business. All integrated. All intelligent.
            </p>
            <button
              onClick={() => setPage(Page.GET_STARTED)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
            >
              Start Free Trial <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* --- FEATURE CATEGORIES --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`text-${feature.color}-600`} size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BENEFITS --- */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black mb-6">Why Teams Choose CortexBuild</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Real results from real construction professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '40%', label: 'Less Admin Time' },
              { value: '3x', label: 'Faster Reporting' },
              { value: '95%', label: 'Team Adoption' },
              { value: '99.99%', label: 'Uptime SLA' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl font-black mb-2 text-indigo-400">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- INTEGRATION PREVIEW --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-12 lg:p-20 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff_0%,transparent_70%)] opacity-10"></div>

            <h2 className="text-3xl lg:text-5xl font-black mb-6 relative z-10">
              Ready to Transform Your Operations?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto relative z-10">
              Join 500+ enterprises building smarter with CortexBuild Pro.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button
                onClick={() => setPage(Page.GET_STARTED)}
                className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-xl"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setPage(Page.PLATFORM_PLANS)}
                className="border-2 border-white text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all"
              >
                View Pricing
              </button>
            </div>

            <p className="text-sm text-indigo-200 mt-8 relative z-10">
              No credit card required • 14-day trial • Setup in minutes
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PlatformFeaturesView;