"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Send,
  Trash2,
  UserPlus,
  Loader2,
  Filter,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeamInvitationsClientProps {
  userRole: string;
}

export function TeamInvitationsClient({ userRole }: TeamInvitationsClientProps) {
  const [invitations, setInvitations] = useState<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    token: string;
    invitedAt: string;
    acceptedAt?: string;
    expiresAt: string;
    invitedBy?: { name: string };
  }>>([]);
  const [counts, setCounts] = useState({ total: 0, PENDING: 0, ACCEPTED: 0, EXPIRED: 0, REVOKED: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [newInvitation, setNewInvitation] = useState({
    email: "",
    name: "",
    role: "FIELD_WORKER",
    jobTitle: "",
    department: "",
  });

  const fetchInvitations = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      
      const res = await fetch(`/api/company/invitations?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setInvitations(data.invitations);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = async () => {
    if (!newInvitation.email || !newInvitation.name) {
      toast.error("Email and name are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/company/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvitation),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Invitation sent successfully");
        setShowCreateModal(false);
        setNewInvitation({
          email: "",
          name: "",
          role: "FIELD_WORKER",
          jobTitle: "",
          department: "",
        });
        fetchInvitations();
      } else {
        toast.error(data.error || "Failed to create invitation");
      }
    } catch (error) {
      toast.error("Failed to create invitation");
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (id: string, action: "resend" | "revoke" | "delete") => {
    try {
      if (action === "delete") {
        const res = await fetch(`/api/company/invitations/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Invitation deleted");
          fetchInvitations();
        }
      } else {
        const res = await fetch(`/api/company/invitations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        
        if (res.ok) {
          toast.success(action === "resend" ? "Invitation resent" : "Invitation revoked");
          fetchInvitations();
        }
      }
    } catch (error) {
      toast.error(`Failed to ${action} invitation`);
    }
  };

  const copyInviteLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/team-invite/accept/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Invitation link copied");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredInvitations = invitations.filter(
    (inv) =>
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    ACCEPTED: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    EXPIRED: { icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-100" },
    REVOKED: { icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
  };

  const roleOptions = [
    { value: "FIELD_WORKER", label: "Field Worker" },
    { value: "PROJECT_MANAGER", label: "Project Manager" },
    ...(userRole !== "ADMIN" ? [{ value: "ADMIN", label: "Admin" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Invitations</h1>
          <p className="text-gray-500 mt-1">Invite new members to join your organization</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: counts.total, color: "border-gray-300" },
          { label: "Pending", value: counts.PENDING, color: "border-amber-400" },
          { label: "Accepted", value: counts.ACCEPTED, color: "border-emerald-400" },
          { label: "Expired", value: counts.EXPIRED, color: "border-gray-400" },
          { label: "Revoked", value: counts.REVOKED, color: "border-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.color}`}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
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
          <CardTitle className="text-lg">Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No invitations found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredInvitations.map((invitation) => {
                const status = statusConfig[invitation.status];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium">
                        {invitation.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.name}</p>
                        <p className="text-sm text-gray-500">{invitation.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {invitation.role.replace("_", " ")}
                      </Badge>
                      <Badge className={`${status.bg} ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {invitation.status}
                      </Badge>
                      <span className="text-xs text-gray-400 hidden md:block">
                        {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {invitation.status === "PENDING" && (
                            <>
                              <DropdownMenuItem onClick={() => copyInviteLink(invitation.token)}>
                                {copiedToken === invitation.token ? (
                                  <Check className="h-4 w-4 mr-2" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(invitation.id, "resend")}>
                                <Send className="h-4 w-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction(invitation.id, "revoke")}
                                className="text-amber-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            </>
                          )}
                          {invitation.status === "EXPIRED" && (
                            <DropdownMenuItem onClick={() => handleAction(invitation.id, "resend")}>
                              <Send className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleAction(invitation.id, "delete")}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={newInvitation.email}
                onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newInvitation.name}
                onChange={(e) => setNewInvitation({ ...newInvitation, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newInvitation.role}
                onValueChange={(value) => setNewInvitation({ ...newInvitation, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Site Manager"
                  value={newInvitation.jobTitle}
                  onChange={(e) => setNewInvitation({ ...newInvitation, jobTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Operations"
                  value={newInvitation.department}
                  onChange={(e) => setNewInvitation({ ...newInvitation, department: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
