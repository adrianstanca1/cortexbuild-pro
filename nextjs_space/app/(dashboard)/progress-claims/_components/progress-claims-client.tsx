"use client";

import { useState } from "react";
import {
  Receipt, Plus, Search, _Filter, Loader2, Eye, Edit,
  CheckCircle, Clock, _XCircle, PoundSterling, Send, _FileCheck
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

const STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PARTIALLY_APPROVED", "REJECTED", "PAID"];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    SUBMITTED: "bg-blue-500",
    UNDER_REVIEW: "bg-yellow-500",
    APPROVED: "bg-green-500",
    PARTIALLY_APPROVED: "bg-orange-500",
    REJECTED: "bg-red-500",
    PAID: "bg-emerald-600",
  };
  return colors[status] || "bg-gray-500";
};

interface ProgressClaimsClientProps {
  claims: any[];
  projects: any[];
}

export function ProgressClaimsClient({ claims: initialClaims, projects }: ProgressClaimsClientProps) {
  const [claims, setClaims] = useState(initialClaims);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newClaim, setNewClaim] = useState({
    projectId: "",
    claimPeriodFrom: "",
    claimPeriodTo: "",
    thisClaim: "",
    retentionHeld: "",
    notes: "",
  });

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = claim.project?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesProject = projectFilter === "all" || claim.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreateClaim = async () => {
    if (!newClaim.projectId || !newClaim.claimPeriodFrom || !newClaim.claimPeriodTo) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/progress-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newClaim,
          thisClaim: parseFloat(newClaim.thisClaim) || 0,
          retentionHeld: parseFloat(newClaim.retentionHeld) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create claim");
      const claim = await res.json();
      setClaims([claim, ...claims]);
      setShowNewModal(false);
      setNewClaim({
        projectId: "", claimPeriodFrom: "", claimPeriodTo: "",
        thisClaim: "", retentionHeld: "", notes: "",
      });
      toast.success("Progress claim created");
    } catch (error) {
      toast.error("Failed to create claim");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (claimId: string) => {
    try {
      const res = await fetch(`/api/progress-claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" }),
      });
      if (!res.ok) throw new Error("Failed to submit claim");
      const updated = await res.json();
      setClaims(claims.map(c => c.id === claimId ? updated : c));
      toast.success("Claim submitted successfully");
    } catch (error) {
      toast.error("Failed to submit claim");
    }
  };

  const stats = {
    total: claims.length,
    totalClaimed: claims.reduce((sum, c) => sum + (c.totalClaimed || 0), 0),
    pending: claims.filter(c => ["SUBMITTED", "UNDER_REVIEW"].includes(c.status)).length,
    paid: claims.filter(c => c.status === "PAID").reduce((sum, c) => sum + (c.netPayable || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Claimed</p>
                <p className="text-2xl font-bold">£{stats.totalClaimed.toLocaleString()}</p>
              </div>
              <PoundSterling className="h-8 w-8 text-green-500" />
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
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-600">£{stats.paid.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
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
              placeholder="Search claims..."
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
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Claim
        </Button>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No progress claims found</p>
              <Button onClick={() => setShowNewModal(true)} variant="outline" className="mt-4">
                Create First Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClaims.map((claim) => (
            <Card key={claim.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Receipt className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
                          Claim #{claim.number}
                        </h3>
                        <Badge className={getStatusColor(claim.status)}>
                          {claim.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{claim.project?.name}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Period: {format(new Date(claim.claimPeriodFrom), "MMM d, yyyy")} - {format(new Date(claim.claimPeriodTo), "MMM d, yyyy")}
                      </p>
                      
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Previous</p>
                          <p className="font-semibold">£{claim.previousClaimed?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">This Claim</p>
                          <p className="font-semibold text-blue-600">£{claim.thisClaim?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Retention</p>
                          <p className="font-semibold text-orange-600">-£{claim.retentionHeld?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Net Payable</p>
                          <p className="font-bold text-green-600">£{claim.netPayable?.toLocaleString() || "0"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {claim.status === "DRAFT" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSubmitClaim(claim.id)}
                      >
                        <Send className="h-4 w-4 mr-1" /> Submit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Claim Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Progress Claim</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Project *</label>
              <Select value={newClaim.projectId} onValueChange={(v) => setNewClaim({ ...newClaim, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Period From *</label>
                <Input
                  type="date"
                  value={newClaim.claimPeriodFrom}
                  onChange={(e) => setNewClaim({ ...newClaim, claimPeriodFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Period To *</label>
                <Input
                  type="date"
                  value={newClaim.claimPeriodTo}
                  onChange={(e) => setNewClaim({ ...newClaim, claimPeriodTo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">This Claim Amount (£)</label>
                <Input
                  type="number"
                  value={newClaim.thisClaim}
                  onChange={(e) => setNewClaim({ ...newClaim, thisClaim: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Retention Held (£)</label>
                <Input
                  type="number"
                  value={newClaim.retentionHeld}
                  onChange={(e) => setNewClaim({ ...newClaim, retentionHeld: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newClaim.notes}
                onChange={(e) => setNewClaim({ ...newClaim, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreateClaim} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
