"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2, Users, Briefcase, Target, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, Sparkles, AlertCircle,
  Building, UserPlus, CreditCard, Settings, Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CompanyTimeline, { OnboardingLog } from "@/components/company/CompanyTimeline";
import CompanyCard from "@/components/company/CompanyCard";

type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface OnboardingData {
  status: OnboardingStatus;
  currentStep: number;
  companyInfo: {
    name: string;
    industry: string;
    size: string;
    description?: string;
  };
  teamInvites: { email: string; name: string; role: string }[];
  planSelection: string;
  projectSetup: { name: string; code: string } | null;
}

const STEPS = [
  { id: 1, title: "Company Info", description: "Basic details", icon: Building2 },
  { id: 2, title: "Team Invitation", description: "Add members", icon: Users },
  { id: 3, title: "Plan Selection", description: "Choose plan", icon: Briefcase },
  { id: 4, title: "Project Setup", description: "Initial project", icon: Target },
];

const INDUSTRIES = [
  "Commercial Construction",
  "Residential Construction",
  "Industrial Construction",
  "Infrastructure",
  "Healthcare Construction",
  "Government",
  "Other"
];

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

const PLANS = [
  { id: "starter", name: "Starter", price: "$29/mo", features: ["Up to 10 users", "5 projects", "10GB storage"] },
  { id: "business", name: "Business", price: "$79/mo", features: ["Up to 50 users", "Unlimited projects", "100GB storage", "Priority support"] },
  { id: "enterprise", name: "Enterprise", price: "$199/mo", features: ["Unlimited users", "Unlimited projects", "1TB storage", "24/7 support", "Custom integrations"] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('NOT_STARTED');
  const [logs, setLogs] = useState<OnboardingLog[]>([]);

  const [formData, setFormData] = useState<OnboardingData>({
    status: 'NOT_STARTED',
    currentStep: 0,
    companyInfo: { name: '', industry: '', size: '' },
    teamInvites: [],
    planSelection: '',
    projectSetup: null,
  });

  const [stepData, setStepData] = useState({
    companyInfo: { name: '', industry: '', size: '', description: '' },
    teamInvite: { email: '', name: '', role: 'FIELD_WORKER' },
    plan: '',
    project: { name: '', code: '' },
  });

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchOnboardingState();
    }
  }, [sessionStatus]);

  const fetchOnboardingState = async () => {
    try {
      const res = await fetch('/api/onboarding');
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
        setOnboardingStatus(data.status);
        setCurrentStep(data.currentStep || 1);
        if (data.companyInfo) setStepData(s => ({ ...s, companyInfo: { ...s.companyInfo, ...data.companyInfo } }));
        if (data.planSelection) setStepData(s => ({ ...s, plan: data.planSelection }));
      }
    } catch (error) {
      console.error("Error fetching onboarding state:", error);
    } finally {
      setLoading(false);
    }
  };

  const logStep = async (step: string, status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'FAILED', description?: string, metadata?: Record<string, any>) => {
    const newLog: OnboardingLog = {
      id: crypto.randomUUID(),
      step,
      status,
      timestamp: new Date().toISOString(),
      description,
      metadata,
    };
    setLogs(prev => [newLog, ...prev]);

    // Persist to API
    try {
      await fetch('/api/onboarding/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch (error) {
      console.error("Error logging step:", error);
    }
  };

  const handleStart = () => {
    setOnboardingStatus('IN_PROGRESS');
    setCurrentStep(1);
    logStep('COMPANY_INFO', 'IN_PROGRESS', 'Started company information step');
  };

  const handleResume = () => {
    setCurrentStep(formData.currentStep || 1);
    logStep('RESUMED', 'IN_PROGRESS', 'Resumed onboarding');
  };

  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stepData.companyInfo.name || !stepData.companyInfo.industry || !stepData.companyInfo.size) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          companyInfo: stepData.companyInfo,
        }),
      });

      if (res.ok) {
        logStep('COMPANY_INFO', 'COMPLETE', 'Company information saved', stepData.companyInfo);
        logStep('TEAM_INVITE', 'IN_PROGRESS', 'Ready for team invitation');
        toast.success("Company info saved!");
        setCurrentStep(2);
      } else {
        toast.error("Failed to save company info");
      }
    } catch (error) {
      toast.error("Error saving company info");
    }
  };

  const handleTeamInviteSubmit = async () => {
    if (!stepData.teamInvite.email || !stepData.teamInvite.name) {
      toast.error("Email and name are required");
      return;
    }

    try {
      const res = await fetch('/api/company/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: stepData.teamInvite.email,
          name: stepData.teamInvite.name,
          role: stepData.teamInvite.role,
        }),
      });

      if (res.ok) {
        const newInvite = { ...stepData.teamInvite };
        setFormData(prev => ({
          ...prev,
          teamInvites: [...prev.teamInvites, newInvite],
        }));
        logStep('TEAM_INVITE', 'COMPLETE', `Invitation sent to ${newInvite.name}`, { email: newInvite.email });
        logStep('PLAN_SELECTION', 'IN_PROGRESS', 'Ready for plan selection');
        toast.success("Invitation sent!");
        setStepData(s => ({ ...s, teamInvite: { email: '', name: '', role: 'FIELD_WORKER' } }));
        setCurrentStep(3);
      } else {
        toast.error("Failed to send invitation");
      }
    } catch (error) {
      toast.error("Error sending invitation");
    }
  };

  const handlePlanSelect = async (planId: string) => {
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 3, planSelection: planId }),
      });

      if (res.ok) {
        logStep('PLAN_SELECTION', 'COMPLETE', `Selected ${planId} plan`, { planId });
        logStep('PROJECT_SETUP', 'IN_PROGRESS', 'Ready for project setup');
        toast.success("Plan selected!");
        setCurrentStep(4);
      } else {
        toast.error("Failed to select plan");
      }
    } catch (error) {
      toast.error("Error selecting plan");
    }
  };

  const handleProjectSetup = async () => {
    if (!stepData.project.name || !stepData.project.code) {
      toast.error("Project name and code are required");
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stepData.project.name,
          code: stepData.project.code,
          status: 'PLANNING',
        }),
      });

      if (res.ok) {
        logStep('PROJECT_SETUP', 'COMPLETE', `Project ${stepData.project.name} created`, stepData.project);
        logStep('ONBOARDING_COMPLETE', 'COMPLETE', 'Onboarding completed successfully');
        setOnboardingStatus('COMPLETED');
        toast.success("Onboarding complete! Redirecting...");
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        toast.error("Failed to create project");
      }
    } catch (error) {
      toast.error("Error creating project");
    }
  };

  const skipStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      setOnboardingStatus('COMPLETED');
      router.push('/dashboard');
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (onboardingStatus === 'COMPLETED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
        <Card className="max-w-md p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Onboarding Complete!</h1>
          <p className="text-zinc-500">Your company is all set up. Redirecting to dashboard...</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/5">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/company')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" /> Company Onboarding
              </h1>
              <p className="text-zinc-500 mt-1">Set up your company in minutes</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {currentStep} of {STEPS.length}
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = idx + 1 === currentStep;
            const isCompleted = idx + 1 < currentStep;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-3 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-50' : 'opacity-30'}`}>
                  <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                        ? 'bg-primary border-primary text-white shadow-lg'
                        : 'bg-white border-zinc-200 text-zinc-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold uppercase">{step.title}</p>
                    <p className="text-xs text-zinc-400">{step.description}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Step Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-primary" /> Company Information
                      </h2>
                      <p className="text-zinc-500 mt-2">Tell us about your company</p>
                    </div>

                    <form onSubmit={handleCompanyInfoSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Company Name *</Label>
                        <Input
                          id="name"
                          placeholder="Acme Construction Ltd"
                          value={stepData.companyInfo.name}
                          onChange={(e) => setStepData(s => ({ ...s, companyInfo: { ...s.companyInfo, name: e.target.value } }))}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry *</Label>
                        <select
                          id="industry"
                          value={stepData.companyInfo.industry}
                          onChange={(e) => setStepData(s => ({ ...s, companyInfo: { ...s.companyInfo, industry: e.target.value } }))}
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200 focus:border-primary focus:ring-primary"
                        >
                          <option value="">Select industry</option>
                          {INDUSTRIES.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="size">Company Size *</Label>
                        <select
                          id="size"
                          value={stepData.companyInfo.size}
                          onChange={(e) => setStepData(s => ({ ...s, companyInfo: { ...s.companyInfo, size: e.target.value } }))}
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200 focus:border-primary focus:ring-primary"
                        >
                          <option value="">Select size</option>
                          {SIZES.map(size => (
                            <option key={size} value={size}>{size} employees</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <textarea
                          id="description"
                          placeholder="Brief description of your company..."
                          value={stepData.companyInfo.description}
                          onChange={(e) => setStepData(s => ({ ...s, companyInfo: { ...s.companyInfo, description: e.target.value } }))}
                          className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary focus:ring-primary resize-none"
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={skipStep}>Skip</Button>
                        <Button type="submit" className="flex-1">
                          Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <UserPlus className="h-6 w-6 text-primary" /> Team Invitation
                      </h2>
                      <p className="text-zinc-500 mt-2">Invite team members to join</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteName">Full Name *</Label>
                        <Input
                          id="inviteName"
                          placeholder="John Doe"
                          value={stepData.teamInvite.name}
                          onChange={(e) => setStepData(s => ({ ...s, teamInvite: { ...s.teamInvite, name: e.target.value } }))}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email *</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="john@company.com"
                          value={stepData.teamInvite.email}
                          onChange={(e) => setStepData(s => ({ ...s, teamInvite: { ...s.teamInvite, email: e.target.value } }))}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          value={stepData.teamInvite.role}
                          onChange={(e) => setStepData(s => ({ ...s, teamInvite: { ...s.teamInvite, role: e.target.value } }))}
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200"
                        >
                          <option value="FIELD_WORKER">Field Worker</option>
                          <option value="PROJECT_MANAGER">Project Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>

                      {formData.teamInvites.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-bold uppercase mb-3">Pending Invitations</h4>
                          <div className="space-y-2">
                            {formData.teamInvites.map((invite, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                                <div>
                                  <p className="font-medium">{invite.name}</p>
                                  <p className="text-sm text-zinc-500">{invite.email}</p>
                                </div>
                                <Badge variant="outline">{invite.role.replace('_', ' ')}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="button" variant="outline" onClick={handleTeamInviteSubmit}>
                          Add Another
                        </Button>
                        <Button onClick={skipStep} className="flex-1">
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-primary" /> Plan Selection
                    </h2>
                    <p className="text-zinc-500 mt-2">Choose the plan that fits your needs</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {PLANS.map((plan, idx) => (
                      <Card
                        key={plan.id}
                        className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                          stepData.plan === plan.id ? 'ring-2 ring-primary border-primary' : 'border-zinc-200'
                        }`}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase">{plan.name}</h3>
                            {plan.id === 'business' && (
                              <Badge className="bg-amber-100 text-amber-700">Popular</Badge>
                            )}
                          </div>
                          <p className="text-3xl font-bold">{plan.price}</p>
                          <ul className="space-y-2">
                            {plan.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button
                            className={`w-full ${stepData.plan === plan.id ? 'bg-primary' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}
                          >
                            {stepData.plan === plan.id ? 'Selected' : 'Select Plan'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={skipStep} className="flex-1">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <Card className="p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Settings className="h-6 w-6 text-primary" /> Project Setup
                      </h2>
                      <p className="text-zinc-500 mt-2">Create your first project</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectName">Project Name *</Label>
                        <Input
                          id="projectName"
                          placeholder="Downtown Office Complex"
                          value={stepData.project.name}
                          onChange={(e) => setStepData(s => ({ ...s, project: { ...s.project, name: e.target.value } }))}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="projectCode">Project Code *</Label>
                        <Input
                          id="projectCode"
                          placeholder="PRJ-2026-001"
                          value={stepData.project.code}
                          onChange={(e) => setStepData(s => ({ ...s, project: { ...s.project, code: e.target.value } }))}
                          className="h-12"
                        />
                      </div>

                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-sm text-zinc-600">
                          <Sparkles className="h-4 w-4 inline mr-2 text-primary" />
                          You can add more projects later from the dashboard.
                        </p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button variant="outline" onClick={() => setCurrentStep(3)}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button onClick={handleProjectSetup} className="flex-1">
                          <Zap className="mr-2 h-4 w-4" /> Complete Setup
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Timeline & Progress */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">Onboarding Progress</h3>
              <div className="space-y-4">
                {STEPS.map((step, idx) => {
                  const isActive = idx + 1 === currentStep;
                  const isCompleted = idx + 1 < currentStep;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive ? 'bg-primary/5 border border-primary/20' : 'bg-zinc-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={14} /> : <StepIcon size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-zinc-700'}`}>{step.title}</p>
                        <p className="text-xs text-zinc-400">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">Activity Log</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <CompanyTimeline logs={logs} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
