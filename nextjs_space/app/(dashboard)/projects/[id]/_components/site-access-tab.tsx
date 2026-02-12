'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, Users, Search, Car, Badge as BadgeIcon, Check, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SignaturePad } from '@/components/ui/signature-pad';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/use-realtime';

interface SiteAccessTabProps {
  project: any;
  teamMembers: any[];
  siteAccessLogs: any[];
}

const roleTypes = ['Worker', 'Visitor', 'Delivery', 'Inspector', 'Client', 'Contractor', 'Consultant'];

export function SiteAccessTab({ project, siteAccessLogs: initialLogs }: SiteAccessTabProps) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs || []);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'on-site'>('on-site');

  const [signInForm, setSignInForm] = useState({
    personName: '',
    company: '',
    role: 'Worker',
    phone: '',
    vehicleReg: '',
    purpose: '',
    personVisiting: '',
    inductionCompleted: false,
    ppeProvided: false,
    briefingGiven: false,
    badgeNumber: '',
    signatureData: ''
  });

  useRealtimeSubscription(
    ['site_entry', 'site_exit'],
    useCallback(() => router.refresh(), [router])
  );

  // Calculate who is currently on site
  const entryLogs = logs.filter(l => l.accessType === 'ENTRY');
  const exitEntryIds = logs.filter(l => l.accessType === 'EXIT' && l.entryLogId).map(l => l.entryLogId);
  const onSiteLogs = entryLogs.filter(l => !exitEntryIds.includes(l.id));

  const displayedLogs = viewMode === 'on-site' ? onSiteLogs : logs;
  const filteredLogs = displayedLogs.filter(log =>
    log.personName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSignIn = async () => {
    if (!signInForm.personName) {
      toast.error('Name is required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signInForm,
          projectId: project.id,
          accessType: 'ENTRY'
        })
      });
      if (!response.ok) throw new Error('Failed');
      const created = await response.json();
      setLogs(prev => [created, ...prev]);
      setShowSignInModal(false);
      toast.success(`${signInForm.personName} signed in`);
      resetForm();
    } catch (error) {
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (signatureData: string) => {
    if (!selectedEntry) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/site-access/${selectedEntry.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData })
      });
      if (!response.ok) throw new Error('Failed');
      const exitLog = await response.json();
      setLogs(prev => [exitLog, ...prev]);
      setShowSignOutModal(false);
      setSelectedEntry(null);
      toast.success(`${selectedEntry.personName} signed out`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSignInForm({
      personName: '', company: '', role: 'Worker', phone: '', vehicleReg: '',
      purpose: '', personVisiting: '', inductionCompleted: false, ppeProvided: false,
      briefingGiven: false, badgeNumber: '', signatureData: ''
    });
  };

  const formatDuration = (entryTime: Date) => {
    const mins = differenceInMinutes(new Date(), new Date(entryTime));
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Site Access Log</h2>
          <p className="text-muted-foreground">Track personnel entering and exiting the site</p>
        </div>
        <Button onClick={() => setShowSignInModal(true)}>
          <LogIn className="h-4 w-4 mr-2" /> Sign In
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-green-600">{onSiteLogs.length}</div>
            <p className="text-green-700 dark:text-green-400 text-sm">Currently On Site</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{onSiteLogs.filter(l => l.role === 'Worker' || l.role === 'Contractor').length}</div>
            <p className="text-muted-foreground text-sm">Workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{onSiteLogs.filter(l => l.role === 'Visitor' || l.role === 'Client').length}</div>
            <p className="text-muted-foreground text-sm">Visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{logs.filter(l => l.accessType === 'ENTRY').length}</div>
            <p className="text-muted-foreground text-sm">Total Sign-ins Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or company..."
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <Button
            variant={viewMode === 'on-site' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('on-site')}
            className="rounded-none"
          >
            On Site ({onSiteLogs.length})
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('all')}
            className="rounded-none"
          >
            All Entries
          </Button>
        </div>
      </div>

      {/* List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{viewMode === 'on-site' ? 'No one currently on site' : 'No access logs'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredLogs.map((log) => {
            const isOnSite = viewMode === 'on-site' || (log.accessType === 'ENTRY' && !exitEntryIds.includes(log.id));
            return (
              <Card key={log.id} className={`${isOnSite && log.accessType === 'ENTRY' ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${log.accessType === 'ENTRY' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {log.accessType === 'ENTRY' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{log.personName}</h3>
                          <Badge variant="outline">{log.role || 'Worker'}</Badge>
                          {isOnSite && log.accessType === 'ENTRY' && (
                            <Badge className="bg-green-500">On Site</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {log.company && <span>{log.company}</span>}
                          {log.badgeNumber && <span className="flex items-center gap-1"><BadgeIcon className="h-3 w-3" /> {log.badgeNumber}</span>}
                          {log.vehicleReg && <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {log.vehicleReg}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{log.accessType === 'ENTRY' ? 'In' : 'Out'}: {format(new Date(log.accessTime), 'HH:mm')}</span>
                          {isOnSite && log.accessType === 'ENTRY' && (
                            <span className="text-green-600">({formatDuration(log.accessTime)} on site)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {log.inductionCompleted && <Badge variant="outline" className="text-xs"><Check className="h-3 w-3 mr-1" /> Inducted</Badge>}
                        {log.ppeProvided && <Badge variant="outline" className="text-xs"><Check className="h-3 w-3 mr-1" /> PPE</Badge>}
                      </div>
                      {isOnSite && log.accessType === 'ENTRY' && !exitEntryIds.includes(log.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedEntry(log); setShowSignOutModal(true); }}
                        >
                          <LogOut className="h-4 w-4 mr-1" /> Sign Out
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sign In Modal */}
      <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-green-500" /> Site Sign In</DialogTitle>
            <DialogDescription>Record a new site entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input
                  value={signInForm.personName}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, personName: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Company</label>
                <Input
                  value={signInForm.company}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select value={signInForm.role} onValueChange={(v) => setSignInForm(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleTypes.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Badge Number</label>
                <Input
                  value={signInForm.badgeNumber}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, badgeNumber: e.target.value }))}
                  placeholder="Badge #"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  value={signInForm.phone}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Contact number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Vehicle Reg</label>
                <Input
                  value={signInForm.vehicleReg}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, vehicleReg: e.target.value }))}
                  placeholder="AB12 CDE"
                />
              </div>
            </div>
            {(signInForm.role === 'Visitor' || signInForm.role === 'Client') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Purpose of Visit</label>
                  <Input
                    value={signInForm.purpose}
                    onChange={(e) => setSignInForm(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="Meeting, inspection..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Visiting</label>
                  <Input
                    value={signInForm.personVisiting}
                    onChange={(e) => setSignInForm(prev => ({ ...prev, personVisiting: e.target.value }))}
                    placeholder="Person's name"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Safety Compliance</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inducted"
                    checked={signInForm.inductionCompleted}
                    onCheckedChange={(checked) => setSignInForm(prev => ({ ...prev, inductionCompleted: !!checked }))}
                  />
                  <label htmlFor="inducted" className="text-sm text-foreground cursor-pointer">Induction Complete</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ppe"
                    checked={signInForm.ppeProvided}
                    onCheckedChange={(checked) => setSignInForm(prev => ({ ...prev, ppeProvided: !!checked }))}
                  />
                  <label htmlFor="ppe" className="text-sm text-foreground cursor-pointer">PPE Provided</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="briefing"
                    checked={signInForm.briefingGiven}
                    onCheckedChange={(checked) => setSignInForm(prev => ({ ...prev, briefingGiven: !!checked }))}
                  />
                  <label htmlFor="briefing" className="text-sm text-foreground cursor-pointer">Briefing Given</label>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Signature</label>
              <SignaturePad
                onSave={(sig) => setSignInForm(prev => ({ ...prev, signatureData: sig }))}
                onClear={() => setSignInForm(prev => ({ ...prev, signatureData: '' }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignInModal(false)}>Cancel</Button>
            <Button onClick={handleSignIn} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Out Modal */}
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LogOut className="h-5 w-5 text-gray-500" /> Site Sign Out</DialogTitle>
            <DialogDescription>Sign out {selectedEntry?.personName}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedEntry && (
              <div className="mb-4 p-3 bg-muted rounded">
                <p className="font-medium text-foreground">{selectedEntry.personName}</p>
                <p className="text-sm text-muted-foreground">{selectedEntry.company}</p>
                <p className="text-sm text-muted-foreground">Signed in: {format(new Date(selectedEntry.accessTime), 'HH:mm')} ({formatDuration(selectedEntry.accessTime)} on site)</p>
              </div>
            )}
            <label className="text-sm font-medium text-foreground">Signature</label>
            <SignaturePad
              onSave={handleSignOut}
              onClear={() => {}}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
