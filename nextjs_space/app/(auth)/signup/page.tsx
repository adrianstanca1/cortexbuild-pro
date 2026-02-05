"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HardHat, Mail, Lock, User, Loader2, ArrowRight, Zap, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const benefits = [
  { icon: Zap, title: "Get Started in Minutes", desc: "Quick setup, no credit card required" },
  { icon: Clock, title: "14-Day Free Trial", desc: "Full access to all Pro features" },
  { icon: Award, title: "Dedicated Support", desc: "Expert help when you need it" }
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create account");
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        toast.error("Account created but login failed. Please sign in.");
        router.push("/login");
      } else {
        toast.success("Account created successfully!");
        router.replace("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-xl">
                <HardHat className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-slate-900">CortexBuild</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white">PRO</span>
              </div>
            </Link>
          </div>
          
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Create your account</h2>
            <p className="text-slate-500 mt-2">Start your 14-day free trial today</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Work email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight className="h-5 w-5 ml-2" /></>
                )}
              </Button>
              
              <p className="text-xs text-slate-500 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-white">CortexBuild</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white">PRO</span>
            </div>
          </Link>
          
          {/* Main Content */}
          <div className="space-y-10">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Start building smarter today</h1>
              <p className="text-lg text-slate-400">Join thousands of construction professionals who trust CortexBuild Pro.</p>
            </div>
            
            <div className="space-y-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                    <p className="text-slate-400">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Testimonial */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <p className="text-white/90 mb-4">
                &quot;CortexBuild has transformed how we manage our construction projects. The time savings alone have been incredible.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  JM
                </div>
                <div>
                  <p className="font-medium text-white">James Morrison</p>
                  <p className="text-sm text-slate-400">Director, Morrison Construction</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <p className="text-slate-500 text-sm">&copy; 2026 CortexBuild Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
