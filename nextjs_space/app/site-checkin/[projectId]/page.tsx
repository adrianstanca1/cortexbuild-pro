'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  User, 
  Phone, 
  Car, 
  FileText, 
  Users, 
  CheckCircle, 
  HardHat,
  Shield,
  ClipboardCheck,
  ArrowRightLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const roleOptions = [
  'Worker',
  'Subcontractor',
  'Visitor',
  'Delivery',
  'Inspector',
  'Client',
  'Consultant',
  'Other'
];

export default function SiteCheckinPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ name: string; onSiteCount: number } | null>(null);
  const [accessType, setAccessType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  
  const [form, setForm] = useState({
    personName: '',
    company: '',
    role: 'Worker',
    phone: '',
    vehicleReg: '',
    purpose: '',
    personVisiting: '',
    inductionCompleted: false,
    ppeProvided: false,
    briefingGiven: false
  });

  useEffect(() => {
    fetchProjectInfo();
  }, [projectId]);

  const fetchProjectInfo = async () => {
    try {
      const res = await fetch(`/api/site-access/checkin?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectInfo({ name: 'Construction Site', onSiteCount: data.onSiteCount });
      }
    } catch (error) {
      console.error('Failed to fetch project info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.personName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/site-access/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...form,
          accessType
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to process check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {accessType === 'ENTRY' ? 'Welcome!' : 'Goodbye!'}
            </h2>
            <p className="text-slate-300 mb-6">
              {accessType === 'ENTRY' 
                ? 'You have been successfully checked in.'
                : 'You have been successfully checked out.'}
            </p>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-300 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Safety Reminder</span>
              </div>
              <p className="text-sm text-yellow-200/80">
                Always wear appropriate PPE on site. Report any hazards immediately.
              </p>
            </div>
            <Button 
              onClick={() => {
                setSuccess(false);
                setForm({
                  personName: '',
                  company: '',
                  role: 'Worker',
                  phone: '',
                  vehicleReg: '',
                  purpose: '',
                  personVisiting: '',
                  inductionCompleted: false,
                  ppeProvided: false,
                  briefingGiven: false
                });
              }}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              New Check-in/out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <HardHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Site Check-in</h1>
          <p className="text-slate-400 mt-1">CortexBuild Pro</p>
          {projectInfo && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Users className="h-4 w-4 text-green-400" />
              <span className="text-white text-sm">
                {projectInfo.onSiteCount} currently on site
              </span>
            </div>
          )}
        </div>

        {/* Access Type Toggle */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setAccessType('ENTRY')}
                className={`flex-1 h-14 text-lg font-semibold transition-all ${
                  accessType === 'ENTRY'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <ArrowRightLeft className="h-5 w-5 mr-2" />
                Check IN
              </Button>
              <Button
                type="button"
                onClick={() => setAccessType('EXIT')}
                className={`flex-1 h-14 text-lg font-semibold transition-all ${
                  accessType === 'EXIT'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <ArrowRightLeft className="h-5 w-5 mr-2" />
                Check OUT
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={form.personName}
                    onChange={(e) => setForm({ ...form, personName: e.target.value })}
                    placeholder="Enter your full name"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Your company name"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role} className="bg-slate-800">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Vehicle Reg</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.vehicleReg}
                      onChange={(e) => setForm({ ...form, vehicleReg: e.target.value })}
                      placeholder="AB12 CDE"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {accessType === 'ENTRY' && (
                <>
                  <div>
                    <label className="text-sm text-slate-300 mb-1.5 block">Purpose of Visit</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={form.purpose}
                        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                        placeholder="e.g., Site inspection, Delivery"
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-1.5 block">Person Visiting</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={form.personVisiting}
                        onChange={(e) => setForm({ ...form, personVisiting: e.target.value })}
                        placeholder="Who are you meeting?"
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Safety Checkboxes */}
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium text-white block">Safety Compliance</label>
                    
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.inductionCompleted}
                        onChange={(e) => setForm({ ...form, inductionCompleted: e.target.checked })}
                        className="w-5 h-5 rounded border-white/30 bg-white/10"
                      />
                      <ClipboardCheck className="h-5 w-5 text-blue-400" />
                      <span className="text-slate-200">Site Induction Completed</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.ppeProvided}
                        onChange={(e) => setForm({ ...form, ppeProvided: e.target.checked })}
                        className="w-5 h-5 rounded border-white/30 bg-white/10"
                      />
                      <HardHat className="h-5 w-5 text-orange-400" />
                      <span className="text-slate-200">PPE Provided/Wearing</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.briefingGiven}
                        onChange={(e) => setForm({ ...form, briefingGiven: e.target.checked })}
                        className="w-5 h-5 rounded border-white/30 bg-white/10"
                      />
                      <Shield className="h-5 w-5 text-green-400" />
                      <span className="text-slate-200">Safety Briefing Received</span>
                    </label>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className={`w-full h-14 text-lg font-semibold transition-all ${
                  accessType === 'ENTRY'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                } text-white shadow-lg`}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {accessType === 'ENTRY' ? 'Check In' : 'Check Out'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs">
          Powered by CortexBuild Pro • Contactless Site Access
        </p>
      </div>
    </div>
  );
}
