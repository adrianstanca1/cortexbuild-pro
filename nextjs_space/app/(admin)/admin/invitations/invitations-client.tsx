"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Plus,
  Search,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  Building2,
  User,
  Settings2,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DEFAULT_ENTITLEMENTS,
  MODULE_LABELS,
  type Entitlements,
  type ModuleEntitlements,
} from "@/lib/entitlements";

interface Invitation {
  id: string;
  token: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  entitlements: Entitlements;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy: { id: string; name: string; email: string };
  organization: { id: string; name: string; slug: string } | null;
}

const statusConfig = {
  PENDING: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  ACCEPTED: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Accepted",
  },
  EXPIRED: {
    color: "bg-gray-100 text-gray-800",
    icon: AlertTriangle,
    label: "Expired",
  },
  REVOKED: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Revoked",
  },
};

export default function InvitationsClient() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    expiryDays: 7,
  });
  const [entitlements, setEntitlements] =
    useState<Entitlements>(DEFAULT_ENTITLEMENTS);

  const fetchInvitations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/invitations?${params}`);
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCreate = async () => {
    if (!formData.companyName || !formData.ownerName || !formData.ownerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          entitlements,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Invitation created and email sent!");
        setShowCreateModal(false);
        setFormData({
          companyName: "",
          ownerName: "",
          ownerEmail: "",
          ownerPhone: "",
          expiryDays: 7,
        });
        setEntitlements(DEFAULT_ENTITLEMENTS);
        fetchInvitations();
      } else {
        toast.error(data.error || "Failed to create invitation");
      }
    } catch (_error) {
      toast.error("Failed to create invitation");
    } finally {
      setCreating(false);
    }
  };

  const handleResend = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });

      if (res.ok) {
        toast.success("Invitation resent successfully");
        fetchInvitations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to resend");
      }
    } catch (_error) {
      toast.error("Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });

      if (res.ok) {
        toast.success("Invitation revoked");
        fetchInvitations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke");
      }
    } catch (_error) {
      toast.error("Failed to revoke invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this invitation? This cannot be undone.",
      )
    )
      return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Invitation deleted");
        fetchInvitations();
        setShowDetailModal(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch (_error) {
      toast.error("Failed to delete invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: invitations.length,
    pending: invitations.filter((i) => i.status === "PENDING").length,
    accepted: invitations.filter((i) => i.status === "ACCEPTED").length,
    expired: invitations.filter((i) => i.status === "EXPIRED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Company Invitations
          </h1>
          <p className="text-gray-600">
            Invite new companies and manage onboarding
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Invite Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Invitations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.accepted}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.expired}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company, email, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="REVOKED">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No invitations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv, i) => {
                const config = statusConfig[inv.status];
                const StatusIcon = config.icon;
                const isExpired =
                  new Date(inv.expiresAt) < new Date() &&
                  inv.status === "PENDING";

                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {inv.companyName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {inv.ownerName} • {inv.ownerEmail}
                        </p>
                        <p className="text-xs text-gray-400">
                          Invited {new Date(inv.createdAt).toLocaleDateString()}
                          {inv.status === "PENDING" && (
                            <span className={isExpired ? "text-red-500" : ""}>
                              {" "}
                              • Expires{" "}
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvitation(inv);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {inv.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(inv.id)}
                              disabled={actionLoading === inv.id}
                            >
                              {actionLoading === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(inv.id)}
                              disabled={actionLoading === inv.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invitation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Invite New Company
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Company Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="e.g., Acme Construction Ltd"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Invitation Expiry</Label>
                  <Select
                    value={formData.expiryDays.toString()}
                    onValueChange={(v) =>
                      setFormData({ ...formData, expiryDays: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" /> Company Owner Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Owner Name *</Label>
                  <Input
                    placeholder="e.g., John Smith"
                    value={formData.ownerName}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Owner Email *</Label>
                  <Input
                    type="email"
                    placeholder="e.g., john@acme.com"
                    value={formData.ownerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerEmail: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Owner Phone (Optional)</Label>
                  <Input
                    placeholder="e.g., +44 7700 900000"
                    value={formData.ownerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerPhone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Entitlements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Access & Entitlements
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Enabled Modules
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    Object.keys(MODULE_LABELS) as Array<
                      keyof ModuleEntitlements
                    >
                  ).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <Label className="text-sm">{MODULE_LABELS[key]}</Label>
                      <Switch
                        checked={entitlements.modules[key]}
                        onCheckedChange={(checked) => {
                          setEntitlements({
                            ...entitlements,
                            modules: {
                              ...entitlements.modules,
                              [key]: checked,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Resource Limits
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Storage (GB)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={entitlements.limits.storageGB}
                      onChange={(e) => {
                        setEntitlements({
                          ...entitlements,
                          limits: {
                            ...entitlements.limits,
                            storageGB: parseInt(e.target.value) || 1,
                          },
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Max Users</Label>
                    <Input
                      type="number"
                      min="1"
                      value={entitlements.limits.maxUsers}
                      onChange={(e) => {
                        setEntitlements({
                          ...entitlements,
                          limits: {
                            ...entitlements.limits,
                            maxUsers: parseInt(e.target.value) || 1,
                          },
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Max Projects</Label>
                    <Input
                      type="number"
                      min="1"
                      value={entitlements.limits.maxProjects}
                      onChange={(e) => {
                        setEntitlements({
                          ...entitlements,
                          limits: {
                            ...entitlements.limits,
                            maxProjects: parseInt(e.target.value) || 1,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invitation Details</DialogTitle>
          </DialogHeader>

          {selectedInvitation && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedInvitation.companyName}
                  </h3>
                  <Badge
                    className={statusConfig[selectedInvitation.status].color}
                  >
                    {statusConfig[selectedInvitation.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Owner Name</p>
                  <p className="font-medium">{selectedInvitation.ownerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Owner Email</p>
                  <p className="font-medium">{selectedInvitation.ownerEmail}</p>
                </div>
                {selectedInvitation.ownerPhone && (
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">
                      {selectedInvitation.ownerPhone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Invited By</p>
                  <p className="font-medium">
                    {selectedInvitation.invitedBy.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(selectedInvitation.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Expires</p>
                  <p className="font-medium">
                    {new Date(selectedInvitation.expiresAt).toLocaleString()}
                  </p>
                </div>
                {selectedInvitation.acceptedAt && (
                  <div>
                    <p className="text-gray-500">Accepted</p>
                    <p className="font-medium text-green-600">
                      {new Date(selectedInvitation.acceptedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedInvitation.organization && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Company created:{" "}
                    <strong>{selectedInvitation.organization.name}</strong>
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                {selectedInvitation.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(selectedInvitation.id)}
                      disabled={actionLoading === selectedInvitation.id}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleRevoke(selectedInvitation.id)}
                      disabled={actionLoading === selectedInvitation.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Revoke
                    </Button>
                  </div>
                )}
                {selectedInvitation.status !== "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(selectedInvitation.id)}
                    disabled={actionLoading === selectedInvitation.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
