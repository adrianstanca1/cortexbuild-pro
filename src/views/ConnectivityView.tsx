import React from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import {
  ArrowRight, Zap, Plug, Cloud, Database, Code2,
  Lock, CheckCircle2, Globe, Shield, Webhook, Activity
} from 'lucide-react';

const ConnectivityView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <PublicLayout currentPage={Page.CONNECTIVITY} setPage={setPage}>
      {/* --- HERO --- */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider mb-8">
                <Zap size={14} /> Universal Connectivity
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8">
                Connect Your
                <br />
                <span className="text-indigo-600">Entire Stack.</span>
              </h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed mb-10">
                Seamlessly integrate your entire technology ecosystem with REST APIs,
                WebSockets, and 100+ pre-built connectors. Build smarter, faster, more efficiently.
              </p>
              <button
                onClick={() => setPage(Page.DEVELOPER_PLATFORM)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all flex items-center gap-3"
              >
                View API Docs <Code2 size={20} />
              </button>
            </div>

            <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff_0%,transparent_70%)] opacity-5"></div>
              <Globe size={60} className="mb-6 opacity-20" />
              <h3 className="text-2xl font-black mb-6">Integration Methods</h3>
              <div className="space-y-4">
                {[
                  { icon: Code2, label: 'REST APIs', value: '200+' },
                  { icon: Webhook, label: 'Webhooks', value: 'Real-time' },
                  { icon: Activity, label: 'WebSockets', value: 'Live' },
                  { icon: Plug, label: 'Native Connectors', value: '100+' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <item.icon size={20} />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <span className="text-indigo-400 font-black">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- INTEGRATION CATEGORIES --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
              Pre-Built Integrations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with the tools your team already uses, no custom development required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: 'Accounting',
                tools: ['QuickBooks', 'Xero', 'Sage', 'NetSuite'],
                icon: Database,
                color: 'blue'
              },
              {
                category: 'Communication',
                tools: ['Slack', 'Teams', 'Email', 'SMS'],
                icon: Activity,
                color: 'purple'
              },
              {
                category: 'Cloud Storage',
                tools: ['Dropbox', 'Google Drive', 'OneDrive', 'Box'],
                icon: Cloud,
                color: 'cyan'
              },
              {
                category: 'Developer Tools',
                tools: ['GitHub', 'GitLab', 'Jira', 'Bitbucket'],
                icon: Code2,
                color: 'green'
              },
            ].map((integration, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 bg-${integration.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <integration.icon className={`text-${integration.color}-600`} size={24} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-4">{integration.category}</h3>
                <ul className="space-y-2">
                  {integration.tools.map((tool, tidx) => (
                    <li key={tidx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- API FEATURES --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6">
                Enterprise-Grade APIs
              </h2>
              <p className="text-lg text-gray-600 mb-8 font-medium leading-relaxed">
                Build custom integrations with our comprehensive REST API. Complete
                documentation, SDKs for all major languages, and 24/7 developer support.
              </p>
              <div className="space-y-4">
                {[
                  'GraphQL & REST endpoints',
                  'Real-time WebSocket streams',
                  'Webhook event subscriptions',
                  'OAuth 2.0 authentication',
                  'Rate limiting & throttling',
                  'Comprehensive error handling',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={16} className="text-indigo-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 font-mono text-sm overflow-hidden border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-gray-400">
                <div className="text-blue-400">const</div> response =<div className="text-purple-400 inline"> await</div> <div className="text-green-400 inline">fetch</div>(
                <div className="ml-4 text-yellow-300">&apos;https://api.cortexbuildpro.com/v1/projects&apos;,</div>
                {'{'}<br />
                <div className="ml-4">headers: {'{'}</div>
                <div className="ml-8 text-orange-300">&apos;Authorization&apos;: &apos;Bearer TOKEN&apos;,</div>
                <div className="ml-8 text-orange-300">&apos;Content-Type&apos;: &apos;application/json&apos;</div>
                <div className="ml-4">{'}'}</div>
                {'}'}<br />
                );<br />
                <br />
                <div className="text-blue-400">const</div> data = <div className="text-purple-400 inline">await</div> response.<div className="text-green-400 inline">json</div>();<br />
                console.<div className="text-green-400 inline">log</div>(data);
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECURITY --- */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black mb-6">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Security at every layer of the integration process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: 'Data Encryption',
                desc: 'TLS 1.3 in transit, AES-256 at rest. Zero-knowledge architecture.'
              },
              {
                icon: Shield,
                title: 'Access Control',
                desc: 'Fine-grained permissions with role-based access and audit logging.'
              },
              {
                icon: CheckCircle2,
                title: 'Compliance',
                desc: 'SOC 2 Type II, GDPR, HIPAA, and ISO 27001 certified.'
              },
            ].map((security, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <security.icon size={28} />
                </div>
                <h3 className="text-xl font-black mb-3">{security.title}</h3>
                <p className="text-gray-400 leading-relaxed">{security.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PARTNER NETWORK --- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
              Trusted by Global Network Partners
            </h2>
            <p className="text-lg text-gray-600">
              Join the ecosystem of construction technology leaders.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all">
                <div className="text-2xl font-black text-gray-300">PARTNER {i}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Start Building Today
          </h2>
          <p className="text-xl text-gray-600 mb-10 font-medium">
            Complete API documentation and integration guides to get started in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setPage(Page.DEVELOPER_PLATFORM)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center justify-center gap-3"
            >
              View API Docs <ArrowRight size={20} />
            </button>
            <button
              onClick={() => setPage(Page.GET_STARTED)}
              className="bg-white text-gray-900 border border-gray-200 px-10 py-5 rounded-2xl font-black text-lg hover:border-indigo-300 transition-all inline-flex items-center justify-center gap-3"
            >
              Get API Key
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ConnectivityView;