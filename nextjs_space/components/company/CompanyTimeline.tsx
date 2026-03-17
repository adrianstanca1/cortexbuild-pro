"use client";

import React, { useMemo } from 'react';
import {
  Rocket, Activity, Clock, Calendar, CheckCircle2,
  AlertCircle, AlertTriangle, UserPlus, FileCheck,
  CreditCard, Settings, Loader2, Building2, Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface OnboardingLog {
  id: string;
  step: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'FAILED';
  timestamp: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CompanyTimelineProps {
  logs: OnboardingLog[];
}

export const CompanyTimeline: React.FC<CompanyTimelineProps> = ({ logs }) => {
  const sortedLogs = useMemo(() =>
    [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs]
  );

  const getStepIcon = (step: string) => {
    const s = step.toUpperCase();
    if (s.includes('COMPANY') || s.includes('INFO')) return { icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (s.includes('TEAM') || s.includes('INVITE')) return { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (s.includes('PLAN') || s.includes('BILLING')) return { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (s.includes('PROJECT') || s.includes('SETUP')) return { icon: Settings, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (s.includes('COMPLETE') || s.includes('FINISH')) return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
    if (s.includes('FAIL') || s.includes('ERROR')) return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
    return { icon: Activity, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-zinc-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="relative space-y-6 py-4 px-2">
      {/* Central Connector Line */}
      <div className="absolute left-[28px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/40 via-zinc-100 to-transparent" />

      {sortedLogs.length > 0 ? (
        sortedLogs.map((log, idx) => {
          const { icon: Icon, color, bg } = getStepIcon(log.step);
          const date = new Date(log.timestamp);

          return (
            <div key={log.id} className="relative pl-16 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Timeline Dot with Icon */}
              <div className={`absolute left-0 top-0 w-14 h-14 rounded-2xl ${bg} ${color} border-4 border-white shadow-xl flex items-center justify-center transition-all group-hover:scale-110 z-10 ring-1 ring-zinc-100`}>
                <Icon size={24} strokeWidth={2.5} />
              </div>

              <Card className="p-6 group-hover:shadow-md group-hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={`${bg} ${color} border-current opacity-70 text-[9px] font-black uppercase tracking-widest`}>
                      {log.step.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> {date.toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-zinc-900 uppercase tracking-tight leading-tight">
                    {log.description || "Onboarding step recorded."}
                  </h4>

                  {getStatusBadge(log.status)}

                  {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-[10px] font-mono text-zinc-500 space-y-1 overflow-hidden">
                       {Object.entries(log.metadata).map(([k, v]) => (
                         <div key={k} className="flex gap-2">
                           <span className="text-primary font-black uppercase tracking-tighter shrink-0">{k}:</span>
                           <span className="truncate italic">"{JSON.stringify(v)}"</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })
      ) : (
        <Card className="py-16 px-8 text-center border-2 border-dashed border-zinc-100 bg-zinc-50/50">
          <Rocket size={48} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Onboarding Not Started</p>
          <p className="text-zinc-400 text-[10px] mt-1 uppercase font-bold">Begin your company setup journey.</p>
        </Card>
      )}
    </div>
  );
};

export default CompanyTimeline;
