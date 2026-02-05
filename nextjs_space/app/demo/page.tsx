'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HardHat,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Shield,
  Clock,
  Building2,
  ArrowRight,
  Star,
  Quote,
  Target,
  Sparkles,
  Globe,
  Lock,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const demoFeatures = [
  {
    id: 'dashboard',
    title: 'Intelligent Dashboard',
    subtitle: 'Real-time project visibility',
    description: 'Get a bird\'s eye view of all your construction projects with AI-powered insights, predictive analytics, and smart alerts that help you stay ahead of issues.',
    highlights: [
      'Portfolio-wide health scoring',
      'Predictive delay forecasting',
      'Resource optimization suggestions',
      'Smart deadline alerts'
    ],
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
    image: '/demo/dashboard.png'
  },
  {
    id: 'projects',
    title: 'Project Management',
    subtitle: 'Complete project control',
    description: 'Manage every aspect of your construction projects from a single interface. Track progress, milestones, budgets, and team assignments in real-time.',
    highlights: [
      'Gantt chart timeline view',
      'Milestone tracking',
      'Budget vs actual monitoring',
      'Multi-project portfolio view'
    ],
    icon: Building2,
    color: 'from-purple-500 to-pink-500',
    image: '/demo/projects.png'
  },
  {
    id: 'safety',
    title: 'Health & Safety',
    subtitle: 'UK CDM compliant',
    description: 'Full RAMS management, toolbox talks, permits to work, and safety inspections. Built specifically for UK construction regulations.',
    highlights: [
      'Risk assessment matrices',
      'Digital toolbox talks with signatures',
      'Hot work & confined space permits',
      'Incident reporting & tracking'
    ],
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    image: '/demo/safety.png'
  },
  {
    id: 'documents',
    title: 'Document Control',
    subtitle: 'Centralised document hub',
    description: 'Store, organise, and share all project documents. Version control, approval workflows, and instant access from any device.',
    highlights: [
      'Drawing register management',
      'RFI & submittal tracking',
      'Automatic version control',
      'Mobile offline access'
    ],
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    image: '/demo/documents.png'
  },
  {
    id: 'team',
    title: 'Team Collaboration',
    subtitle: 'Connected workforce',
    description: 'Keep your entire team aligned with real-time updates, task assignments, and communication tools designed for construction sites.',
    highlights: [
      'Role-based access control',
      'Time tracking & timesheets',
      'Worker certifications',
      'Site access management'
    ],
    icon: Users,
    color: 'from-indigo-500 to-violet-500',
    image: '/demo/team.png'
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    subtitle: 'Data-driven decisions',
    description: 'Generate comprehensive reports and analyse project performance with powerful visualisations and exportable data.',
    highlights: [
      'Daily site reports',
      'Progress claim generation',
      'Cost analysis dashboards',
      'Custom report builder'
    ],
    icon: BarChart3,
    color: 'from-teal-500 to-cyan-500',
    image: '/demo/reports.png'
  }
];

const stats = [
  { value: '60%', label: 'Less Admin Time' },
  { value: '40%', label: 'Faster RFI Response' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '24/7', label: 'UK Support' }
];

const testimonial = {
  quote: "CortexBuild Pro has completely revolutionised how we manage projects at AS Cladding. From site diaries to RAMS documentation, everything is now in one place. It's exactly what the UK construction industry needs.",
  author: "Adrian Stanca",
  role: "Director & Owner",
  company: "AS Cladding And Roofing Ltd"
};

export default function DemoPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const currentFeature = demoFeatures[activeFeature];
  const IconComponent = currentFeature.icon;

  const nextFeature = () => {
    setActiveFeature((prev) => (prev + 1) % demoFeatures.length);
  };

  const prevFeature = () => {
    setActiveFeature((prev) => (prev - 1 + demoFeatures.length) % demoFeatures.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
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
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border-indigo-500/20">
              <Play className="h-3 w-3 mr-1" />
              Product Demo
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                See CortexBuild Pro
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                In Action
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Discover how UK construction companies are transforming their project management 
              with our comprehensive platform built specifically for the industry.
            </p>
          </div>

          {/* Video Player */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20">
              <video
                className="w-full h-full object-cover"
                controls
                poster="/og-image.png"
                preload="metadata"
              >
                <source src="/cortexbuild-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="absolute top-4 right-4 pointer-events-none">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1.5" />
                  PRODUCT DEMO
                </Badge>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-slate-700">45 second overview</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <Globe className="h-4 w-4 text-green-600" />
                <span className="text-sm text-slate-700">UK Focused</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-slate-700">CDM 2015 Compliant</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Platform Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore the comprehensive suite of tools designed specifically for UK construction professionals.
            </p>
          </div>

          {/* Feature Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {demoFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFeature === index
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {feature.title}
                </button>
              );
            })}
          </div>

          {/* Feature Detail Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left: Feature Info */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentFeature.color} flex items-center justify-center mb-6`}>
                  <IconComponent className="h-7 w-7 text-white" />
                </div>
                <div className="text-sm font-medium text-indigo-600 mb-2">
                  {currentFeature.subtitle}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  {currentFeature.title}
                </h3>
                <p className="text-slate-600 mb-8 text-lg">
                  {currentFeature.description}
                </p>
                
                <div className="space-y-3 mb-8">
                  {currentFeature.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${currentFeature.color} flex items-center justify-center flex-shrink-0`}>
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-slate-700">{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevFeature}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex gap-1.5">
                    {demoFeatures.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveFeature(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          activeFeature === i 
                            ? 'w-8 bg-gradient-to-r from-indigo-600 to-purple-600' 
                            : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextFeature}
                    className="rounded-full"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Right: Feature Preview */}
              <div className={`bg-gradient-to-br ${currentFeature.color} p-8 md:p-12 flex items-center justify-center min-h-[400px]`}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md border border-white/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{currentFeature.title}</div>
                      <div className="text-white/60 text-sm">Interactive Preview</div>
                    </div>
                  </div>
                  
                  {/* Simulated UI Elements */}
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-3 w-24 bg-white/40 rounded" />
                        <div className="h-3 w-12 bg-green-400/60 rounded" />
                      </div>
                      <div className="h-2 w-full bg-white/20 rounded-full">
                        <div className="h-2 w-3/4 bg-white/60 rounded-full" />
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-3 w-32 bg-white/40 rounded" />
                        <div className="h-3 w-16 bg-amber-400/60 rounded" />
                      </div>
                      <div className="h-2 w-full bg-white/20 rounded-full">
                        <div className="h-2 w-1/2 bg-white/60 rounded-full" />
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-3 w-20 bg-white/40 rounded" />
                        <div className="h-3 w-14 bg-blue-400/60 rounded" />
                      </div>
                      <div className="h-2 w-full bg-white/20 rounded-full">
                        <div className="h-2 w-5/6 bg-white/60 rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between text-white/80 text-sm">
                      <span>Live data sync</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 md:p-16 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <Quote className="h-12 w-12 text-white/30 mb-6" />
              <p className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-bold text-lg">{testimonial.author}</div>
                  <div className="text-indigo-200">{testimonial.role}</div>
                  <div className="text-indigo-200">{testimonial.company}</div>
                </div>
              </div>
              
              <div className="flex gap-1 mt-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why Construction Teams Choose Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built by construction professionals, for construction professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">UK-Specific</h3>
              <p className="text-slate-600">
                Built for UK regulations including CDM 2015, Building Safety Act, and HSE requirements. 
                Uses British English and pound sterling throughout.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Mobile-First</h3>
              <p className="text-slate-600">
                Access everything from site. Capture photos, log time, complete inspections, 
                and sign documents right from your phone or tablet.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Security</h3>
              <p className="text-slate-600">
                Bank-level encryption, UK data residency, role-based permissions, 
                and comprehensive audit trails for complete peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Projects?
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of UK construction companies already using CortexBuild Pro 
            to deliver projects on time and on budget.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Free 14-Day Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white px-8 py-4 text-base font-medium transition-colors"
            >
              Sign in to your account
            </Link>
          </div>
          
          <p className="text-indigo-200 text-sm mt-8">
            No credit card required • Full access to all features • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold">CortexBuild Pro</span>
            </div>
            <div className="text-sm">
              © {new Date().getFullYear()} CortexBuild Pro. Built for UK Construction.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
