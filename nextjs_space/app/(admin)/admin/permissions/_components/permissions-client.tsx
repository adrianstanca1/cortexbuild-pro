"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Users,
  Building2,
  Check,
  X,
  RefreshCw,
  Eye
} from "lucide-react";
import {  Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const RESOURCES = ["projects", "users", "organizations", "tasks", "documents", "reports", "settings"];
const ACTIONS = ["create", "read", "update", "delete", "manage"];

export function PermissionsClient() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    resource: "projects",
    action: "read"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [permRes, userRes, roleRes] = await Promise.all([
        fetch("/api/admin/permissions"),
        fetch("/api/admin/permissions/users"),
        fetch("/api/admin/permissions/roles")
      ]);

      if (permRes.ok) {
        const data = await permRes.json();
        setPermissions(data.permissions || []);
      }

      if (userRes.ok) {
        const data = await userRes.json();
        setUsers(data.users || []);
      }

      if (roleRes.ok) {
        const data = await roleRes.json();
        setRoles(data.roles || []);
      }
    } catch {
      toast.error("Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePermission = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Permission created successfully");
        setShowCreateModal(false);
        fetchData();
      } else {
        toast.error("Failed to create permission");
      }
    } catch {
      toast.error("Failed to create permission");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (userId: string, permissionId: string, hasPermission: boolean) => {
    try {
      const res = await fetch(`/api/admin/permissions/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId, grant: !hasPermission })
      });

      if (res.ok) {
        toast.success(`Permission ${!hasPermission ? "granted" : "revoked"} successfully`);
        fetchData();
      } else {
        toast.error("Failed to update permission");
      }
    } catch {
      toast.error("Failed to update permission");
    }
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
            Permissions Management
          </h1>
          <p className="text-gray-500 mt-1">Manage user and role permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Permission
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Permissions</p>
                <p className="text-2xl font-bold mt-1">{permissions.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Users</p>
                <p className="text-2xl font-bold mt-1">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Roles</p>
                <p className="text-2xl font-bold mt-1">{roles.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resources</p>
                <p className="text-2xl font-bold mt-1">{RESOURCES.length}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">
            <Eye className="h-4 w-4 mr-2" />
            Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Building2 className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Resource</TableHead>
                    {ACTIONS.map((action) => (
                      <TableHead key={action} className="text-center capitalize">
                        {action}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RESOURCES.map((resource) => (
                    <TableRow key={resource}>
                      <TableCell className="font-medium capitalize">{resource}</TableCell>
                      {ACTIONS.map((action) => {
                        const permission = permissions.find(
                          p => p.resource === resource && p.action === action
                        );
                        return (
                          <TableCell key={action} className="text-center">
                            {permission ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <Check className="h-3 w-3" />
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-400">
                                <X className="h-3 w-3" />
                              </Badge>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.permissions.length} permissions</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAssignModal(true);
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium capitalize">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Permission Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Permission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Resource</Label>
              <Select
                value={formData.resource}
                onValueChange={(value) => setFormData({ ...formData, resource: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCES.map((resource) => (
                    <SelectItem key={resource} value={resource} className="capitalize">
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Action</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => setFormData({ ...formData, action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action} className="capitalize">
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreatePermission} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Permission Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Permissions for {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                {permissions.map((permission) => {
                  const hasPermission = selectedUser.permissions.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {permission.resource} - {permission.action}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        )}
                      </div>
                      <Button
                        variant={hasPermission ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTogglePermission(selectedUser.id, permission.id, hasPermission)}
                      >
                        {hasPermission ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Granted
                          </>
                        ) : (
                          "Grant"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowAssignModal(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
