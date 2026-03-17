"use client";

import React from 'react';
import {
  Building2, Users, Target, CheckCircle2,
  AlertTriangle, Loader2, ArrowRight, Sparkles,
  Rocket, Shield, Zap, Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'LOCKED';
  icon: React.ElementType;
}

interface CompanyCardProps {
  company?: {
    id: string;
    name: string;
    industry?: string;
    size?: string;
    logoUrl?: string;
    status?: string;
  };
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  onStart?: () => void;
  onResume?: () => void;
  onNavigate?: (step: number) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  currentStep,
  totalSteps,
  steps,
  onStart,
  onResume,
  onNavigate
}) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  const completedSteps = steps.filter(s => s.status === 'COMPLETE').length;
  const inProgressStep = steps.find(s => s.status === 'IN_PROGRESS');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'LOCKED': return 'bg-zinc-100 text-zinc-400 border-zinc-200';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  const stepIcons: Record<string, React.ElementType> = {
    COMPANY_INFO: Building2,
    TEAM_INVITE: Users,
    PLAN_SELECTION: Briefcase,
    PROJECT_SETUP: Target,
  };

  return (
    <Card className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden ring-1 ring-transparent hover:ring-primary/10 animate-in fade-in zoom-in-95 duration-500 h-full">
      {/* Status Badge */}
      <div className="absolute top-0 right-0 z-10">
        <div className={`px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-[0.2em] border-b border-l flex items-center gap-2 transition-all ${getStatusColor(inProgressStep ? 'IN_PROGRESS' : completedSteps === totalSteps ? 'COMPLETE' : 'PENDING')}`}>
          {completedSteps === totalSteps ? (
            <><CheckCircle2 size={10} className="text-emerald-500" /> COMPLETE</>
          ) : inProgressStep ? (
            <><Loader2 size={10} className="text-blue-500 animate-spin" /> IN PROGRESS</>
          ) : (
            <><AlertTriangle size={10} className="text-amber-500" /> PENDING</>
          )}
        </div>
      </div>

      {/* Logo & Header */}
      <div className="flex items-start gap-6 mb-8 mt-2">
        <div className="w-20 h-20 bg-zinc-50 rounded-[1.75rem] flex items-center justify-center border border-zinc-100 shadow-inner overflow-hidden shrink-0">
          {company?.logoUrl ? (
            <img src={company.logoUrl} className="w-full h-full object-cover" alt="Logo" />
          ) : (
            <Building2 size={36} className="text-zinc-200" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-zinc-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
              {company?.status || 'DRAFT'}
            </span>
            {completedSteps === totalSteps && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Sparkles size={10} className="mr-1" /> Ready
              </Badge>
            )}
          </div>
          <h3 className="text-2xl font-black text-zinc-900 truncate uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">
            {company?.name || 'New Company'}
          </h3>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-zinc-200 uppercase">
              {company?.name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Company Owner</p>
              <p className="text-xs font-bold text-zinc-700 truncate uppercase tracking-tight">Your Account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6 mb-8">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
            <span className="flex items-center gap-1.5"><Rocket size={12} /> Onboarding Progress</span>
            <span className="text-zinc-900">{completedSteps} / {totalSteps} Steps</span>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.4)] transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase text-zinc-500">Team Size</span>
            </div>
            <p className="text-lg font-bold text-zinc-900">{company?.size || '1'} member{company?.size === '1' ? '' : 's'}</p>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase text-zinc-500">Industry</span>
            </div>
            <p className="text-lg font-bold text-zinc-900 truncate">{company?.industry || 'Construction'}</p>
          </div>
        </div>
      </div>

      {/* Steps Overview */}
      <div className="space-y-3 mb-8">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Setup Steps</h4>
        {steps.map((step, idx) => {
          const Icon = stepIcons[step.id] || step.icon;
          const isCurrent = step.status === 'IN_PROGRESS';
          const isLocked = step.status === 'LOCKED';

          return (
            <button
              key={step.id}
              onClick={() => !isLocked && onNavigate?.(idx + 1)}
              disabled={isLocked}
              className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                isCurrent
                  ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                  : isLocked
                    ? 'bg-zinc-50 border-zinc-100 opacity-60 cursor-not-allowed'
                    : 'bg-white border-zinc-100 hover:border-zinc-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                step.status === 'COMPLETE'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : isCurrent
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-zinc-50 border-zinc-100 text-zinc-300'
              }`}>
                {step.status === 'COMPLETE' ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold uppercase tracking-tight ${isLocked ? 'text-zinc-400' : 'text-zinc-900'}`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-zinc-400">{step.description}</p>
              </div>
              {isCurrent && <ArrowRight size={16} className="text-primary" />}
            </button>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-6 border-t border-zinc-50">
        {completedSteps === 0 ? (
          <Button
            onClick={onStart}
            className="w-full py-4 bg-zinc-950 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            <Zap size={16} className="group-hover:rotate-12 transition-transform" /> Start Setup
          </Button>
        ) : completedSteps === totalSteps ? (
          <Button
            onClick={onStart}
            className="w-full py-4 bg-emerald-600 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Go to Dashboard
          </Button>
        ) : (
          <Button
            onClick={onResume}
            className="w-full py-4 bg-primary text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Rocket size={16} /> Resume Setup
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CompanyCard;
