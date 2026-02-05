'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Award, AlertTriangle, Check, Calendar, User, Search, Filter, Loader2, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, differenceInDays, addDays } from 'date-fns';
import { useRealtimeSubscription } from '@/components/realtime-provider';

interface CertificationsTabProps {
  teamMembers: any[];
  certifications: any[];
}

const certificationTypes = [
  { value: 'CSCS_CARD', label: 'CSCS Card', description: 'Construction Skills Certification Scheme' },
  { value: 'CPCS_CARD', label: 'CPCS Card', description: 'Plant Operator Certificate' },
  { value: 'IPAF_LICENSE', label: 'IPAF License', description: 'MEWP/Cherry Picker Operator' },
  { value: 'PASMA_CERTIFICATE', label: 'PASMA', description: 'Mobile Tower Scaffold' },
  { value: 'FIRST_AID', label: 'First Aid', description: 'First Aid at Work' },
  { value: 'FIRE_MARSHAL', label: 'Fire Marshal', description: 'Fire Warden Training' },
  { value: 'ASBESTOS_AWARENESS', label: 'Asbestos Awareness', description: 'Category A Asbestos' },
  { value: 'MANUAL_HANDLING', label: 'Manual Handling', description: 'Safe Lifting Techniques' },
  { value: 'WORKING_AT_HEIGHT', label: 'Working at Height', description: 'Height Safety Training' },
  { value: 'CONFINED_SPACE', label: 'Confined Space', description: 'CS Entry Training' },
  { value: 'HOT_WORK', label: 'Hot Work', description: 'Fire Prevention Training' },
  { value: 'SLINGER_SIGNALLER', label: 'Slinger/Signaller', description: 'Crane Slinger Certificate' },
  { value: 'CRANE_OPERATOR', label: 'Crane Operator', description: 'Crane Operation License' },
  { value: 'EXCAVATOR_OPERATOR', label: 'Excavator Operator', description: 'Plant Machine Operation' },
  { value: 'FORKLIFT_OPERATOR', label: 'Forklift Operator', description: 'Industrial Truck License' },
  { value: 'ELECTRICIAN_LICENSE', label: 'Electrician License', description: 'Electrical Competence' },
  { value: 'GAS_SAFE', label: 'Gas Safe', description: 'Gas Safe Registered' },
  { value: 'SSSTS', label: 'SSSTS', description: 'Site Supervisor Safety' },
  { value: 'SMSTS', label: 'SMSTS', description: 'Site Manager Safety' },
  { value: 'OTHER', label: 'Other', description: 'Other Certification' }
];

export function CertificationsTab({ teamMembers, certifications: initialCerts }: CertificationsTabProps) {
  const router = useRouter();
  const [certifications, setCertifications] = useState(initialCerts || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    workerId: '',
    certificationType: '',
    certificationName: '',
    cardNumber: '',
    issuingBody: '',
    issueDate: '',
    expiryDate: '',
    isLifetime: false,
    notes: ''
  });

  useRealtimeSubscription(
    ['certification_created', 'certification_updated', 'certification_deleted'],
    useCallback(() => router.refresh(), [router])
  );

  const getExpiryStatus = (cert: any) => {
    if (cert.isLifetime) return { status: 'valid', label: 'Lifetime', color: 'bg-green-500' };
    if (!cert.expiryDate) return { status: 'unknown', label: 'No Expiry', color: 'bg-gray-500' };
    
    const daysUntilExpiry = differenceInDays(new Date(cert.expiryDate), new Date());
    
    if (daysUntilExpiry < 0) return { status: 'expired', label: 'Expired', color: 'bg-red-500' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', label: `${daysUntilExpiry}d left`, color: 'bg-orange-500' };
    if (daysUntilExpiry <= 90) return { status: 'warning', label: `${daysUntilExpiry}d left`, color: 'bg-yellow-500' };
    return { status: 'valid', label: 'Valid', color: 'bg-green-500' };
  };

  // Filter certifications
  const filteredCerts = certifications.filter(cert => {
    const matchesSearch = 
      cert.worker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.cardNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || cert.certificationType === filterType;
    
    const expiryInfo = getExpiryStatus(cert);
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'expired' && expiryInfo.status === 'expired') ||
      (filterStatus === 'expiring' && (expiryInfo.status === 'expiring' || expiryInfo.status === 'warning')) ||
      (filterStatus === 'valid' && expiryInfo.status === 'valid');
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const expiredCount = certifications.filter(c => getExpiryStatus(c).status === 'expired').length;
  const expiringCount = certifications.filter(c => ['expiring', 'warning'].includes(getExpiryStatus(c).status)).length;

  const handleCreate = async () => {
    if (!form.workerId || !form.certificationType || !form.issueDate) {
      toast.error('Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          certificationName: form.certificationName || certificationTypes.find(t => t.value === form.certificationType)?.label
        })
      });
      if (!response.ok) throw new Error('Failed');
      const created = await response.json();
      setCertifications(prev => [created, ...prev]);
      setShowCreateModal(false);
      toast.success('Certification added');
      resetForm();
    } catch (error) {
      toast.error('Failed to add certification');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const response = await fetch(`/api/certifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true })
      });
      if (!response.ok) throw new Error('Failed');
      toast.success('Certification verified');
      router.refresh();
    } catch (error) {
      toast.error('Failed to verify');
    }
  };

  const resetForm = () => {
    setForm({
      workerId: '', certificationType: '', certificationName: '', cardNumber: '',
      issuingBody: '', issueDate: '', expiryDate: '', isLifetime: false, notes: ''
    });
  };

  // Group by worker
  type WorkerGroup = { worker: any; certs: any[] };
  const groupedByWorker: Record<string, WorkerGroup> = filteredCerts.reduce((acc: Record<string, WorkerGroup>, cert: any) => {
    const workerId = cert.workerId;
    if (!acc[workerId]) {
      acc[workerId] = { worker: cert.worker, certs: [] };
    }
    acc[workerId].certs.push(cert);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Worker Certifications</h2>
          <p className="text-muted-foreground">Track training and qualification records</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Certification
        </Button>
      </div>

      {/* Alerts */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredCount > 0 && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <div className="font-bold text-red-600">{expiredCount} Expired Certifications</div>
                  <p className="text-sm text-red-500">Require immediate attention</p>
                </div>
              </CardContent>
            </Card>
          )}
          {expiringCount > 0 && (
            <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="font-bold text-orange-600">{expiringCount} Expiring Soon</div>
                  <p className="text-sm text-orange-500">Within next 90 days</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{certifications.length}</div>
            <p className="text-muted-foreground text-sm">Total Certifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{certifications.filter(c => getExpiryStatus(c).status === 'valid').length}</div>
            <p className="text-muted-foreground text-sm">Valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{certifications.filter(c => c.isVerified).length}</div>
            <p className="text-muted-foreground text-sm">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{Object.keys(groupedByWorker).length}</div>
            <p className="text-muted-foreground text-sm">Workers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, cert type, or card number..."
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cert Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {certificationTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List grouped by worker */}
      {Object.keys(groupedByWorker).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No certifications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByWorker).map(({ worker, certs }) => (
            <Card key={worker?.id || 'unknown'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{worker?.name || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground">{worker?.email}</p>
                  </div>
                  <Badge className="ml-auto">{certs.length} certs</Badge>
                </div>
                <div className="grid gap-3">
                  {certs.map((cert: any) => {
                    const expiryInfo = getExpiryStatus(cert);
                    return (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-primary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{cert.certificationName}</span>
                              <Badge className={expiryInfo.color}>{expiryInfo.label}</Badge>
                              {cert.isVerified && <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" /> Verified</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              {cert.cardNumber && <span>#{cert.cardNumber}</span>}
                              {cert.issuingBody && <span>{cert.issuingBody}</span>}
                              {cert.expiryDate && !cert.isLifetime && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Expires: {format(new Date(cert.expiryDate), 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!cert.isVerified && (
                          <Button size="sm" variant="outline" onClick={() => handleVerify(cert.id)}>
                            <Shield className="h-4 w-4 mr-1" /> Verify
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Add Certification</DialogTitle>
            <DialogDescription>Record a worker's certification or training</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Worker *</label>
              <Select value={form.workerId} onValueChange={(v) => setForm(prev => ({ ...prev, workerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.filter(m => m?.user?.id || m?.id).map(member => (
                    <SelectItem key={member.user?.id || member.id} value={member.user?.id || member.id}>
                      {member.user?.name || member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Certification Type *</label>
              <Select value={form.certificationType} onValueChange={(v) => {
                const certType = certificationTypes.find(t => t.value === v);
                setForm(prev => ({ ...prev, certificationType: v, certificationName: certType?.label || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {certificationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Card/Cert Number</label>
                <Input
                  value={form.cardNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="Certificate number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Issuing Body</label>
                <Input
                  value={form.issuingBody}
                  onChange={(e) => setForm(prev => ({ ...prev, issuingBody: e.target.value }))}
                  placeholder="e.g., CITB, IPAF"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Issue Date *</label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expiry Date</label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  disabled={form.isLifetime}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lifetime"
                checked={form.isLifetime}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, isLifetime: !!checked, expiryDate: '' }))}
              />
              <label htmlFor="lifetime" className="text-sm text-foreground cursor-pointer">Lifetime certification (no expiry)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
