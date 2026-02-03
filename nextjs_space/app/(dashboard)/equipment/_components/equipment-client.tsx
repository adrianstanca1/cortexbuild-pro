'use client';

import { useState, useCallback } from 'react';
import { format, _isPast, differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import {
  Truck, Plus, Search, Wrench, MapPin, _Calendar, _PoundSterling,
  CheckCircle2, XCircle, AlertTriangle, Settings, Loader2, Package,
  ChevronRight, _Clock, _Filter, LayoutGrid, List, AlertCircle, Eye
} from 'lucide-react';
import { Card, CardContent, _CardHeader, _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  name: string;
  equipmentNumber: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  currentLocation?: string;
  currentProject?: { id: string; name: string };
  purchaseCost?: number;
  nextServiceDate?: string;
  _count: { maintenanceLogs: number; usageLogs: number };
}

interface EquipmentClientProps {
  equipment: Equipment[];
  projects: { id: string; name: string }[];
}

const statusConfig = {
  AVAILABLE: { 
    label: 'Available', 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-400', 
    icon: CheckCircle2,
    dot: 'bg-green-500'
  },
  IN_USE: { 
    label: 'In Use', 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-400', 
    icon: Truck,
    dot: 'bg-blue-500'
  },
  MAINTENANCE: { 
    label: 'Maintenance', 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400', 
    icon: Wrench,
    dot: 'bg-amber-500'
  },
  OUT_OF_SERVICE: { 
    label: 'Out of Service', 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-400', 
    icon: XCircle,
    dot: 'bg-red-500'
  }
};

export function EquipmentClient({ equipment, projects }: EquipmentClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '', equipmentNumber: '', category: '', manufacturer: '', model: '',
    serialNumber: '', purchaseCost: '', notes: '', nextServiceDate: ''
  });

  const handleEquipmentEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['equipment_added', 'equipment_updated', 'equipment_deleted'],
    handleEquipmentEvent
  );

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.equipmentNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!newEquipment.name || !newEquipment.equipmentNumber) {
      toast.error('Name and equipment number are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEquipment,
          purchaseCost: newEquipment.purchaseCost ? parseFloat(newEquipment.purchaseCost) : null
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add equipment');
      }
      toast.success('Equipment added');
      setShowNewModal(false);
      setNewEquipment({ name: '', equipmentNumber: '', category: '', manufacturer: '', model: '', serialNumber: '', purchaseCost: '', notes: '', nextServiceDate: '' });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, currentProjectId?: string) => {
    try {
      const res = await fetch(`/api/equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentProjectId })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'AVAILABLE').length,
    inUse: equipment.filter(e => e.status === 'IN_USE').length,
    maintenance: equipment.filter(e => e.status === 'MAINTENANCE' || e.status === 'OUT_OF_SERVICE').length,
    serviceDue: equipment.filter(e => e.nextServiceDate && differenceInDays(new Date(e.nextServiceDate), new Date()) <= 7).length
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Equipment</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage construction equipment and tools</p>
        </div>
        <Button 
          onClick={() => setShowNewModal(true)} 
          className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Equipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                <Package className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Equipment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inUse}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.maintenance}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/50">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.serviceDue}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Service Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid/List */}
      {filteredEquipment.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No equipment found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Add your first equipment to get started</p>
            <Button onClick={() => setShowNewModal(true)} >
              <Plus className="h-4 w-4 mr-2" /> Add Equipment
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;
            const serviceDueSoon = item.nextServiceDate && differenceInDays(new Date(item.nextServiceDate), new Date()) <= 7;

            return (
              <Card 
                key={item.id} 
                className={`border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all group ${
                  serviceDueSoon ? 'border-l-4 border-l-orange-500' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{item.equipmentNumber}</p>
                    </div>
                    <Badge className={`${status.bg} ${status.text} border-0`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {item.category && (
                    <Badge variant="outline" className="mb-3 text-xs">{item.category}</Badge>
                  )}

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {item.manufacturer && (
                      <p className="flex items-center gap-2">
                        <span className="text-slate-500">Make:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.manufacturer} {item.model}
                        </span>
                      </p>
                    )}
                    {item.currentProject && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.currentProject.name}</span>
                      </p>
                    )}
                    {item.nextServiceDate && (
                      <p className={`flex items-center gap-2 ${serviceDueSoon ? 'text-orange-600' : ''}`}>
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Service: {format(new Date(item.nextServiceDate), 'MMM d, yyyy')}</span>
                        {serviceDueSoon && <AlertCircle className="h-3.5 w-3.5" />}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link href={`/equipment/${item.id}`} className="flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-9">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {item.status === 'AVAILABLE' && (
                      <Select onValueChange={(projectId) => handleStatusUpdate(item.id, 'IN_USE', projectId)}>
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue placeholder="Assign to project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {item.status === 'IN_USE' && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStatusUpdate(item.id, 'AVAILABLE', '')}>
                        Return
                      </Button>
                    )}
                    {item.status !== 'MAINTENANCE' && item.status !== 'OUT_OF_SERVICE' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(item.id, 'MAINTENANCE')}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    {item.status === 'MAINTENANCE' && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStatusUpdate(item.id, 'AVAILABLE')}>
                        Complete Service
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEquipment.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;

            return (
              <Card key={item.id} className="border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Truck className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{item.equipmentNumber}</span>
                          {item.manufacturer && <span>{item.manufacturer} {item.model}</span>}
                          {item.currentProject && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {item.currentProject.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${status.bg} ${status.text} border-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Equipment Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name *</label>
                <Input
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  placeholder="e.g., Excavator"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Equipment # *</label>
                <Input
                  value={newEquipment.equipmentNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, equipmentNumber: e.target.value })}
                  placeholder="e.g., EQ-001"
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <Input
                  value={newEquipment.category}
                  onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                  placeholder="e.g., Heavy Equipment"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Manufacturer</label>
                <Input
                  value={newEquipment.manufacturer}
                  onChange={(e) => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })}
                  placeholder="e.g., Caterpillar"
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Model</label>
                <Input
                  value={newEquipment.model}
                  onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                  placeholder="e.g., 320D"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Serial Number</label>
                <Input
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                  placeholder="Serial number"
                  className="h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Purchase Cost (£)</label>
                <Input
                  type="number"
                  value={newEquipment.purchaseCost}
                  onChange={(e) => setNewEquipment({ ...newEquipment, purchaseCost: e.target.value })}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Next Service Date</label>
                <Input
                  type="date"
                  value={newEquipment.nextServiceDate}
                  onChange={(e) => setNewEquipment({ ...newEquipment, nextServiceDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
              <Textarea
                value={newEquipment.notes}
                onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading} >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Equipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
