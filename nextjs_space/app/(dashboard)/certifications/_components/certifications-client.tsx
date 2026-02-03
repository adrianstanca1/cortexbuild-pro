"use client";

import { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  User,
  Calendar,
  Building2,
  CreditCard,
  Shield,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  HardHat,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';

const CERTIFICATION_TYPES = [
  { value: 'CSCS_CARD', label: 'CSCS Card', color: 'bg-blue-500' },
  { value: 'CPCS_CARD', label: 'CPCS Card', color: 'bg-purple-500' },
  { value: 'IPAF_LICENSE', label: 'IPAF License', color: 'bg-green-500' },
  { value: 'PASMA_CERTIFICATE', label: 'PASMA Certificate', color: 'bg-yellow-500' },
  { value: 'FIRST_AID', label: 'First Aid', color: 'bg-red-500' },
  { value: 'FIRE_MARSHAL', label: 'Fire Marshal', color: 'bg-orange-500' },
  { value: 'ASBESTOS_AWARENESS', label: 'Asbestos Awareness', color: 'bg-gray-500' },
  { value: 'MANUAL_HANDLING', label: 'Manual Handling', color: 'bg-teal-500' },
  { value: 'WORKING_AT_HEIGHT', label: 'Working at Height', color: 'bg-indigo-500' },
  { value: 'CONFINED_SPACE', label: 'Confined Space', color: 'bg-pink-500' },
  { value: 'HOT_WORK', label: 'Hot Work', color: 'bg-amber-500' },
  { value: 'SLINGER_SIGNALLER', label: 'Slinger/Signaller', color: 'bg-cyan-500' },
  { value: 'CRANE_OPERATOR', label: 'Crane Operator', color: 'bg-emerald-500' },
  { value: 'EXCAVATOR_OPERATOR', label: 'Excavator Operator', color: 'bg-lime-500' },
  { value: 'FORKLIFT_OPERATOR', label: 'Forklift Operator', color: 'bg-rose-500' },
  { value: 'ELECTRICIAN_LICENSE', label: 'Electrician License', color: 'bg-violet-500' },
  { value: 'GAS_SAFE', label: 'Gas Safe', color: 'bg-sky-500' },
  { value: 'SSSTS', label: 'SSSTS', color: 'bg-fuchsia-500' },
  { value: 'SMSTS', label: 'SMSTS', color: 'bg-stone-500' },
  { value: 'OTHER', label: 'Other', color: 'bg-slate-500' }
];

interface CertificationsClientProps {
  initialCertifications: any[];
  teamMembers: any[];
  stats: {
    total: number;
    verified: number;
    expiringSoon: number;
    expired: number;
    byType: any[];
  };
}

export default function CertificationsClient({ 
  initialCertifications, 
  teamMembers, 
  stats 
}: CertificationsClientProps) {
  const [certifications, setCertifications] = useState(initialCertifications);
  const [filteredCertifications, setFilteredCertifications] = useState(initialCertifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'expired' | 'matrix'>('all');
  
  const [formData, setFormData] = useState({
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

  // Filter certifications when search/filter changes
  useEffect(() => {
    let filtered = [...certifications];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.certificationName?.toLowerCase().includes(query) ||
        c.worker?.name?.toLowerCase().includes(query) ||
        c.cardNumber?.toLowerCase().includes(query)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.certificationType === filterType);
    }
    
    if (filterStatus !== 'all') {
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      
      switch (filterStatus) {
        case 'valid':
          filtered = filtered.filter(c => c.isLifetime || !c.expiryDate || new Date(c.expiryDate) > thirtyDays);
          break;
        case 'expiring':
          filtered = filtered.filter(c => !c.isLifetime && c.expiryDate && new Date(c.expiryDate) <= thirtyDays && new Date(c.expiryDate) >= now);
          break;
        case 'expired':
          filtered = filtered.filter(c => !c.isLifetime && c.expiryDate && new Date(c.expiryDate) < now);
          break;
      }
    }
    
    // Apply tab filter
    if (activeTab === 'expiring') {
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      filtered = filtered.filter(c => !c.isLifetime && c.expiryDate && new Date(c.expiryDate) <= thirtyDays && new Date(c.expiryDate) >= now);
    } else if (activeTab === 'expired') {
      const now = new Date();
      filtered = filtered.filter(c => !c.isLifetime && c.expiryDate && new Date(c.expiryDate) < now);
    }
    
    setFilteredCertifications(filtered);
  }, [certifications, searchQuery, filterType, filterStatus, activeTab]);

  const getCertStatus = (cert: any) => {
    if (cert.isLifetime) return { status: 'lifetime', label: 'Lifetime', color: 'bg-blue-100 text-blue-800' };
    if (!cert.expiryDate) return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800' };
    
    const now = new Date();
    const expiryDate = new Date(cert.expiryDate);
    const daysUntilExpiry = differenceInDays(expiryDate, now);
    
    if (daysUntilExpiry < 0) return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', label: `${daysUntilExpiry}d left`, color: 'bg-amber-100 text-amber-800' };
    return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800' };
  };

  const getCertTypeLabel = (type: string) => {
    return CERTIFICATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const getCertTypeColor = (type: string) => {
    return CERTIFICATION_TYPES.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const handleCreate = async () => {
    if (!formData.workerId || !formData.certificationType || !formData.certificationName || !formData.issueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to create certification');
      
      const newCert = await res.json();
      setCertifications([newCert, ...certifications]);
      setShowNewModal(false);
      setFormData({
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
      toast.success('Certification added successfully');
    } catch (error) {
      toast.error('Failed to add certification');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (certId: string) => {
    try {
      const res = await fetch(`/api/certifications/${certId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true })
      });
      
      if (!res.ok) throw new Error('Failed to verify');
      
      const updated = await res.json();
      setCertifications(certifications.map(c => c.id === certId ? updated : c));
      toast.success('Certification verified');
    } catch (error) {
      toast.error('Failed to verify certification');
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    
    try {
      const res = await fetch(`/api/certifications/${certId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setCertifications(certifications.filter(c => c.id !== certId));
      toast.success('Certification deleted');
    } catch (error) {
      toast.error('Failed to delete certification');
    }
  };

  // Training Matrix View
  const renderTrainingMatrix = () => {
    const workers = teamMembers.filter(tm => tm.user);
    const certTypes = CERTIFICATION_TYPES.slice(0, 10); // Top 10 cert types for matrix
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white border-b">Worker</th>
              {certTypes.map(ct => (
                <th key={ct.value} className="px-2 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300 border-b" style={{ minWidth: '80px' }}>
                  <div className="rotate-0 md:-rotate-45 md:origin-center whitespace-nowrap">
                    {ct.label.split(' ')[0]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => {
              const workerCerts = certifications.filter(c => c.workerId === worker.user.id);
              return (
                <tr key={worker.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {worker.user.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{worker.user.name}</span>
                    </div>
                  </td>
                  {certTypes.map(ct => {
                    const cert = workerCerts.find(c => c.certificationType === ct.value);
                    const status = cert ? getCertStatus(cert) : null;
                    return (
                      <td key={ct.value} className="px-2 py-3 text-center">
                        {cert ? (
                          <div 
                            className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center cursor-pointer ${status?.status === 'valid' || status?.status === 'lifetime' ? 'bg-green-500' : status?.status === 'expiring' ? 'bg-amber-500' : 'bg-red-500'}`}
                            onClick={() => { setSelectedCert(cert); setShowDetailModal(true); }}
                          >
                            {status?.status === 'valid' || status?.status === 'lifetime' ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : status?.status === 'expiring' ? (
                              <Clock className="w-4 h-4 text-white" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6 mx-auto rounded-full bg-slate-200 dark:bg-slate-700" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span>Expiring Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span>Not Held</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" />
            Training & Certifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage worker qualifications and compliance</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Certifications</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Verified</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.verified}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.expiringSoon}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Expired</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.expired}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'all', label: 'All Certifications', icon: Award },
          { id: 'expiring', label: 'Expiring Soon', icon: Clock, count: stats.expiringSoon },
          { id: 'expired', label: 'Expired', icon: XCircle, count: stats.expired },
          { id: 'matrix', label: 'Training Matrix', icon: HardHat }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant="secondary" className="ml-1">{tab.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'matrix' ? (
        <Card>
          <CardHeader>
            <CardTitle>Training Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {renderTrainingMatrix()}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, worker, or card number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Certification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CERTIFICATION_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
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

          {/* Certifications List */}
          <div className="grid gap-4">
            {filteredCertifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">No certifications found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Add certifications to track worker qualifications</p>
                  <Button onClick={() => setShowNewModal(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Certification
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredCertifications.map(cert => {
                const status = getCertStatus(cert);
                return (
                  <Card key={cert.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${getCertTypeColor(cert.certificationType)} flex items-center justify-center shrink-0`}>
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{cert.certificationName}</h3>
                            <Badge className={status.color}>{status.label}</Badge>
                            {cert.isVerified && (
                              <Badge variant="outline" className="border-green-500 text-green-600">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {cert.worker?.name}
                            </span>
                            {cert.cardNumber && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" />
                                {cert.cardNumber}
                              </span>
                            )}
                            {cert.issuingBody && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {cert.issuingBody}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {cert.isLifetime ? 'Lifetime' : cert.expiryDate ? `Expires ${format(new Date(cert.expiryDate), 'dd MMM yyyy')}` : 'No expiry'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!cert.isVerified && (
                            <Button variant="outline" size="sm" onClick={() => handleVerify(cert.id)}>
                              <Shield className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedCert(cert); setShowDetailModal(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(cert.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* New Certification Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Worker *</label>
              <Select value={formData.workerId} onValueChange={(v) => setFormData({...formData, workerId: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.filter(tm => tm.user?.id).map(tm => (
                    <SelectItem key={tm.user.id} value={tm.user.id}>{tm.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Certification Type *</label>
              <Select 
                value={formData.certificationType} 
                onValueChange={(v) => {
                  const type = CERTIFICATION_TYPES.find(t => t.value === v);
                  setFormData({...formData, certificationType: v, certificationName: type?.label || ''});
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Certification Name *</label>
              <Input 
                value={formData.certificationName}
                onChange={(e) => setFormData({...formData, certificationName: e.target.value})}
                placeholder="e.g., CSCS Gold Card"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Card Number</label>
                <Input 
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                  placeholder="Card/License #"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issuing Body</label>
                <Input 
                  value={formData.issuingBody}
                  onChange={(e) => setFormData({...formData, issuingBody: e.target.value})}
                  placeholder="e.g., CITB"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issue Date *</label>
                <Input 
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Date</label>
                <Input 
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  disabled={formData.isLifetime}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="isLifetime"
                checked={formData.isLifetime}
                onChange={(e) => setFormData({...formData, isLifetime: e.target.checked, expiryDate: e.target.checked ? '' : formData.expiryDate})}
                className="rounded"
              />
              <label htmlFor="isLifetime" className="text-sm text-slate-700 dark:text-slate-300">Lifetime certification (no expiry)</label>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certification Details</DialogTitle>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl ${getCertTypeColor(selectedCert.certificationType)} flex items-center justify-center`}>
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCert.certificationName}</h3>
                  <p className="text-slate-500">{getCertTypeLabel(selectedCert.certificationType)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Worker</span>
                  <p className="font-medium">{selectedCert.worker?.name}</p>
                </div>
                {selectedCert.cardNumber && (
                  <div>
                    <span className="text-slate-500">Card Number</span>
                    <p className="font-medium">{selectedCert.cardNumber}</p>
                  </div>
                )}
                {selectedCert.issuingBody && (
                  <div>
                    <span className="text-slate-500">Issuing Body</span>
                    <p className="font-medium">{selectedCert.issuingBody}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Issue Date</span>
                  <p className="font-medium">{format(new Date(selectedCert.issueDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Expiry</span>
                  <p className="font-medium">
                    {selectedCert.isLifetime ? 'Lifetime' : selectedCert.expiryDate ? format(new Date(selectedCert.expiryDate), 'dd MMM yyyy') : 'No expiry'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Status</span>
                  <Badge className={getCertStatus(selectedCert).color}>{getCertStatus(selectedCert).label}</Badge>
                </div>
                <div>
                  <span className="text-slate-500">Verified</span>
                  <p className="font-medium">
                    {selectedCert.isVerified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Yes
                        {selectedCert.verifiedBy && ` by ${selectedCert.verifiedBy.name}`}
                      </span>
                    ) : 'No'}
                  </p>
                </div>
              </div>
              {selectedCert.notes && (
                <div>
                  <span className="text-slate-500 text-sm">Notes</span>
                  <p className="mt-1 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">{selectedCert.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
