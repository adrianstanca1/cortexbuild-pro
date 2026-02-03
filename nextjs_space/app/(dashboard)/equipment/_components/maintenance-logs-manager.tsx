'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Wrench, Plus, Pencil, Trash2, X, Calendar, DollarSign, User, FileText 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface MaintenanceLog {
  id: string;
  serviceDate: string;
  serviceType: string;
  description?: string;
  cost?: number;
  performedBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface MaintenanceLogsManagerProps {
  equipmentId: string;
  equipmentName: string;
}

const SERVICE_TYPES = [
  'Routine Maintenance',
  'Repair',
  'Inspection',
  'Oil Change',
  'Tire Replacement',
  'Brake Service',
  'Battery Replacement',
  'Preventive Maintenance',
  'Emergency Repair',
  'Other'
];

export function MaintenanceLogsManager({ equipmentId, equipmentName }: MaintenanceLogsManagerProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serviceDate: '',
    serviceType: '',
    description: '',
    cost: ''
  });

  useEffect(() => {
    fetchMaintenanceLogs();
  }, [equipmentId]);

  const fetchMaintenanceLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/equipment/${equipmentId}/maintenance`);
      if (!response.ok) throw new Error('Failed to fetch maintenance logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
      toast.error('Failed to load maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!formData.serviceDate || !formData.serviceType) {
      toast.error('Service date and type are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/equipment/${equipmentId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add maintenance log');
      }

      toast.success('Maintenance log added successfully');
      setShowAddModal(false);
      resetForm();
      await fetchMaintenanceLogs();
    } catch (error: any) {
      console.error('Error adding maintenance log:', error);
      toast.error(error.message || 'Failed to add maintenance log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLog = async () => {
    if (!selectedLog || !formData.serviceDate || !formData.serviceType) {
      toast.error('Service date and type are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/equipment/${equipmentId}/maintenance/${selectedLog.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update maintenance log');
      }

      toast.success('Maintenance log updated successfully');
      setShowEditModal(false);
      setSelectedLog(null);
      resetForm();
      await fetchMaintenanceLogs();
    } catch (error: any) {
      console.error('Error updating maintenance log:', error);
      toast.error(error.message || 'Failed to update maintenance log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!selectedLog) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/equipment/${equipmentId}/maintenance/${selectedLog.id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete maintenance log');
      }

      toast.success('Maintenance log deleted successfully');
      setShowDeleteDialog(false);
      setSelectedLog(null);
      await fetchMaintenanceLogs();
    } catch (error: any) {
      console.error('Error deleting maintenance log:', error);
      toast.error(error.message || 'Failed to delete maintenance log');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setFormData({
      serviceDate: format(new Date(log.serviceDate), 'yyyy-MM-dd'),
      serviceType: log.serviceType,
      description: log.description || '',
      cost: log.cost?.toString() || ''
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      serviceDate: '',
      serviceType: '',
      description: '',
      cost: ''
    });
  };

  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                Maintenance History
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {equipmentName} - {logs.length} maintenance {logs.length === 1 ? 'record' : 'records'}
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowAddModal(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading maintenance logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No maintenance logs yet</p>
              <p className="text-sm text-slate-400 mt-1">Add your first maintenance record</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Total Records</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{logs.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last Service</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {logs.length > 0 ? format(new Date(logs[0].serviceDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Maintenance Logs List */}
              {logs.map((log) => (
                <Card key={log.id} className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {log.serviceType}
                          </Badge>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.serviceDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 text-slate-400" />
                            {log.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {log.cost && (
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {log.cost.toFixed(2)}
                            </span>
                          )}
                          {log.performedBy && (
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.performedBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(log)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(log)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Maintenance Log Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Maintenance Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceDate">Service Date *</Label>
              <Input
                id="serviceDate"
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance work performed..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddLog} disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Maintenance Log Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Maintenance Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editServiceDate">Service Date *</Label>
              <Input
                id="editServiceDate"
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="editServiceType">Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Describe the maintenance work performed..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editCost">Cost ($)</Label>
              <Input
                id="editCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLog} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLog}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
