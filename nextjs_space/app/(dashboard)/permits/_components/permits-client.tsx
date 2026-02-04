"use client";

import { useState } from "react";
import {
  FileCheck, Plus, Search, Calendar, Building2, AlertCircle,
  CheckCircle, Clock, Loader2, Eye, Edit, PoundSterling
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

const PERMIT_TYPES = [
  "BUILDING", "ELECTRICAL", "PLUMBING", "MECHANICAL", "FIRE",
  "DEMOLITION", "GRADING", "ENVIRONMENTAL", "SIGN", "TEMPORARY", "OCCUPANCY", "OTHER"
];

const PERMIT_STATUSES = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "DENIED", "EXPIRED", "CLOSED"
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    SUBMITTED: "bg-blue-500",
    UNDER_REVIEW: "bg-yellow-500",
    APPROVED: "bg-green-500",
    DENIED: "bg-red-500",
    EXPIRED: "bg-orange-500",
    CLOSED: "bg-gray-600",
  };
  return colors[status] || "bg-gray-500";
};

const getTypeIcon = (_type: string) => {
  return <FileCheck className="h-4 w-4" />;
};

interface PermitsClientProps {
  permits: any[];
  projects: any[];
}

export function PermitsClient({ permits: initialPermits, projects }: PermitsClientProps) {
  const [permits, setPermits] = useState(initialPermits);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitData, setSubmitData] = useState({
    applicationDate: '',
    issuingAuthority: '',
    fee: ''
  });
  const [approveData, setApproveData] = useState({
    approvalDate: '',
    permitNumber: '',
    expirationDate: '',
    inspectionDate: '',
    conditions: ''
  });
  const [newPermit, setNewPermit] = useState({
    projectId: "",
    type: "BUILDING",
    title: "",
    description: "",
    issuingAuthority: "",
    applicationDate: "",
    fee: "",
    conditions: "",
    notes: "",
  });

  const filteredPermits = permits.filter((permit) => {
    const matchesSearch = permit.title.toLowerCase().includes(search.toLowerCase()) ||
      permit.project?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || permit.status === statusFilter;
    const matchesType = typeFilter === "all" || permit.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreatePermit = async () => {
    if (!newPermit.projectId || !newPermit.title) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPermit),
      });
      if (!res.ok) throw new Error("Failed to create permit");
      const permit = await res.json();
      setPermits([permit, ...permits]);
      setShowNewModal(false);
      setNewPermit({
        projectId: "", type: "BUILDING", title: "", description: "",
        issuingAuthority: "", applicationDate: "", fee: "", conditions: "", notes: "",
      });
      toast.success("Permit created successfully");
    } catch (error) {
      toast.error("Failed to create permit");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPermit = async () => {
    if (!selectedPermit || !submitData.issuingAuthority) {
      toast.error("Issuing authority is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/permits/${selectedPermit.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (!res.ok) throw new Error("Failed to submit permit");
      const updated = await res.json();
      setPermits(permits.map(p => p.id === updated.id ? updated : p));
      setSelectedPermit(updated);
      setShowSubmitDialog(false);
      setSubmitData({ applicationDate: '', issuingAuthority: '', fee: '' });
      toast.success("Permit submitted successfully");
    } catch (error) {
      toast.error("Failed to submit permit");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePermit = async () => {
    if (!selectedPermit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/permits/${selectedPermit.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approveData),
      });
      if (!res.ok) throw new Error("Failed to approve permit");
      const updated = await res.json();
      setPermits(permits.map(p => p.id === updated.id ? updated : p));
      setSelectedPermit(updated);
      setShowApproveDialog(false);
      setApproveData({ approvalDate: '', permitNumber: '', expirationDate: '', inspectionDate: '', conditions: '' });
      toast.success("Permit approved successfully");
    } catch (error) {
      toast.error("Failed to approve permit");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedPermit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/permits/${selectedPermit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setPermits(permits.map(p => p.id === updated.id ? updated : p));
      setSelectedPermit(updated);
      toast.success(`Permit status updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPermit = (permit: any) => {
    setSelectedPermit(permit);
    setShowDetailModal(true);
  };

  const stats = {
    total: permits.length,
    approved: permits.filter(p => p.status === "APPROVED").length,
    pending: permits.filter(p => ["SUBMITTED", "UNDER_REVIEW"].includes(p.status)).length,
    expiring: permits.filter(p => {
      if (!p.expirationDate) return false;
      const days = Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 30;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Permits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permits..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {PERMIT_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PERMIT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Permit
        </Button>
      </div>

      {/* Permits List */}
      <div className="grid gap-4">
        {filteredPermits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No permits found</p>
              <Button onClick={() => setShowNewModal(true)} variant="outline" className="mt-4">
                Create First Permit
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPermits.map((permit) => (
            <Card key={permit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      {getTypeIcon(permit.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: "#1a1a1a" }}>
                          #{permit.number} - {permit.title}
                        </h3>
                        <Badge className={getStatusColor(permit.status)}>
                          {permit.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permit.project?.name} • {permit.type.replace("_", " ")}
                      </p>
                      {permit.issuingAuthority && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" /> {permit.issuingAuthority}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {permit.applicationDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Applied: {format(new Date(permit.applicationDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {permit.expirationDate && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Expires: {format(new Date(permit.expirationDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {permit.fee && (
                          <span className="flex items-center gap-1">
                            <PoundSterling className="h-3 w-3" />
                            Fee: £{permit.fee.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewPermit(permit)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Permit Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Permit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <Select value={newPermit.projectId} onValueChange={(v) => setNewPermit({ ...newPermit, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Permit Type</label>
                <Select value={newPermit.type} onValueChange={(v) => setNewPermit({ ...newPermit, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMIT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={newPermit.title}
                onChange={(e) => setNewPermit({ ...newPermit, title: e.target.value })}
                placeholder="e.g., Building Permit for Phase 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newPermit.description}
                onChange={(e) => setNewPermit({ ...newPermit, description: e.target.value })}
                placeholder="Permit details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Issuing Authority</label>
                <Input
                  value={newPermit.issuingAuthority}
                  onChange={(e) => setNewPermit({ ...newPermit, issuingAuthority: e.target.value })}
                  placeholder="e.g., City Planning Department"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Application Date</label>
                <Input
                  type="date"
                  value={newPermit.applicationDate}
                  onChange={(e) => setNewPermit({ ...newPermit, applicationDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fee (£)</label>
                <Input
                  type="number"
                  value={newPermit.fee}
                  onChange={(e) => setNewPermit({ ...newPermit, fee: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Conditions/Requirements</label>
              <Textarea
                value={newPermit.conditions}
                onChange={(e) => setNewPermit({ ...newPermit, conditions: e.target.value })}
                placeholder="Any permit conditions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePermit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Permit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permit Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl">
          {selectedPermit && (
            <>
              <DialogHeader>
                <DialogTitle>Permit Details - #{selectedPermit.number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPermit.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPermit.project?.name}</p>
                  </div>
                  <Badge className={getStatusColor(selectedPermit.status)}>
                    {selectedPermit.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{selectedPermit.type.replace("_", " ")}</p>
                  </div>
                  {selectedPermit.permitNumber && (
                    <div>
                      <span className="text-muted-foreground">Permit Number:</span>
                      <p className="font-medium">{selectedPermit.permitNumber}</p>
                    </div>
                  )}
                  {selectedPermit.issuingAuthority && (
                    <div>
                      <span className="text-muted-foreground">Issuing Authority:</span>
                      <p className="font-medium">{selectedPermit.issuingAuthority}</p>
                    </div>
                  )}
                  {selectedPermit.fee && (
                    <div>
                      <span className="text-muted-foreground">Fee:</span>
                      <p className="font-medium">£{selectedPermit.fee.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedPermit.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <p className="text-sm mt-1">{selectedPermit.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedPermit.applicationDate && (
                    <div>
                      <span className="text-muted-foreground">Application Date:</span>
                      <p className="font-medium">{format(new Date(selectedPermit.applicationDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {selectedPermit.approvalDate && (
                    <div>
                      <span className="text-muted-foreground">Approval Date:</span>
                      <p className="font-medium">{format(new Date(selectedPermit.approvalDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {selectedPermit.expirationDate && (
                    <div>
                      <span className="text-muted-foreground">Expiration Date:</span>
                      <p className="font-medium">{format(new Date(selectedPermit.expirationDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {selectedPermit.inspectionDate && (
                    <div>
                      <span className="text-muted-foreground">Inspection Date:</span>
                      <p className="font-medium">{format(new Date(selectedPermit.inspectionDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                </div>

                {selectedPermit.conditions && (
                  <div>
                    <span className="text-sm text-muted-foreground">Conditions:</span>
                    <p className="text-sm mt-1">{selectedPermit.conditions}</p>
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {selectedPermit.status === 'DRAFT' && (
                    <Button 
                      onClick={() => setShowSubmitDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Submit Permit
                    </Button>
                  )}
                  {['SUBMITTED', 'UNDER_REVIEW'].includes(selectedPermit.status) && (
                    <>
                      {selectedPermit.status === 'SUBMITTED' && (
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                          disabled={loading}
                        >
                          Move to Review
                        </Button>
                      )}
                      <Button 
                        onClick={() => setShowApproveDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                  {selectedPermit.status === 'APPROVED' && (
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusUpdate('CLOSED')}
                      disabled={loading}
                    >
                      Close Permit
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Permit for Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Issuing Authority *</label>
              <Input
                value={submitData.issuingAuthority}
                onChange={(e) => setSubmitData({ ...submitData, issuingAuthority: e.target.value })}
                placeholder="e.g., City Building Department"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Application Date</label>
              <Input
                type="date"
                value={submitData.applicationDate}
                onChange={(e) => setSubmitData({ ...submitData, applicationDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fee (£)</label>
              <Input
                type="number"
                value={submitData.fee}
                onChange={(e) => setSubmitData({ ...submitData, fee: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPermit} 
              disabled={loading || !submitData.issuingAuthority}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Permit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Permit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Official Permit Number</label>
              <Input
                value={approveData.permitNumber}
                onChange={(e) => setApproveData({ ...approveData, permitNumber: e.target.value })}
                placeholder="e.g., BP-2024-12345"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Approval Date</label>
              <Input
                type="date"
                value={approveData.approvalDate}
                onChange={(e) => setApproveData({ ...approveData, approvalDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Expiration Date</label>
                <Input
                  type="date"
                  value={approveData.expirationDate}
                  onChange={(e) => setApproveData({ ...approveData, expirationDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Inspection Date</label>
                <Input
                  type="date"
                  value={approveData.inspectionDate}
                  onChange={(e) => setApproveData({ ...approveData, inspectionDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Conditions/Requirements</label>
              <Textarea
                value={approveData.conditions}
                onChange={(e) => setApproveData({ ...approveData, conditions: e.target.value })}
                placeholder="Any special conditions or requirements..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprovePermit} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve Permit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
