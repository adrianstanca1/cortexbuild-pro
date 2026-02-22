import React from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import {
  ArrowRight, BrainCircuit, Sparkles, Cpu, Zap, Network,
  Bot, Activity, TrendingUp, Target, CheckCircle2, BarChart3
} from 'lucide-react';

const NeuralNetworkView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <PublicLayout currentPage={Page.NEURAL_NETWORK} setPage={setPage}>
      {/* --- HERO --- */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider mb-8">
                <Sparkles size={14} /> The Neural Engine
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8">
                AI Built for
                <br />
                <span className="text-indigo-600">Construction Intelligence.</span>
              </h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed mb-10">
                Our neural architecture doesn&apos;t just analyze data—it predicts outcomes,
                automates decisions, and optimizes every aspect of your construction workflow
                in real-time.
              </p>
              <button
                onClick={() => setPage(Page.GET_STARTED)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all flex items-center gap-3"
              >
                Start Trial <ArrowRight size={20} />
              </button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-12 text-white shadow-2xl">
                <BrainCircuit size={80} className="mb-6 opacity-20" />
                <div className="space-y-4">
                  {[
                    { label: 'Predictive Accuracy', value: '99.4%' },
                    { label: 'Automation Rate', value: '85%' },
                    { label: 'Risk Detection', value: 'Real-time' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                      <div className="text-2xl font-black mb-1">{stat.value}</div>
                      <div className="text-xs text-indigo-100 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CORE CAPABILITIES --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 tracking-tight">Intelligence Pillars</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
              Four critical areas of AI-powered construction intelligence working together
              to maximize efficiency and minimize risk.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Neural Core',
                desc: 'Centralized AI processing for all platform data, automation logic, and predictive analytics.',
                icon: Cpu,
                color: 'indigo'
              },
              {
                title: 'Fleet Agents',
                desc: 'Specialized autonomous bots handling routine administration and compliance verification.',
                icon: Bot,
                color: 'blue'
              },
              {
                title: 'Predictive XP',
                desc: 'Advanced forecasting engine learning from historical performance to predict outcomes.',
                icon: Network,
                color: 'purple'
              },
              {
                title: 'Site Sync',
                desc: 'Edge processing for disconnected job sites ensuring data integrity and real-time sync.',
                icon: Zap,
                color: 'cyan'
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 bg-${pillar.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <pillar.icon className={`text-${pillar.color}-600`} size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{pillar.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- USE CASES --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">Real-World Applications</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how our AI transforms daily construction operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Risk Prediction',
                desc: 'Identify potential delays before they happen',
                features: ['Weather impact analysis', 'Supply chain monitoring', 'Resource conflict detection']
              },
              {
                title: 'Cost Optimization',
                desc: 'Reduce overhead with intelligent automation',
                features: ['Material waste reduction', 'Labor allocation', 'Vendor price optimization']
              },
              {
                title: 'Quality Assurance',
                desc: 'Maintain standards across all projects',
                features: ['Automated inspections', 'Compliance checking', 'Defect prediction']
              },
            ].map((useCase, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                <h3 className="text-2xl font-black text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.desc}</p>
                <ul className="space-y-3">
                  {useCase.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ECOSYSTEM --- */}
      <section className="py-20 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff_0%,transparent_70%)] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="lg:flex items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight">Self-Learning Ecosystem</h2>
              <p className="text-lg text-indigo-100 font-medium leading-relaxed mb-8">
                The more you build, the smarter your organization becomes. Our neural network
                continuously aggregates insights across your portfolio, enabling global optimizations.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Continuous Learning', icon: Activity },
                  { label: 'Cross-Project Insights', icon: Network },
                  { label: 'Automated Optimization', icon: TrendingUp },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <item.icon size={24} />
                    </div>
                    <span className="font-semibold text-lg">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 mt-12 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="space-y-6">
                  {[
                    { metric: 'Projects Analyzed', value: '10,000+', trend: '+45%' },
                    { metric: 'Patterns Recognized', value: '500K+', trend: '+120%' },
                    { metric: 'Predictions Made', value: '2M+', trend: '+200%' },
                  ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-indigo-200 uppercase tracking-wider mb-1">{stat.metric}</div>
                        <div className="text-3xl font-black">{stat.value}</div>
                      </div>
                      <div className="text-green-300 font-bold flex items-center gap-1">
                        <TrendingUp size={16} /> {stat.trend}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Experience The Future of Construction
          </h2>
          <p className="text-xl text-gray-600 mb-10 font-medium">
            Join 500+ enterprises leveraging AI for competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setPage(Page.GET_STARTED)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => setPage(Page.PLATFORM_FEATURES)}
              className="bg-white text-gray-900 border border-gray-200 px-10 py-5 rounded-2xl font-black text-lg hover:border-indigo-300 transition-all"
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default NeuralNetworkView;