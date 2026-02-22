import React from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import { BentoCard } from '@/components/BentoCard';
import {
  Code2,
  Terminal,
  Cpu,
  Braces,
  Zap,
  ArrowRight,
  Database,
  Globe,
  Lock,
  Workflow
} from 'lucide-react';

const DeveloperPlatformView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <PublicLayout currentPage={Page.DEVELOPER_PLATFORM} setPage={setPage}>
      {/* --- HERO --- */}
      <section className="pt-48 pb-64">
        <div className="max-w-7xl mx-auto px-6">
          <div className="lg:flex items-center justify-between gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] mb-8">
                <Terminal size={14} /> Open Infrastructure
              </div>
              <h1 className="text-6xl lg:text-8xl font-black text-gray-900 tracking-tight leading-[1.05] mb-10">
                Extend the <br />
                <span className="text-indigo-600">Standard.</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium leading-relaxed mb-12">
                We provide the base intelligence. You build the specialized layers. Join a developer community reshaping how the world is built.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setPage(Page.GET_STARTED)}
                  className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all"
                >
                  Get API Keys
                </button>
                <button
                  className="bg-white text-gray-900 border-2 border-gray-100 hover:border-gray-200 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                >
                  View SDK Docs
                </button>
              </div>
            </div>
            <div className="lg:w-1/2 mt-16 lg:mt-0">
              <div className="bg-gray-900 rounded-[48px] p-1 shadow-2xl overflow-hidden relative group">
                {/* Simulated IDE Header */}
                <div className="bg-gray-800/50 px-6 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    predictive_node.ts
                  </div>
                  <div className="w-10"></div>
                </div>
                {/* Code Area */}
                <div className="p-10 font-mono text-sm leading-relaxed overflow-x-auto">
                  <div className="flex gap-4 mb-2">
                    <span className="text-gray-600 select-none">1</span>
                    <span className="text-purple-400">import</span>
                    <span className="text-white">{` { CortexNode } `}</span>
                    <span className="text-purple-400">from</span>
                    <span className="text-emerald-400">&apos;@cortex/sdk&apos;</span>;
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span className="text-gray-600 select-none">2</span>
                    <span className="text-gray-400">{`// Initialize high-fidelity sensor grid`}</span>
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span className="text-gray-600 select-none">3</span>
                    <span className="text-purple-400">const</span>
                    <span className="text-white"> node = </span>
                    <span className="text-purple-400">new</span>
                    <span className="text-blue-400 underline"> CortexNode</span>({`{ `}
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span className="text-gray-600 select-none">4</span>
                    <span className="text-white ml-8">apiKey: </span>
                    <span className="text-emerald-400">&apos;CB_PRO_772...&apos;</span>,
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span className="text-gray-600 select-none">5</span>
                    <span className="text-white ml-8">autonomous: </span>
                    <span className="text-orange-400">true</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-600 select-none">6</span>
                    <span className="text-white">{` });`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TECH STACK --- */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'REST & GraphQL', desc: 'Modern, high-performance API endpoints with predictable latency.', icon: Globe },
              { title: 'React SDK', desc: 'Pre-built components for construction-specific UI/UX patterns.', icon: Code2 },
              { title: 'Webhooks', desc: 'Real-time event streaming for site events and status changes.', icon: Zap },
              { title: 'Edge Logic', desc: 'Deploy custom logic closer to the site with distributed nodes.', icon: Cpu },
            ].map((tech, i) => (
              <BentoCard
                key={i}
                title={tech.title}
                description={tech.desc}
                icon={tech.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- INTEGRATION GRID --- */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gray-900 rounded-[64px] p-16 lg:p-24 text-white relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,#ffffff_0%,transparent_70%)]"></div>
            <div className="lg:flex justify-between items-center gap-20">
              <div className="lg:w-1/2 relative z-10">
                <h2 className="text-4xl lg:text-6xl font-black mb-10 tracking-tight uppercase">Unified <br />Data Model</h2>
                <p className="text-xl text-gray-400 font-medium leading-relaxed mb-12">
                  We&apos;ve standardized how construction data is structured. From cost-codes to equipment telematics, everything follows a strict protocol for maximum interoperability.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-3xl font-black mb-2">400+</div>
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">Standard Schema</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black mb-2">10ms</div>
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">Average Latency</div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="bg-white/5 backdrop-blur-3xl rounded-[48px] p-12 border border-white/10 shadow-2xl">
                  <div className="flex flex-col gap-6">
                    {[
                      { label: 'Site Safety Log', status: 'Healthy', color: 'text-green-400' },
                      { label: 'Telematics Grid', status: 'Syncing', color: 'text-blue-400' },
                      { label: 'Financial Export', status: 'Buffered', color: 'text-yellow-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="font-bold">{item.label}</span>
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${item.color}`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse bg-current`}></div>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default DeveloperPlatformView;