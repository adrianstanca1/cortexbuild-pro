import Link from "next/link";
import {
  HardHat, ClipboardList, Users, FileText, BarChart3, ArrowRight, Zap, Shield,
  CheckCircle, BrainCircuit, Smartphone, Globe, Lock,
  Calendar, MessageSquare, Layers
} from "lucide-react";

export const metadata = {
  title: "Features - CortexBuild Pro",
  description: "Everything a UK cladding subcontractor needs — project management, AI insights, safety compliance and more.",
};

const featureCategories = [
  {
    id: "project",
    icon: ClipboardList,
    title: "Project Management",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    tagline: "Full lifecycle from pre-construction to handover",
    features: [
      "Gantt charts & milestone tracking",
      "Sub-project & work package breakdown",
      "Automated delay predictions via AI",
      "RFI (Request for Information) management",
      "Drawing & revision control",
      "Punch lists & snagging",
      "Progress claims & valuations",
      "Change order tracking",
    ],
  },
  {
    id: "team",
    icon: Users,
    title: "Team & Labour",
    gradient: "from-purple-500 to-pink-400",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    tagline: "Real-time collaboration across every site",
    features: [
      "Clock-in / clock-out with GPS verification",
      "Weekly timesheets & approval workflow",
      "Role-based access (Admin, Supervisor, Worker)",
      "Live on-site headcount dashboard",
      "Subcontractor onboarding & compliance",
      "Resource scheduling & availability",
      "Labour cost tracking",
      "Team messaging & announcements",
    ],
  },
  {
    id: "documents",
    icon: FileText,
    title: "Document Control",
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
    tagline: "Zero lost docs. Instant retrieval.",
    features: [
      "Centralised document repository",
      "Version control & revision history",
      "RAMS upload, review & sign-off",
      "Method statements & ITPs",
      "Certification & accreditation tracking",
      "Smart AI-powered search",
      "Bulk download & sharing",
      "Automatic expiry reminders",
    ],
  },
  {
    id: "ai",
    icon: BrainCircuit,
    title: "AI Insights",
    gradient: "from-violet-500 to-indigo-400",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    tagline: "Your AI project manager, available 24/7",
    features: [
      "Photo analysis — defect & hazard detection",
      "Document review & risk flagging",
      "Delay prediction from site data",
      "Cost forecasting & variance alerts",
      "Daily site diary auto-generation",
      "Meeting minutes summarisation",
      "Compliance gap identification",
      "Natural language project Q&A",
    ],
  },
  {
    id: "safety",
    icon: Shield,
    title: "Safety & Compliance",
    gradient: "from-red-500 to-rose-400",
    bg: "bg-red-50",
    iconColor: "text-red-600",
    tagline: "CDM 2015 compliant. Audit-ready at all times.",
    features: [
      "RAMS creation & digital sign-off",
      "Toolbox talk delivery & attendance log",
      "Incident & near-miss reporting",
      "Permit-to-work management",
      "Induction tracking",
      "Daily safety observations",
      "Safety score dashboards",
      "Predictive risk alerts",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics & Reports",
    gradient: "from-green-500 to-emerald-400",
    bg: "bg-green-50",
    iconColor: "text-green-600",
    tagline: "Data-driven decisions on every project",
    features: [
      "Real-time project health dashboards",
      "Custom KPI tracking",
      "Labour productivity metrics",
      "Budget vs actual reporting",
      "Board-ready PDF exports",
      "Weather impact forecasting",
      "Executive summary views",
      "Multi-project portfolio overview",
    ],
  },
];

const extras = [
  { icon: Smartphone, title: "Mobile-First", desc: "Full offline functionality. Works on any device." },
  { icon: Globe, title: "Multi-Site", desc: "Manage unlimited sites and projects from one platform." },
  { icon: Lock, title: "Enterprise Security", desc: "Bank-level encryption. GDPR compliant. UK data centres." },
  { icon: Calendar, title: "Integrations", desc: "Connects with Xero, Sage, Microsoft 365 and more." },
  { icon: MessageSquare, title: "UK Support", desc: "Real humans. 24/7. Based in the UK." },
  { icon: Layers, title: "Custom Workflows", desc: "Tailor approval flows and forms to your business." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
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
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  CortexBuild
                </span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm">
                  PRO
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-sm font-medium text-indigo-600 transition-colors">Features</Link>
              <Link href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How It Works</Link>
              <Link href="/#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</Link>
              <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</Link>
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

      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f106_1px,transparent_1px),linear-gradient(to_bottom,#6366f106_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Built for UK Construction Subcontractors</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Everything you need,
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              nothing you don&apos;t
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            CortexBuild Pro was designed specifically for cladding subcontractors and specialist
            trade contractors in the UK. Every feature exists because our customers asked for it.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {[
              { icon: CheckCircle, text: "Clock-in & timesheets" },
              { icon: CheckCircle, text: "AI photo analysis" },
              { icon: CheckCircle, text: "CDM 2015 compliant" },
              { icon: CheckCircle, text: "No setup fees" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-green-500" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          {featureCategories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                <div className={`inline-flex items-center gap-2 ${cat.bg} rounded-full px-3 py-1 mb-4`}>
                  <cat.icon className={`h-4 w-4 ${cat.iconColor}`} />
                  <span className={`text-xs font-semibold ${cat.iconColor}`}>{cat.title}</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">{cat.title}</h2>
                <p className="text-slate-500 mb-8 text-lg">{cat.tagline}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                <div className={`bg-gradient-to-br ${cat.gradient} rounded-3xl p-10 flex items-center justify-center aspect-square max-w-sm mx-auto shadow-2xl shadow-current/20`}>
                  <cat.icon className="h-32 w-32 text-white opacity-90" strokeWidth={1} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Extra features grid */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything else you&apos;d expect</h2>
            <p className="text-slate-500">The platform details that make the difference day to day.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {extras.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-12 shadow-2xl shadow-indigo-500/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              See it all in action
            </h2>
            <p className="text-lg text-indigo-200 mb-8">
              Book a 20-minute demo with our team — tailored to cladding & specialist trade contractors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-base font-semibold shadow-lg hover:bg-indigo-50 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-white/10 transition-all duration-300"
              >
                View Live Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold">CortexBuild <span className="text-amber-400">PRO</span></span>
            </div>
            <p className="text-sm">© 2026 CortexBuild Pro. All rights reserved. Built for UK construction.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
