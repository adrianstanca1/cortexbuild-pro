'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Truck, Check, Eye, Loader2, Weight, Ruler, _Wind, _User, _AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SignaturePad } from '@/components/ui/signature-pad';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/use-realtime';

interface LiftingOperationsTabProps {
  project: any;
  teamMembers: any[];
  liftingOperations: any[];
}

const statusColors: Record<string, string> = {
  PLANNED: 'bg-yellow-500',
  APPROVED: 'bg-blue-500',
  IN_PROGRESS: 'bg-green-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500'
};

const craneTypes = ['Mobile Crane', 'Tower Crane', 'Overhead Crane', 'Crawler Crane', 'Rough Terrain Crane', 'All Terrain Crane', 'Telehandler', 'Lorry Loader (HIAB)'];

export function LiftingOperationsTab({ project, teamMembers, liftingOperations: initialOps }: LiftingOperationsTabProps) {
  const router = useRouter();
  const [operations, setOperations] = useState(initialOps || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    description: '',
    liftDate: '',
    location: '',
    loadDescription: '',
    loadWeight: '',
    loadDimensions: '',
    loadCog: '',
    craneType: '',
    craneCapacity: '',
    craneMake: '',
    craneSerial: '',
    slingType: '',
    slingCapacity: '',
    shackleSize: '',
    liftRadius: '',
    liftHeight: '',
    groundConditions: '',
    windSpeedLimit: '',
    liftPlanAttached: false,
    exclusionZoneSet: false,
    banksman: '',
    signallerName: '',
    operatorId: '',
    supervisorId: '',
    plannerSignature: ''
  });

  useRealtimeSubscription(
    ['lifting_operation_created', 'lifting_operation_updated'],
    useCallback(() => router.refresh(), [router])
  );

  const handleCreate = async () => {
    if (!form.description || !form.liftDate || !form.loadDescription || !form.loadWeight) {
      toast.error('Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/lifting-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projectId: project.id })
      });
      if (!response.ok) throw new Error('Failed');
      const created = await response.json();
      setOperations(prev => [created, ...prev]);
      setShowCreateModal(false);
      toast.success('Lift plan created');
      resetForm();
    } catch (error) {
      toast.error('Failed to create lift plan');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/lifting-operations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed');
      toast.success('Status updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setForm({
      description: '', liftDate: '', location: '', loadDescription: '', loadWeight: '',
      loadDimensions: '', loadCog: '', craneType: '', craneCapacity: '', craneMake: '',
      craneSerial: '', slingType: '', slingCapacity: '', shackleSize: '', liftRadius: '',
      liftHeight: '', groundConditions: '', windSpeedLimit: '', liftPlanAttached: false,
      exclusionZoneSet: false, banksman: '', signallerName: '', operatorId: '', supervisorId: '', plannerSignature: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lifting Operations</h2>
          <p className="text-muted-foreground">Manage crane lifts and lifting plans</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Lift Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{operations.length}</div>
            <p className="text-muted-foreground text-sm">Total Lifts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{operations.filter(o => o.status === 'PLANNED').length}</div>
            <p className="text-muted-foreground text-sm">Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{operations.filter(o => o.status === 'IN_PROGRESS').length}</div>
            <p className="text-muted-foreground text-sm">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{operations.filter(o => o.status === 'COMPLETED').length}</div>
            <p className="text-muted-foreground text-sm">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {operations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No lifting operations planned</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {operations.map((op) => (
            <Card key={op.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-5 w-5 text-blue-500" />
                      <Badge className={statusColors[op.status]}>{op.status.replace('_', ' ')}</Badge>
                      <span className="text-sm text-muted-foreground">LIFT-{op.number}</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{op.loadDescription}</h3>
                    <p className="text-muted-foreground text-sm">{op.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>📍 {op.location}</span>
                      <span>📅 {format(new Date(op.liftDate), 'dd/MM/yyyy HH:mm')}</span>
                      <span className="flex items-center gap-1"><Weight className="h-4 w-4" /> {op.loadWeight} kg</span>
                      {op.craneType && <span>{op.craneType}</span>}
                      {op.liftRadius && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {op.liftRadius}m radius</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {op.liftPlanAttached && <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" /> Lift Plan</Badge>}
                      {op.exclusionZoneSet && <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" /> Exclusion Zone</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedOp(op); setShowDetailModal(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {op.status === 'PLANNED' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(op.id, 'APPROVED')}>
                        Approve
                      </Button>
                    )}
                    {op.status === 'APPROVED' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(op.id, 'IN_PROGRESS')}>
                        Start Lift
                      </Button>
                    )}
                    {op.status === 'IN_PROGRESS' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(op.id, 'COMPLETED')}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-blue-500" /> New Lifting Operation Plan</DialogTitle>
            <DialogDescription>Create a detailed lift plan for crane operations</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Lift Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Lift Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">Description *</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the lifting operation..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Lift Date/Time *</label>
                  <Input
                    type="datetime-local"
                    value={form.liftDate}
                    onChange={(e) => setForm(prev => ({ ...prev, liftDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Location *</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Lift location"
                  />
                </div>
              </div>
            </div>

            {/* Load Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Load Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Load Description *</label>
                  <Input
                    value={form.loadDescription}
                    onChange={(e) => setForm(prev => ({ ...prev, loadDescription: e.target.value }))}
                    placeholder="What is being lifted"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Load Weight (kg) *</label>
                  <Input
                    type="number"
                    value={form.loadWeight}
                    onChange={(e) => setForm(prev => ({ ...prev, loadWeight: e.target.value }))}
                    placeholder="Weight in kg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Dimensions (L x W x H)</label>
                  <Input
                    value={form.loadDimensions}
                    onChange={(e) => setForm(prev => ({ ...prev, loadDimensions: e.target.value }))}
                    placeholder="e.g., 3m x 2m x 1.5m"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Centre of Gravity</label>
                  <Input
                    value={form.loadCog}
                    onChange={(e) => setForm(prev => ({ ...prev, loadCog: e.target.value }))}
                    placeholder="CoG location"
                  />
                </div>
              </div>
            </div>

            {/* Crane/Equipment */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Crane / Equipment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Crane Type</label>
                  <Select value={form.craneType} onValueChange={(v) => setForm(prev => ({ ...prev, craneType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select crane type" /></SelectTrigger>
                    <SelectContent>
                      {craneTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Crane Capacity (tonnes)</label>
                  <Input
                    type="number"
                    value={form.craneCapacity}
                    onChange={(e) => setForm(prev => ({ ...prev, craneCapacity: e.target.value }))}
                    placeholder="Capacity"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Crane Make/Model</label>
                  <Input
                    value={form.craneMake}
                    onChange={(e) => setForm(prev => ({ ...prev, craneMake: e.target.value }))}
                    placeholder="e.g., Liebherr LTM 1100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Serial Number</label>
                  <Input
                    value={form.craneSerial}
                    onChange={(e) => setForm(prev => ({ ...prev, craneSerial: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Rigging */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Rigging Equipment</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Sling Type</label>
                  <Input
                    value={form.slingType}
                    onChange={(e) => setForm(prev => ({ ...prev, slingType: e.target.value }))}
                    placeholder="e.g., Chain, Wire Rope, Webbing"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Sling SWL (tonnes)</label>
                  <Input
                    type="number"
                    value={form.slingCapacity}
                    onChange={(e) => setForm(prev => ({ ...prev, slingCapacity: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Shackle Size</label>
                  <Input
                    value={form.shackleSize}
                    onChange={(e) => setForm(prev => ({ ...prev, shackleSize: e.target.value }))}
                    placeholder="e.g., 12t"
                  />
                </div>
              </div>
            </div>

            {/* Lift Parameters */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Lift Parameters</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Lift Radius (m)</label>
                  <Input
                    type="number"
                    value={form.liftRadius}
                    onChange={(e) => setForm(prev => ({ ...prev, liftRadius: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Lift Height (m)</label>
                  <Input
                    type="number"
                    value={form.liftHeight}
                    onChange={(e) => setForm(prev => ({ ...prev, liftHeight: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Max Wind Speed (km/h)</label>
                  <Input
                    type="number"
                    value={form.windSpeedLimit}
                    onChange={(e) => setForm(prev => ({ ...prev, windSpeedLimit: e.target.value }))}
                    placeholder="e.g., 35"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Ground Conditions</label>
                  <Input
                    value={form.groundConditions}
                    onChange={(e) => setForm(prev => ({ ...prev, groundConditions: e.target.value }))}
                    placeholder="e.g., Firm, Level"
                  />
                </div>
              </div>
            </div>

            {/* Safety Checks */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Safety Checks</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="liftPlan"
                    checked={form.liftPlanAttached}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, liftPlanAttached: !!checked }))}
                  />
                  <label htmlFor="liftPlan" className="text-sm text-foreground cursor-pointer">Lift plan attached</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclusionZone"
                    checked={form.exclusionZoneSet}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, exclusionZoneSet: !!checked }))}
                  />
                  <label htmlFor="exclusionZone" className="text-sm text-foreground cursor-pointer">Exclusion zone established</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Banksman</label>
                  <Input
                    value={form.banksman}
                    onChange={(e) => setForm(prev => ({ ...prev, banksman: e.target.value }))}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Signaller</label>
                  <Input
                    value={form.signallerName}
                    onChange={(e) => setForm(prev => ({ ...prev, signallerName: e.target.value }))}
                    placeholder="Name"
                  />
                </div>
              </div>
            </div>

            {/* Personnel */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Personnel</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Crane Operator</label>
                  <Select value={form.operatorId} onValueChange={(v) => setForm(prev => ({ ...prev, operatorId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
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
                  <label className="text-sm font-medium text-foreground">Lift Supervisor</label>
                  <Select value={form.supervisorId} onValueChange={(v) => setForm(prev => ({ ...prev, supervisorId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                    <SelectContent>
                      {teamMembers.filter(m => m?.user?.id || m?.id).map(member => (
                        <SelectItem key={member.user?.id || member.id} value={member.user?.id || member.id}>
                          {member.user?.name || member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="text-sm font-medium text-foreground">Planner Signature</label>
              <SignaturePad
                onSave={(sig) => setForm(prev => ({ ...prev, plannerSignature: sig }))}
                onClear={() => setForm(prev => ({ ...prev, plannerSignature: '' }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Lift Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lift Plan #{selectedOp?.number}</DialogTitle>
          </DialogHeader>
          {selectedOp && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedOp.status]}>{selectedOp.status.replace('_', ' ')}</Badge>
                <span className="text-muted-foreground">{format(new Date(selectedOp.liftDate), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Load</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Description:</span> {selectedOp.loadDescription}</p>
                    <p><span className="font-medium">Weight:</span> {selectedOp.loadWeight} kg</p>
                    {selectedOp.loadDimensions && <p><span className="font-medium">Dimensions:</span> {selectedOp.loadDimensions}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Crane</h4>
                  <div className="space-y-1 text-sm">
                    {selectedOp.craneType && <p><span className="font-medium">Type:</span> {selectedOp.craneType}</p>}
                    {selectedOp.craneCapacity && <p><span className="font-medium">Capacity:</span> {selectedOp.craneCapacity} tonnes</p>}
                    {selectedOp.craneMake && <p><span className="font-medium">Make/Model:</span> {selectedOp.craneMake}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Lift Parameters</h4>
                  <div className="space-y-1 text-sm">
                    {selectedOp.liftRadius && <p><span className="font-medium">Radius:</span> {selectedOp.liftRadius}m</p>}
                    {selectedOp.liftHeight && <p><span className="font-medium">Height:</span> {selectedOp.liftHeight}m</p>}
                    {selectedOp.windSpeedLimit && <p><span className="font-medium">Max Wind:</span> {selectedOp.windSpeedLimit} km/h</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Personnel</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Planner:</span> {selectedOp.plannedBy?.name}</p>
                    {selectedOp.operator && <p><span className="font-medium">Operator:</span> {selectedOp.operator?.name}</p>}
                    {selectedOp.supervisor && <p><span className="font-medium">Supervisor:</span> {selectedOp.supervisor?.name}</p>}
                    {selectedOp.banksman && <p><span className="font-medium">Banksman:</span> {selectedOp.banksman}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {selectedOp.liftPlanAttached && <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" /> Lift Plan Attached</Badge>}
                {selectedOp.exclusionZoneSet && <Badge variant="outline" className="text-green-600"><Check className="h-3 w-3 mr-1" /> Exclusion Zone Set</Badge>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
