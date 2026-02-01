"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Package, Plus, Search, Truck, CheckCircle, Clock, AlertTriangle,
  Edit2, Trash2, Loader2, MapPin, Calendar, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEntitySubscription } from "@/hooks/use-entity-subscription";
import { MATERIAL_STATUS_CONFIG } from "@/lib/constants/status-configs";

interface Material {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit: string;
  quantityNeeded: number;
  quantityOrdered: number;
  quantityReceived: number;
  quantityInstalled: number;
  unitCost: number;
  totalCost: number;
  status: string;
  supplier?: string;
  leadTime?: number;
  expectedDate?: string;
  deliveredDate?: string;
  location?: string;
  notes?: string;
  projectId: string;
  project?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PLANNED: { label: "Planned", color: "bg-gray-100 text-gray-700", icon: Clock },
  ORDERED: { label: "Ordered", color: "bg-blue-100 text-blue-700", icon: Package },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-700", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  INSTALLED: { label: "Installed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  RETURNED: { label: "Returned", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const UNITS = ["each", "sqft", "linear ft", "cubic yard", "ton", "gallon", "box", "pallet", "roll"];

export function MaterialsClient({
  initialMaterials,
  initialSummary,
  projects
}: {
  initialMaterials: Material[];
  initialSummary: { totalValue: number; totalOrdered: number; totalReceived: number };
  projects: Project[];
}) {
  const router = useRouter();
  const [materials] = useState<Material[]>(initialMaterials);
  const [summary] = useState(initialSummary);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    projectId: "",
    name: "",
    description: "",
    sku: "",
    category: "",
    unit: "each",
    quantityNeeded: "",
    quantityOrdered: "",
    unitCost: "",
    status: "PLANNED",
    supplier: "",
    leadTime: "",
    expectedDate: "",
    location: "",
    notes: ""
  });

  // Use centralized realtime subscription hook
  useEntitySubscription('material');

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesProject = projectFilter === "all" || item.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreate = async () => {
    if (!newItem.projectId || !newItem.name) {
      toast.error("Project and name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error("Failed to create material");
      toast.success("Material created successfully");
      setShowNewModal(false);
      setNewItem({
        projectId: "", name: "", description: "", sku: "", category: "", unit: "each",
        quantityNeeded: "", quantityOrdered: "", unitCost: "", status: "PLANNED",
        supplier: "", leadTime: "", expectedDate: "", location: "", notes: ""
      });
      router.refresh();
    } catch (error) {
      toast.error("Failed to create material");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/materials/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedItem)
      });
      if (!res.ok) throw new Error("Failed to update material");
      toast.success("Material updated successfully");
      setShowEditModal(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update material");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete material");
      toast.success("Material deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete material");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalValue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ordered</p>
                <p className="text-2xl font-bold text-blue-600">
                  {materials.filter(m => m.status === "ORDERED" || m.status === "SHIPPED").length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {materials.filter(m => m.status === "DELIVERED" || m.status === "INSTALLED").length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Material
        </Button>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No materials found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => {
            const statusConfig = STATUS_CONFIG[material.status] || STATUS_CONFIG.PLANNED;
            const StatusIcon = statusConfig.icon;
            const receivedPercent = material.quantityNeeded > 0 
              ? (material.quantityReceived / material.quantityNeeded) * 100 
              : 0;

            return (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{material.name}</h3>
                        {material.sku && (
                          <p className="text-xs text-gray-500">SKU: {material.sku}</p>
                        )}
                      </div>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{material.project?.name}</p>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-medium">
                          {material.quantityReceived} / {material.quantityNeeded} {material.unit}
                        </span>
                      </div>
                      <Progress value={receivedPercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Unit Cost</span>
                        <p className="font-medium">{formatCurrency(material.unitCost)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total</span>
                        <p className="font-medium">{formatCurrency(material.totalCost)}</p>
                      </div>
                    </div>

                    {material.supplier && (
                      <p className="text-xs text-gray-500 mb-2">
                        Supplier: {material.supplier}
                      </p>
                    )}

                    {material.expectedDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Calendar className="h-3 w-3" />
                        Expected: {format(new Date(material.expectedDate), "MMM d, yyyy")}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(material);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Material Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium">Project *</label>
              <Select value={newItem.projectId} onValueChange={(v) => setNewItem({ ...newItem, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Steel Beams"
                />
              </div>
              <div>
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Material description"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Quantity Needed</label>
                <Input
                  type="number"
                  value={newItem.quantityNeeded}
                  onChange={(e) => setNewItem({ ...newItem, quantityNeeded: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Unit</label>
                <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Unit Cost (£)</label>
                <Input
                  type="number"
                  value={newItem.unitCost}
                  onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <Input
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={newItem.status} onValueChange={(v) => setNewItem({ ...newItem, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Lead Time (days)</label>
                <Input
                  type="number"
                  value={newItem.leadTime}
                  onChange={(e) => setNewItem({ ...newItem, leadTime: e.target.value })}
                  placeholder="e.g., 14"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expected Delivery</label>
                <Input
                  type="date"
                  value={newItem.expectedDate}
                  onChange={(e) => setNewItem({ ...newItem, expectedDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Storage Location</label>
              <Input
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                placeholder="e.g., Warehouse A, Bay 5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={selectedItem.name}
                  onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Qty Needed</label>
                  <Input
                    type="number"
                    value={selectedItem.quantityNeeded}
                    onChange={(e) => setSelectedItem({ ...selectedItem, quantityNeeded: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Qty Ordered</label>
                  <Input
                    type="number"
                    value={selectedItem.quantityOrdered}
                    onChange={(e) => setSelectedItem({ ...selectedItem, quantityOrdered: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Qty Received</label>
                  <Input
                    type="number"
                    value={selectedItem.quantityReceived}
                    onChange={(e) => setSelectedItem({ ...selectedItem, quantityReceived: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Unit Cost (£)</label>
                  <Input
                    type="number"
                    value={selectedItem.unitCost}
                    onChange={(e) => setSelectedItem({ ...selectedItem, unitCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedItem.status} onValueChange={(v) => setSelectedItem({ ...selectedItem, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <Input
                  value={selectedItem.supplier || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, supplier: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={selectedItem.location || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, location: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
