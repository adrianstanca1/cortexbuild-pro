import Link from "next/link";
import {
  HardHat, ArrowRight, Target, Heart, Zap,
  Building2, Users, Shield, Star, Globe, TrendingUp
} from "lucide-react";

export const metadata = {
  title: "About - CortexBuild Pro",
  description: "Built by construction professionals for construction professionals. Our story.",
};

const values = [
  {
    icon: Target,
    title: "Built for the trades",
    desc: "We started by spending months on site with cladding contractors, roofers, and specialist subcontractors. Every feature was shaped by real workflows — not boardroom assumptions.",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    icon: Heart,
    title: "We care about outcomes",
    desc: "We measure success by whether your business runs better — fewer missed deadlines, less admin, more time on the tools. Metrics, not vanity.",
    gradient: "from-rose-500 to-pink-400",
    bg: "bg-rose-50",
    color: "text-rose-600",
  },
  {
    icon: Zap,
    title: "Simple is powerful",
    desc: "Construction is complex enough. CortexBuild Pro is intentionally simple. If a site manager can't use it on their first day, we've failed.",
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-50",
    color: "text-amber-600",
  },
  {
    icon: Shield,
    title: "Trust is everything",
    desc: "Your data is yours. We store it securely in UK data centres, we don't sell it, and we'll never hold it hostage. Simple as that.",
    gradient: "from-green-500 to-emerald-400",
    bg: "bg-green-50",
    color: "text-green-600",
  },
];

const stats = [
  { value: "500+", label: "Projects managed", icon: Building2 },
  { value: "5,000+", label: "Construction professionals", icon: Users },
  { value: "£2B+", label: "Contract value tracked", icon: TrendingUp },
  { value: "98%", label: "Customer satisfaction", icon: Star },
];

const team = [
  {
    name: "Adrian Stanca",
    role: "Founder & Director",
    company: "AS Cladding & Roofing Ltd",
    quote: "I built the platform I wished existed when I was running sites. Every feature comes from a real frustration.",
    initials: "AS",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    name: "Cosmin Enachi",
    role: "Lead Developer",
    company: "CortexBuild Pro",
    quote: "Our goal is to make the most powerful construction software feel as simple as a WhatsApp message.",
    initials: "CE",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    name: "Manuela Gavrila",
    role: "Operations Director",
    company: "Rolling Solutions Ltd",
    quote: "The product roadmap is driven entirely by what contractors actually need. Not what investors think they need.",
    initials: "MG",
    gradient: "from-emerald-500 to-teal-600",
  },
];

export default function AboutPage() {
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
              <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
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
            <Globe className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Born on a UK construction site</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Built by contractors,
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              for contractors
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CortexBuild Pro started as a solution to our own problem. Managing a cladding business
            meant drowning in spreadsheets, WhatsApp threads, and paper timesheets. So we built
            something better — and now hundreds of UK contractors use it every day.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="flex justify-center mb-2">
                  <s.icon className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our story */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1 mb-4">
                <span className="text-xs font-semibold text-indigo-600">Our Story</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                From the back of a van to 500+ projects
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  In 2023, Adrian Stanca was running AS Cladding &amp; Roofing Ltd and spending more
                  time on paperwork than on site. Timesheets were done on paper. RAMS were emailed
                  as PDFs. Projects were tracked in a spreadsheet that nobody could find.
                </p>
                <p>
                  He couldn&apos;t find software that was built for specialist subcontractors. Everything
                  was either too complex, too expensive, or designed for main contractors. So he
                  started building CortexBuild Pro — first for his own company, then for others.
                </p>
                <p>
                  Today, hundreds of UK construction businesses use CortexBuild Pro to run their
                  projects, track their teams, and stay compliant — without the admin headache.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { year: "2023", event: "Founded by Adrian Stanca at AS Cladding & Roofing" },
                { year: "2024 Q1", event: "First 50 construction companies onboarded" },
                { year: "2024 Q3", event: "AI features launched — photo analysis & document review" },
                { year: "2025", event: "500+ projects managed. £2B+ contract value tracked" },
                { year: "2026", event: "Expanding to general contractors and housebuilders" },
              ].map((item) => (
                <div key={item.year} className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{item.year}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What we stand for</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              These aren&apos;t values we wrote for a pitch deck. They&apos;re the principles that drive every decision we make.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                <div className={`w-12 h-12 rounded-2xl ${v.bg} flex items-center justify-center mb-4`}>
                  <v.icon className={`h-6 w-6 ${v.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The people behind it</h2>
            <p className="text-slate-500">Every team member has worked in construction or with construction companies.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {team.map((person) => (
              <div key={person.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${person.gradient} flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg`}>
                  {person.initials}
                </div>
                <h3 className="font-bold text-slate-900">{person.name}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-1">{person.role}</p>
                <p className="text-xs text-slate-400 mb-4">{person.company}</p>
                <p className="text-sm text-slate-600 italic leading-relaxed">&ldquo;{person.quote}&rdquo;</p>
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
              Come and join us
            </h2>
            <p className="text-lg text-indigo-200 mb-8">
              Start your 14-day free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-base font-semibold shadow-lg hover:bg-indigo-50 transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Get in Touch
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
