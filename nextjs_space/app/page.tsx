import Link from "next/link";
import { 
  HardHat, ClipboardList, Users, FileText, BarChart3, ArrowRight, Zap, Shield, Clock,
  CheckCircle, Building2, TrendingUp, Globe, Layers, Lock, Smartphone, Star,
  ChevronRight, Play, Award, Target, Workflow
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Project Management",
    desc: "Full project lifecycle tracking from pre-construction to closeout with automated workflows",
    gradient: "from-blue-500 to-cyan-400"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Real-time communication, task assignment, and role-based access control",
    gradient: "from-purple-500 to-pink-400"
  },
  {
    icon: FileText,
    title: "Document Control",
    desc: "Centralized drawings, specs, and RFI management with version control",
    gradient: "from-orange-500 to-amber-400"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live dashboards, custom reports, and predictive insights",
    gradient: "from-green-500 to-emerald-400"
  },
  {
    icon: Shield,
    title: "Safety & Compliance",
    desc: "RAMS, permits, toolbox talks, and incident tracking in one place",
    gradient: "from-red-500 to-rose-400"
  },
  {
    icon: Workflow,
    title: "Smart Workflows",
    desc: "Automated approvals, notifications, and milestone tracking",
    gradient: "from-indigo-500 to-violet-400"
  }
];

const stats = [
  { value: "500+", label: "Projects Managed", icon: Building2 },
  { value: "98%", label: "On-Time Delivery", icon: Target },
  { value: "£2B+", label: "Budget Tracked", icon: TrendingUp },
  { value: "24/7", label: "Support Available", icon: Clock }
];

const testimonials = [
  {
    quote: "CortexBuild Pro has completely revolutionised how we manage projects at AS Cladding. From site diaries to RAMS documentation, everything is now in one place. It's exactly what the UK construction industry needs.",
    author: "Adrian Stanca",
    role: "Director & Owner",
    company: "AS Cladding And Roofing Ltd"
  },
  {
    quote: "As a builder, I was drowning in paperwork. CortexBuild Pro changed that overnight. Now I can focus on what I do best - building quality work on site.",
    author: "Cosmin Enachi",
    role: "Builder",
    company: "Independent Contractor"
  },
  {
    quote: "Managing multiple rolling shutter projects used to be a nightmare. With CortexBuild Pro, I have complete visibility across all my jobs and teams.",
    author: "Manuela Gavrila",
    role: "Owner",
    company: "Rolling Solutions Ltd"
  },
  {
    quote: "The glass installation industry demands precision and coordination. CortexBuild Pro helps us track every measurement, every fitting, and every deadline.",
    author: "Sebastian",
    role: "Owner",
    company: "SM Glass Ltd"
  },
  {
    quote: "Starting my first cladding business was daunting, but CortexBuild Pro gave me the professional tools I needed from day one. It's like having a project manager in my pocket.",
    author: "Octavian",
    role: "Cladder & Business Owner",
    company: "First-time Business Owner"
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
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
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Features</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Pricing</a>
            </nav>
            
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors hidden sm:block">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-sm font-medium text-indigo-600">Built for UK Construction Industry</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Build Projects.
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                Not Paperwork.
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              The intelligent construction management platform that streamlines your entire project lifecycle — from planning to handover.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="group inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-2xl text-base font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
              >
                <Play className="h-5 w-5 text-primary" />
                Watch Demo
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100 shadow-sm">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Layers className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-white/80">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Purpose-built tools designed specifically for construction professionals who demand excellence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-5`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Why CortexBuild</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Deliver Projects On Time,
                <span className="text-primary"> Every Time</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Join hundreds of construction companies who have transformed their project delivery with our intelligent platform.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: Zap, title: "40% Faster Delivery", desc: "Automated workflows and smart scheduling reduce delays" },
                  { icon: Lock, title: "Enterprise Security", desc: "Bank-level encryption and role-based access controls" },
                  { icon: Smartphone, title: "Mobile-First Design", desc: "Full functionality on any device, online or offline" },
                  { icon: Globe, title: "Multi-Site Support", desc: "Manage unlimited projects across all your locations" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                <div className="space-y-6">
                  {/* Mock Dashboard Preview */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <HardHat className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Project Dashboard</div>
                        <div className="text-sm text-slate-500">Real-time overview</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Active Projects", value: "12", color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Tasks Today", value: "47", color: "text-green-600", bg: "bg-green-50" },
                      { label: "Team Online", value: "23", color: "text-purple-600", bg: "bg-purple-50" },
                      { label: "Completion", value: "89%", color: "text-amber-600", bg: "bg-amber-50" }
                    ].map((item, i) => (
                      <div key={i} className={`${item.bg} rounded-xl p-4`}>
                        <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                        <div className="text-sm text-slate-600">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">Project Progress</span>
                      <span className="text-sm text-slate-500">78%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-amber-700">Trusted by Industry Leaders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hear from construction professionals who have transformed their operations.
            </p>
          </div>
          
          {/* Featured testimonial - Adrian Stanca */}
          <div className="mb-12">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-6 w-6 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl mb-8 leading-relaxed font-medium">"{testimonials[0].quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                    {testimonials[0].author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{testimonials[0].author}</div>
                    <div className="text-indigo-200">{testimonials[0].role}</div>
                    <div className="text-indigo-200">{testimonials[0].company}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other testimonials grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.slice(1).map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-5 leading-relaxed text-sm">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{testimonial.author}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <br />Construction Projects?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of construction professionals who are building smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 pb-12 border-b border-slate-800">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                  <HardHat className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">CortexBuild Pro</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The intelligent construction management platform built for modern project teams.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Customers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 CortexBuild Pro. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" /> SOC 2 Compliant
              </span>
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" /> GDPR Ready
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
