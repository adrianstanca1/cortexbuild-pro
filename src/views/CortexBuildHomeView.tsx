import React from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import { BentoCard } from '@/components/BentoCard';
import {
  ArrowRight, Zap, Shield, BrainCircuit, Rocket, Cpu, Globe,
  BarChart3, Users2, Lock, Layers, ChevronRight, PlayCircle,
  CheckCircle2, TrendingUp, Clock, DollarSign, Target, Award, Building2
} from 'lucide-react';

const CortexBuildHomeView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <PublicLayout currentPage={Page.CORTEX_BUILD_HOME} setPage={setPage}>
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradient Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50 opacity-60" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -ml-20 -mb-20" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-100 shadow-sm text-indigo-700 text-xs font-black uppercase tracking-wider mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              v2.0 Architecture • Now Live
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8 animate-slide-up">
              Construction Intelligence
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700">
                Built For Scale.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 font-medium leading-relaxed mb-12 max-w-4xl mx-auto">
              The AI-powered operating system for modern construction enterprises.
              <span className="text-gray-900 font-semibold block mt-2">
                Predict risks. Automate workflows. Scale globally.
              </span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => setPage(Page.GET_STARTED)}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Start Free Trial <ArrowRight size={20} />
              </button>
              <button
                onClick={() => setPage(Page.NEURAL_NETWORK)}
                className="w-full sm:w-auto bg-white text-gray-900 border border-gray-200 hover:border-indigo-300 px-8 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
              >
                <PlayCircle size={20} className="text-indigo-600" /> Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">{String.fromCharCode(64 + i)}</span>
                    </div>
                  ))}
                </div>
                <span className="text-gray-600 font-medium">Trusted by 500+ enterprises</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                <span className="text-gray-600 font-medium ml-2">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-6">
              Everything You Need.
              <span className="text-indigo-600"> Nothing You Don&apos;t.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
              A complete platform designed for construction excellence, from the ground up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BrainCircuit,
                title: 'AI Neural Engine',
                desc: 'Predictive analytics and automation powered by advanced machine learning.',
                color: 'indigo'
              },
              {
                icon: TrendingUp,
                title: 'Real-Time Insights',
                desc: 'Live dashboards and instant notifications keep your team synchronized.',
                color: 'blue'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                desc: 'Military-grade encryption with SOC2 compliance and dedicated tenant isolation.',
                color: 'green'
              },
              {
                icon: Zap,
                title: 'Seamless Integration',
                desc: 'Connect with 100+ tools via native APIs and webhook automations.',
                color: 'purple'
              },
              {
                icon: Globe,
                title: 'Global Scale',
                desc: 'Multi-region deployment with 99.99% uptime SLA and edge caching.',
                color: 'cyan'
              },
              {
                icon: Rocket,
                title: 'Instant Deployment',
                desc: 'Go live in minutes with zero infrastructure setup or DevOps required.',
                color: 'orange'
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer"
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

      {/* --- STATS SECTION --- */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black  tracking-tight mb-4">
              Proven Performance. Measurable Results.
            </h2>
            <p className="text-lg text-gray-400">Numbers that matter to your bottom line.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Enterprise Clients', icon: Building2 },
              { value: '99.4%', label: 'Prediction Accuracy', icon: Target },
              { value: '40%', label: 'Cost Reduction', icon: DollarSign },
              { value: '10x', label: 'Faster Reporting', icon: Clock },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
                  <stat.icon className="text-indigo-400" size={32} />
                </div>
                <div className="text-4xl font-black mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BENTO GRID --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6">
            {/* Hero Bento */}
            <BentoCard
              title="The Neural Core"
              description="State-of-the-art AI engine that transforms fragmented data into strategic intelligence."
              variant="hero"
              icon={BrainCircuit}
              className="md:col-span-4 lg:col-span-8 min-h-[400px]"
            >
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black mb-1 text-white">99.4%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80">Accuracy</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                  <div className="text-3xl font-black mb-1 text-white">-40%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80">Overhead</div>
                </div>
              </div>
            </BentoCard>

            <BentoCard
              title="Portfolio Scale"
              description="From local sites to global operations. Managed centrally."
              icon={Layers}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            />

            <BentoCard
              title="Elite Security"
              description="Dedicated tenant architecture with military-grade encryption."
              icon={Shield}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            />

            <BentoCard
              title="Developer OS"
              description="Built on open primitives. Integrate in minutes."
              variant="dark"
              icon={Cpu}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            >
              <div className="bg-gray-950/50 rounded-lg p-4 font-mono text-xs text-gray-400 mt-4 border border-white/5">
                <div className="text-emerald-400">cortex.deploy(&apos;global&apos;)</div>
                <div className="text-indigo-400 mt-1">.then(res =&gt; console.log(res))</div>
              </div>
            </BentoCard>

            <BentoCard
              title="Edge Velocity"
              description="Real-time webhooks and WebSocket streams across all modules."
              icon={Zap}
              className="md:col-span-2 lg:col-span-4 min-h-[300px]"
            />
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Trusted By Industry Leaders
            </h2>
            <p className="text-lg text-gray-600">See what our customers are building.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "CortexBuild transformed our operations. 40% reduction in admin overhead in just 3 months.",
                author: "Sarah Chen",
                role: "COO, BuildTech Global",
                rating: 5
              },
              {
                quote: "The AI predictions are incredibly accurate. We&apos;ve eliminated project delays entirely.",
                author: "Marcus Rodriguez",
                role: "VP Engineering, Titan Construction",
                rating: 5
              },
              {
                quote: "Best decision we made. The platform pays for itself in the first month.",
                author: "Emily Watson",
                role: "CFO, Summit Builders",
                rating: 5
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic leading-relaxed mb-6">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden text-center shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -mr-40"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -ml-20"></div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6 relative z-10">
              Ready to Build Smarter?
            </h2>

            <p className="text-xl lg:text-2xl text-indigo-100 font-medium max-w-3xl mx-auto mb-12 relative z-10 leading-relaxed">
              Join 500+ enterprises transforming construction with AI-powered intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <button
                onClick={() => setPage(Page.GET_STARTED)}
                className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all flex items-center gap-3 shadow-xl"
              >
                Start Free Trial <ChevronRight size={24} />
              </button>
              <button
                onClick={() => setPage(Page.PLATFORM_PLANS)}
                className="border-2 border-white text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all flex items-center gap-3"
              >
                View Pricing <ArrowRight size={20} />
              </button>
            </div>

            <p className="text-sm text-indigo-200 mt-8 relative z-10">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default CortexBuildHomeView;
