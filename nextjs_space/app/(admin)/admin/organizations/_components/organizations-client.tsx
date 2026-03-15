"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Users,
  FolderKanban,
  MoreVertical,
  Edit,
  Trash2,
  PoundSterling,
  FileText,
  ListTodo,
  RefreshCw,
  Check,
  Eye,
  X,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
  users: { id: string; name: string; email: string; role: string }[];
  projects: {
    id: string;
    name: string;
    status: string;
    budget: number | null;
  }[];
  _count: { users: number; projects: number; teamMembers: number };
  stats: {
    taskCount: number;
    documentCount: number;
    rfiCount: number;
    totalBudget: number;
  };
}

export function OrganizationsClient() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logoUrl: "",
  });

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/organizations?${params}`);
      const data = await res.json();

      if (res.ok) {
        setOrganizations(data.organizations || []);
      } else {
        console.error("API error:", data.error);
        toast.error(data.error || "Failed to fetch organizations");
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Skip initial render
    const debounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchOrganizations();
      }
    }, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCreateOrg = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Please fill in name and slug");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Organization created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", slug: "", logoUrl: "" });
        fetchOrganizations();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create organization");
      }
    } catch (error) {
      toast.error("Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!selectedOrg) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Organization updated successfully");
        setShowEditModal(false);
        setSelectedOrg(null);
        fetchOrganizations();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update organization");
      }
    } catch (error) {
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async (org: Organization) => {
    if (org._count.users > 0 || org._count.projects > 0) {
      toast.error("Cannot delete organization with existing users or projects");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${org.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Organization deleted successfully");
        fetchOrganizations();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete organization");
      }
    } catch (error) {
      toast.error("Failed to delete organization");
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl || "",
    });
    setShowEditModal(true);
  };

  const openDetailModal = (org: Organization) => {
    setSelectedOrg(org);
    setShowDetailModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organizations
          </h1>
          <p className="text-gray-500 mt-1">
            Manage tenant organizations on the platform
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <motion.div
            key={org.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <p className="text-sm text-gray-500">{org.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetailModal(org)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(org)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteOrg(org)}
                        className="text-red-600"
                        disabled={
                          org._count.users > 0 || org._count.projects > 0
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-lg font-bold">
                        {org._count.users}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FolderKanban className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-bold">
                        {org._count.projects}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Projects</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ListTodo className="h-4 w-4 text-blue-500" />
                      <span className="text-lg font-bold">
                        {org.stats.taskCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Tasks</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Budget</span>
                    <span className="font-medium">
                      £{org.stats.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500">Documents</span>
                    <span className="font-medium">
                      {org.stats.documentCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No organizations found</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4">
            Create First Organization
          </Button>
        </div>
      )}

      {/* Create Organization Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Organization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Organization Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({ ...formData, name, slug: generateSlug(name) });
                }}
                placeholder="Acme Construction"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="acme-construction"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier for the organization
              </p>
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                placeholder="https://cdn.logojoy.com/wp-content/uploads/20220329172812/app-logo-color-combinations-600x371.jpeg"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateOrg}
                disabled={saving}
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Organization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Organization Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateOrg}
                disabled={saving}
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Organization Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedOrg.name}</h3>
                  <p className="text-gray-500">Slug: {selectedOrg.slug}</p>
                  <p className="text-sm text-gray-400">
                    Created:{" "}
                    {format(new Date(selectedOrg.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Users className="h-6 w-6 mx-auto text-purple-500" />
                  <p className="text-2xl font-bold mt-2">
                    {selectedOrg._count.users}
                  </p>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <FolderKanban className="h-6 w-6 mx-auto text-green-500" />
                  <p className="text-2xl font-bold mt-2">
                    {selectedOrg._count.projects}
                  </p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ListTodo className="h-6 w-6 mx-auto text-blue-500" />
                  <p className="text-2xl font-bold mt-2">
                    {selectedOrg.stats.taskCount}
                  </p>
                  <p className="text-xs text-gray-500">Tasks</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto text-orange-500" />
                  <p className="text-2xl font-bold mt-2">
                    {selectedOrg.stats.documentCount}
                  </p>
                  <p className="text-xs text-gray-500">Documents</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">
                  Users ({selectedOrg.users.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedOrg.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">
                  Projects ({selectedOrg.projects.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedOrg.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="text-sm font-medium">
                        {project.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {project.status.replace("_", " ")}
                        </Badge>
                        {project.budget && (
                          <span className="text-sm text-gray-500">
                            £{project.budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedOrg);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Organization
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
