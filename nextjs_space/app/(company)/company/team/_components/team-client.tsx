"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Briefcase,
  Edit2,
  UserX,
  Clock,
  FolderKanban,
} from "lucide-react";
import {  Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface CompanyTeamClientProps {
  teamMembers: any[];
  currentUserId: string;
  currentUserRole: string;
}

export function CompanyTeamClient({ teamMembers: initialMembers, currentUserId, currentUserRole }: CompanyTeamClientProps) {
  const [mounted, setMounted] = useState(false);
  const [teamMembers, setTeamMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const [editForm, setEditForm] = useState({
    jobTitle: "",
    department: "",
    role: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      jobTitle: member.jobTitle || "",
      department: member.department || "",
      role: member.user.role,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/team/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success("Team member updated");
        setShowEditModal(false);
        // Refresh data
        window.location.reload();
      } else {
        toast.error("Failed to update team member");
      }
    } catch {
      toast.error("Failed to update team member");
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      const res = await fetch(`/api/team/${memberToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Team member removed");
        setTeamMembers(teamMembers.filter((m) => m.id !== memberToDelete.id));
        setShowDeleteDialog(false);
        setMemberToDelete(null);
      } else {
        toast.error("Failed to remove team member");
      }
    } catch {
      toast.error("Failed to remove team member");
    }
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    COMPANY_OWNER: "bg-emerald-100 text-emerald-700",
    ADMIN: "bg-blue-100 text-blue-700",
    PROJECT_MANAGER: "bg-amber-100 text-amber-700",
    FIELD_WORKER: "bg-gray-100 text-gray-700",
  };

  const canEditMember = (member: any) => {
    // Can't edit yourself
    if (member.user.id === currentUserId) return false;
    // SUPER_ADMIN can edit anyone
    if (currentUserRole === "SUPER_ADMIN") return true;
    // COMPANY_OWNER can edit anyone except SUPER_ADMIN
    if (currentUserRole === "COMPANY_OWNER" && member.user.role !== "SUPER_ADMIN") return true;
    // ADMIN can edit PM and FIELD_WORKER
    if (currentUserRole === "ADMIN" && ["PROJECT_MANAGER", "FIELD_WORKER"].includes(member.user.role)) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage your organization&apos;s team members</p>
        </div>
        <Link href="/company/invitations">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Mail className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: teamMembers.length, icon: Users, color: "text-emerald-600" },
          { label: "Admins", value: teamMembers.filter((m) => ["COMPANY_OWNER", "ADMIN"].includes(m.user.role)).length, icon: Shield, color: "text-blue-600" },
          { label: "Project Managers", value: teamMembers.filter((m) => m.user.role === "PROJECT_MANAGER").length, icon: Briefcase, color: "text-amber-600" },
          { label: "Field Workers", value: teamMembers.filter((m) => m.user.role === "FIELD_WORKER").length, icon: Users, color: "text-gray-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="COMPANY_OWNER">Company Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                <SelectItem value="FIELD_WORKER">Field Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No team members found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium text-lg">
                        {member.user.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{member.user.name}</p>
                          {member.user.id === currentUserId && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                        {member.jobTitle && (
                          <p className="text-xs text-gray-400">{member.jobTitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:block text-right">
                        <Badge className={roleColors[member.user.role] || "bg-gray-100"}>
                          {member.user.role.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Joined {mounted ? formatDistanceToNow(new Date(member.invitedAt), { addSuffix: true }) : "recently"}
                        </p>
                      </div>

                      <div className="hidden lg:flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <FolderKanban className="h-3 w-3 mr-1" />
                          {member.projectAssignments?.length || 0} projects
                        </Badge>
                      </div>

                      {canEditMember(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setMemberToDelete(member);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={editForm.jobTitle}
                onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                placeholder="Site Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                placeholder="Operations"
              />
            </div>
            {currentUserRole !== "ADMIN" && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                    <SelectItem value="FIELD_WORKER">Field Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToDelete?.user.name}</strong> from the team? 
              This action cannot be undone and they will lose access to all projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
