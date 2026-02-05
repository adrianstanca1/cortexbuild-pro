"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Mail, Briefcase, Loader2, BarChart3,
  FolderTree, Folder, FolderOpen, LayoutGrid, Building2, Crown,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { ResourceAllocation } from "./resource-allocation";

interface TeamClientProps {
  teamMembers: any[];
  userRole: string;
  organizationId: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  PROJECT_MANAGER: "Project Manager",
  FIELD_WORKER: "Field Worker",
  SUPER_ADMIN: "Super Admin",
  COMPANY_OWNER: "Company Owner",
  COMPANY_ADMIN: "Company Admin"
};

const roleColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  SUPER_ADMIN: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  COMPANY_OWNER: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  PROJECT_MANAGER: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  FIELD_WORKER: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-300" }
};

// Organization Tree View Component
function OrganizationTreeView({ teamMembers }: { teamMembers: any[] }) {
  const [expandedRoles, setExpandedRoles] = useState<string[]>(['leadership', 'managers', 'team']);
  
  // Group members by role hierarchy
  const roleHierarchy = [
    {
      id: 'leadership',
      name: 'Leadership',
      icon: Crown,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      roles: ['SUPER_ADMIN', 'COMPANY_OWNER']
    },
    {
      id: 'managers',
      name: 'Management',
      icon: Building2,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      roles: ['ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER']
    },
    {
      id: 'team',
      name: 'Field Operations',
      icon: HardHat,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      roles: ['FIELD_WORKER']
    }
  ];

  const toggleExpand = (id: string) => {
    setExpandedRoles(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-800/50 dark:via-purple-900/10 dark:to-blue-900/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <FolderTree className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Organization Structure</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Team hierarchy view</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {roleHierarchy.map((level, levelIndex) => {
            const Icon = level.icon;
            const members = teamMembers.filter(tm => level.roles.includes(tm?.user?.role));
            const isExpanded = expandedRoles.includes(level.id);
            
            if (members.length === 0) return null;
            
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: levelIndex * 0.1 }}
              >
                {/* Department Folder */}
                <div 
                  className={`relative rounded-xl border-2 ${level.borderColor} ${level.bgColor} overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg`}
                  onClick={() => toggleExpand(level.id)}
                >
                  {/* Folder Tab */}
                  <div className={`absolute -top-0 left-4 right-4 h-2 rounded-t-lg bg-gradient-to-r ${level.color} opacity-90`} />
                  
                  {/* Folder Header */}
                  <div className="flex items-center justify-between p-4 pt-5">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${level.color} shadow-lg flex items-center justify-center`}
                        animate={{ rotate: isExpanded ? 0 : -5 }}
                      >
                        {isExpanded ? (
                          <FolderOpen className="h-5 w-5 text-white" />
                        ) : (
                          <Folder className="h-5 w-5 text-white" />
                        )}
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {level.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </motion.div>
                  </div>
                  
                  {/* Members List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          {/* Tree Lines */}
                          <div className="relative pl-8 space-y-2">
                            {/* Vertical tree line */}
                            <div className="absolute left-3 top-0 bottom-4 w-0.5 bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700" />
                            
                            {members.map((member, _memberIndex) => (
                              <div key={member.id} className="relative flex items-center gap-3">
                                {/* Horizontal branch */}
                                <div className="absolute left-[-20px] top-1/2 w-5 h-0.5 bg-slate-300 dark:bg-slate-600" />
                                {/* Node */}
                                <div className={`absolute left-[-8px] w-2 h-2 rounded-full bg-gradient-to-br ${level.color}`} />
                                
                                {/* Member Card */}
                                <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all">
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold bg-gradient-to-br ${level.color} text-white shadow`}>
                                    {(member?.user?.name ?? "U")?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                      {member?.user?.name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      {member?.jobTitle || roleLabels[member?.user?.role] || 'Team Member'}
                                    </p>
                                  </div>
                                  <div className="hidden sm:flex items-center gap-2">
                                    {member?.user?.email && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors">
                                              <Mail className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>{member.user.email}</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {(member?.projectAssignments?.length || 0) > 0 && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5">
                                        {member.projectAssignments.length} project{member.projectAssignments.length !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamClient({ teamMembers, userRole, organizationId }: TeamClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'members' | 'organization' | 'allocation'>('members');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "FIELD_WORKER",
    jobTitle: ""
  });

  const handleTeamEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ['team_member_added'],
    handleTeamEvent,
    []
  );

  const canManageTeam = userRole === "ADMIN" || userRole === "PROJECT_MANAGER" || userRole === "COMPANY_OWNER" || userRole === "SUPER_ADMIN";

  const filteredMembers = (teamMembers ?? [])?.filter((tm: any) => {
    const matchesSearch = 
      (tm?.user?.name ?? "")?.toLowerCase()?.includes(search?.toLowerCase() ?? "") ||
      (tm?.user?.email ?? "")?.toLowerCase()?.includes(search?.toLowerCase() ?? "");
    const matchesRole = roleFilter === "all" || tm?.user?.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInviteMember = async () => {
    if (!newMember.name?.trim() || !newMember.email?.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMember, organizationId })
      });
      if (res.ok) {
        toast.success("Team member added!");
        setShowInviteModal(false);
        setNewMember({ name: "", email: "", role: "FIELD_WORKER", jobTitle: "" });
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data?.error ?? "Failed to add team member");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Team stats
  const stats = {
    total: teamMembers?.length || 0,
    admins: teamMembers?.filter(tm => ['ADMIN', 'SUPER_ADMIN', 'COMPANY_OWNER'].includes(tm?.user?.role))?.length || 0,
    managers: teamMembers?.filter(tm => tm?.user?.role === 'PROJECT_MANAGER')?.length || 0,
    workers: teamMembers?.filter(tm => tm?.user?.role === 'FIELD_WORKER')?.length || 0
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Team</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your construction team and resource allocation</p>
        </div>
        {canManageTeam && activeTab === 'members' && (
          <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                  <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v })}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIELD_WORKER">Field Worker</SelectItem>
                      <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                      {userRole === "ADMIN" && <SelectItem value="ADMIN">Administrator</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Job Title</label>
                  <Input
                    placeholder="e.g., Site Supervisor"
                    value={newMember.jobTitle}
                    onChange={(e) => setNewMember({ ...newMember, jobTitle: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={handleInviteMember} 
                  disabled={loading} 
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Members</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.admins}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Administrators</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
              <Briefcase className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.managers}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Project Managers</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.workers}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Field Workers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Members
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">{teamMembers?.length || 0}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'organization'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderTree className="h-4 w-4" />
            Organization
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'allocation'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Allocation
          </button>
        </div>

        {/* View Mode Toggle (only for members tab) */}
        {activeTab === 'members' && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {activeTab === 'allocation' ? (
        <ResourceAllocation />
      ) : activeTab === 'organization' ? (
        <OrganizationTreeView teamMembers={teamMembers} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search team members..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-11 h-11 rounded-xl border-slate-200 dark:border-slate-700" 
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                <SelectItem value="FIELD_WORKER">Field Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Grid */}
          {filteredMembers?.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No team members found</h3>
              <p className="text-slate-500 dark:text-slate-400">Add team members to start collaborating.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMembers?.map((tm: any, index: number) => {
                const role = tm?.user?.role || 'FIELD_WORKER';
                const colors = roleColors[role] || roleColors.FIELD_WORKER;
                return (
                  <div
                    key={tm?.id ?? index}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div 
                          className="h-14 w-14 rounded-xl flex items-center justify-center text-xl font-semibold flex-shrink-0 bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25"
                        >
                          {(tm?.user?.name ?? "U")?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">
                            {tm?.user?.name ?? "Unknown"}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                            <Mail className="h-3.5 w-3.5" /> {tm?.user?.email ?? ""}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {roleLabels[role] ?? role ?? "Team Member"}
                            </span>
                            {tm?.jobTitle && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {tm.jobTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {(tm?.projectAssignments ?? [])?.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Assigned Projects</p>
                          <div className="flex flex-wrap gap-2">
                            {(tm?.projectAssignments ?? [])?.slice(0, 3)?.map((pa: any) => (
                              <span 
                                key={pa?.id ?? Math.random()} 
                                className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                {pa?.project?.name ?? "Unknown"}
                              </span>
                            ))}
                            {(tm?.projectAssignments?.length ?? 0) > 3 && (
                              <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs bg-primary/10 text-primary font-medium">
                                +{tm.projectAssignments.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
