import Link from "next/link";
import {
  HardHat, CheckCircle, ArrowRight, X, Zap, Building2, Users, Shield,
  Star, Clock, PoundSterling, HelpCircle
} from "lucide-react";

export const metadata = {
  title: "Pricing - CortexBuild Pro",
  description: "Simple, transparent pricing for UK construction teams. Start free, scale as you grow.",
};

const plans = [
  {
    name: "Starter",
    price: "£49",
    period: "/month",
    description: "Perfect for small contractors and sole traders",
    highlight: false,
    badge: null,
    features: [
      "Up to 5 users",
      "3 active projects",
      "Document storage (5GB)",
      "Time tracking & timesheets",
      "Basic safety checklists",
      "Mobile app access",
      "Email support",
    ],
    missing: [
      "AI-powered insights",
      "Advanced analytics",
      "Custom reports",
      "API access",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup",
  },
  {
    name: "Growth",
    price: "£149",
    period: "/month",
    description: "For growing subcontractors managing multiple sites",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 25 users",
      "Unlimited projects",
      "Document storage (50GB)",
      "Time tracking & timesheets",
      "Full safety & RAMS module",
      "AI photo & document analysis",
      "Real-time analytics dashboard",
      "Custom reports & exports",
      "Priority support",
      "CDM 2015 compliance tools",
    ],
    missing: [
      "White-label branding",
      "Dedicated account manager",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large contractors and multi-company groups",
    highlight: false,
    badge: null,
    features: [
      "Unlimited users",
      "Unlimited projects",
      "Unlimited document storage",
      "Everything in Growth",
      "White-label branding",
      "Dedicated account manager",
      "SLA guarantees",
      "On-premise deployment option",
      "Custom integrations & API",
      "SSO / Active Directory",
      "Quarterly business reviews",
    ],
    missing: [],
    cta: "Contact Sales",
    ctaHref: "/contact",
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes — every plan starts with a 14-day free trial. No credit card required. Cancel any time.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade or downgrade at any time. Changes take effect on your next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards, as well as BACS bank transfers for annual plans.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All data is encrypted at rest and in transit, stored in UK-based data centres, and fully GDPR compliant.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes — pay annually and save 20% compared to monthly billing. Contact us for a quote.",
  },
  {
    q: "Can I add more users to my plan?",
    a: "Yes. Additional users can be added at any time on a per-seat basis. Speak to our team for bulk pricing.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .animate-float{animation:float 4s ease-in-out infinite}
      `}</style>

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
              <Link href="/#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
              <Link href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How It Works</Link>
              <Link href="/#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</Link>
              <Link href="/pricing" className="text-sm font-medium text-indigo-600 transition-colors">Pricing</Link>
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
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <PoundSterling className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Plans that grow with
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              your business
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-4 max-w-2xl mx-auto">
            No setup fees. No long contracts. No surprises. Start free for 14 days — no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> 14-day free trial</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Cancel any time</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> UK data centres</div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/30 scale-[1.02]"
                    : "bg-white border border-slate-200 shadow-lg"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-current" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-8 flex-1">
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-end gap-1 mb-8">
                    <span className={`text-5xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-base mb-1.5 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-emerald-300" : "text-emerald-500"}`} />
                        <span className={plan.highlight ? "text-indigo-100" : "text-slate-700"}>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm opacity-40">
                        <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-8 pb-8">
                  <Link
                    href={plan.ctaHref}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                      plan.highlight
                        ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { icon: Building2, value: "500+", label: "Projects Managed" },
              { icon: Users, value: "5,000+", label: "Active Users" },
              { icon: Shield, value: "99.9%", label: "Uptime SLA" },
              { icon: Clock, value: "24/7", label: "UK Support" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-center mb-2">
                  <s.icon className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-4">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Got questions?</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-12 shadow-2xl shadow-indigo-500/20">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold text-white">Start in minutes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to transform how you manage your sites?
            </h2>
            <p className="text-lg text-indigo-200 mb-8">
              Join hundreds of UK construction teams already using CortexBuild Pro.
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
                Talk to Sales
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
