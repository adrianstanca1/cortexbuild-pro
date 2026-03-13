"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HardHat, ArrowRight, Mail, Phone, MapPin, Clock,
  MessageSquare, CheckCircle, Send, Loader2, Building2
} from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email us",
    value: "hello@cortexbuildpro.com",
    href: "mailto:hello@cortexbuildpro.com",
    desc: "We reply within 4 hours on weekdays",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    icon: Phone,
    title: "Call us",
    value: "+44 (0)800 123 4567",
    href: "tel:+448001234567",
    desc: "Mon–Fri, 8am–6pm GMT",
    gradient: "from-green-500 to-emerald-400",
    bg: "bg-green-50",
    color: "text-green-600",
  },
  {
    icon: MessageSquare,
    title: "Live chat",
    value: "Chat with us",
    href: "#chat",
    desc: "Available during business hours",
    gradient: "from-purple-500 to-violet-400",
    bg: "bg-purple-50",
    color: "text-purple-600",
  },
  {
    icon: MapPin,
    title: "Based in",
    value: "United Kingdom",
    href: null,
    desc: "Serving contractors across the UK",
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-50",
    color: "text-amber-600",
  },
];

const reasons = [
  "Request a demo",
  "Get a custom quote",
  "Technical support",
  "Partnership enquiry",
  "General question",
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    reason: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

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
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">UK-based team, real humans</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              We&apos;d love to
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              hear from you
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Whether you&apos;re a sole trader or a large contractor — we&apos;re here to help.
            No sales pressure, no scripts.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method) => (
              <div key={method.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className={`w-10 h-10 rounded-xl ${method.bg} flex items-center justify-center mb-4`}>
                  <method.icon className={`h-5 w-5 ${method.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{method.title}</h3>
                {method.href ? (
                  <a href={method.href} className={`text-sm font-medium ${method.color} hover:underline`}>
                    {method.value}
                  </a>
                ) : (
                  <p className={`text-sm font-medium ${method.color}`}>{method.value}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{method.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          {/* Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Message sent!</h2>
                <p className="text-slate-600 mb-8">
                  Thanks for getting in touch. We&apos;ll get back to you within 4 hours on weekdays.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold"
                >
                  Back to Home <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h2>
                <p className="text-slate-500 text-sm mb-8">We reply within 4 hours on weekdays.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Adrian Stanca"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="adrian@ascladding.co.uk"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company name</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="AS Cladding & Roofing Ltd"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason for contact</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all bg-white"
                    >
                      <option value="">Select a reason…</option>
                      {reasons.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your business and what you're looking for…"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Message</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Info panel */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1 mb-4">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600">Who we help</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Specialised for UK subcontractors
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                We work with cladding contractors, roofers, glazing specialists, M&amp;E engineers,
                scaffolders, and any specialist trade working in UK construction.
              </p>
              <ul className="space-y-3">
                {[
                  "Cladding & curtain wall contractors",
                  "Roofing & waterproofing specialists",
                  "Glazing & facade contractors",
                  "Drylining & interior fit-out",
                  "M&E and specialist trade contractors",
                  "General contractors & housebuilders",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-slate-900 text-sm">Response times</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex justify-between"><span>Email</span><span className="font-medium text-slate-900">Within 4 hours</span></li>
                <li className="flex justify-between"><span>Phone</span><span className="font-medium text-slate-900">Immediate (business hours)</span></li>
                <li className="flex justify-between"><span>Live chat</span><span className="font-medium text-slate-900">Under 5 minutes</span></li>
                <li className="flex justify-between"><span>Enterprise</span><span className="font-medium text-slate-900">Dedicated manager</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-8">
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
