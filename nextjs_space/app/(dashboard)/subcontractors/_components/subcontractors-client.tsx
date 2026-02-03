"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Building2, Plus, Search, Star, Phone, Mail, _MapPin, FileText,
  Edit2, Trash2, Loader2, Wrench, Zap, Droplet, Wind, AlertTriangle,
  _CheckCircle, _Clock, Shield
} from "lucide-react";
import { Card, CardContent, _CardHeader, _CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useRealtimeSubscription } from "@/components/realtime-provider";

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  contractAmount: number;
  paidAmount: number;
  status: string;
  project?: { id: string; name: string };
}

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  trade: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  rating?: number;
  notes?: string;
  contracts: Contract[];
  _count: { contracts: number; costItems: number };
  createdAt: string;
}

const TRADES = [
  { value: "GENERAL", label: "General Contractor", icon: Building2 },
  { value: "ELECTRICAL", label: "Electrical", icon: Zap },
  { value: "PLUMBING", label: "Plumbing", icon: Droplet },
  { value: "HVAC", label: "HVAC", icon: Wind },
  { value: "ROOFING", label: "Roofing", icon: Building2 },
  { value: "CONCRETE", label: "Concrete", icon: Building2 },
  { value: "FRAMING", label: "Framing", icon: Building2 },
  { value: "DRYWALL", label: "Drywall", icon: Building2 },
  { value: "PAINTING", label: "Painting", icon: Building2 },
  { value: "FLOORING", label: "Flooring", icon: Building2 },
  { value: "LANDSCAPING", label: "Landscaping", icon: Building2 },
  { value: "EXCAVATION", label: "Excavation", icon: Wrench },
  { value: "MASONRY", label: "Masonry", icon: Building2 },
  { value: "STEEL", label: "Steel", icon: Wrench },
  { value: "GLAZING", label: "Glazing", icon: Building2 },
  { value: "FIRE_PROTECTION", label: "Fire Protection", icon: Shield },
  { value: "OTHER", label: "Other", icon: Wrench },
];

const CONTRACT_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  TERMINATED: { label: "Terminated", color: "bg-red-100 text-red-700" },
  DISPUTED: { label: "Disputed", color: "bg-orange-100 text-orange-700" },
};

export function SubcontractorsClient({
  initialSubcontractors,
  initialSummary
}: {
  initialSubcontractors: Subcontractor[];
  initialSummary: { total: number; totalContractValue: number; activeContracts: number };
}) {
  const router = useRouter();
  const [subcontractors] = useState<Subcontractor[]>(initialSubcontractors);
  const [summary] = useState(initialSummary);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Subcontractor | null>(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    trade: "GENERAL",
    licenseNumber: "",
    insuranceExpiry: "",
    rating: "",
    notes: ""
  });

  const handleSubcontractorEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["subcontractor_created", "subcontractor_updated", "subcontractor_deleted"],
    handleSubcontractorEvent
  );

  const filteredSubcontractors = subcontractors.filter((item) => {
    const matchesSearch = item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase());
    const matchesTrade = tradeFilter === "all" || item.trade === tradeFilter;
    return matchesSearch && matchesTrade;
  });

  const handleCreate = async () => {
    if (!newItem.companyName || !newItem.contactName || !newItem.email) {
      toast.error("Company name, contact name, and email are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subcontractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error("Failed to create subcontractor");
      toast.success("Subcontractor created successfully");
      setShowNewModal(false);
      setNewItem({
        companyName: "", contactName: "", email: "", phone: "", address: "",
        trade: "GENERAL", licenseNumber: "", insuranceExpiry: "", rating: "", notes: ""
      });
      router.refresh();
    } catch (error) {
      toast.error("Failed to create subcontractor");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/subcontractors/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedItem)
      });
      if (!res.ok) throw new Error("Failed to update subcontractor");
      toast.success("Subcontractor updated successfully");
      setShowEditModal(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update subcontractor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcontractor? This will also delete all associated contracts.")) return;
    try {
      const res = await fetch(`/api/subcontractors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subcontractor");
      toast.success("Subcontractor deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete subcontractor");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    }).format(amount);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Subcontractors</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Contracts</p>
                <p className="text-2xl font-bold text-green-600">{summary.activeContracts}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Contract Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalContractValue)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
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
              placeholder="Search subcontractors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Subcontractor
        </Button>
      </div>

      {/* Subcontractors Grid */}
      {filteredSubcontractors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No subcontractors found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubcontractors.map((sub) => {
            const tradeConfig = TRADES.find(t => t.value === sub.trade) || TRADES[0];
            const TradeIcon = tradeConfig.icon;
            const activeContracts = sub.contracts.filter(c => c.status === "ACTIVE").length;
            const totalValue = sub.contracts.reduce((sum, c) => sum + c.contractAmount, 0);
            const isInsuranceExpiring = sub.insuranceExpiry && 
              new Date(sub.insuranceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                  setSelectedItem(sub);
                  setShowDetailModal(true);
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TradeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{sub.companyName}</h3>
                          <p className="text-sm text-gray-500">{tradeConfig.label}</p>
                        </div>
                      </div>
                      {renderStars(sub.rating ?? undefined)}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{sub.email}</span>
                      </div>
                      {sub.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{sub.phone}</span>
                        </div>
                      )}
                    </div>

                    {isInsuranceExpiring && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded mb-3">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Insurance expires {sub.insuranceExpiry && format(new Date(sub.insuranceExpiry), "MMM d, yyyy")}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Contracts:</span>{" "}
                        <span className="font-medium">{activeContracts} active</span>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(totalValue)}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(sub);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(sub.id)}
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

      {/* New Subcontractor Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Subcontractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company Name *</label>
                <Input
                  value={newItem.companyName}
                  onChange={(e) => setNewItem({ ...newItem, companyName: e.target.value })}
                  placeholder="e.g., ABC Electrical Ltd"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Trade *</label>
                <Select value={newItem.trade} onValueChange={(v) => setNewItem({ ...newItem, trade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRADES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contact Name *</label>
                <Input
                  value={newItem.contactName}
                  onChange={(e) => setNewItem({ ...newItem, contactName: e.target.value })}
                  placeholder="Primary contact"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={newItem.email}
                  onChange={(e) => setNewItem({ ...newItem, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={newItem.phone}
                  onChange={(e) => setNewItem({ ...newItem, phone: e.target.value })}
                  placeholder="+44 000 0000 000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">License Number</label>
                <Input
                  value={newItem.licenseNumber}
                  onChange={(e) => setNewItem({ ...newItem, licenseNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={newItem.address}
                onChange={(e) => setNewItem({ ...newItem, address: e.target.value })}
                placeholder="Business address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Insurance Expiry</label>
                <Input
                  type="date"
                  value={newItem.insuranceExpiry}
                  onChange={(e) => setNewItem({ ...newItem, insuranceExpiry: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rating (1-5)</label>
                <Select value={newItem.rating} onValueChange={(v) => setNewItem({ ...newItem, rating: v })}>
                  <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No rating</SelectItem>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={r.toString()}>{r} Star{r > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <DialogTitle>Edit Subcontractor</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={selectedItem.companyName}
                    onChange={(e) => setSelectedItem({ ...selectedItem, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Trade</label>
                  <Select value={selectedItem.trade} onValueChange={(v) => setSelectedItem({ ...selectedItem, trade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRADES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Contact Name</label>
                  <Input
                    value={selectedItem.contactName}
                    onChange={(e) => setSelectedItem({ ...selectedItem, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={selectedItem.email}
                    onChange={(e) => setSelectedItem({ ...selectedItem, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={selectedItem.phone || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">License Number</label>
                  <Input
                    value={selectedItem.licenseNumber || ""}
                    onChange={(e) => setSelectedItem({ ...selectedItem, licenseNumber: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={selectedItem.address || ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem, address: e.target.value })}
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

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.companyName}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{selectedItem.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trade</p>
                  <p className="font-medium">{TRADES.find(t => t.value === selectedItem.trade)?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedItem.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedItem.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  {renderStars(selectedItem.rating ?? undefined) || <p className="font-medium">-</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Insurance Expiry</p>
                  <p className="font-medium">
                    {selectedItem.insuranceExpiry 
                      ? format(new Date(selectedItem.insuranceExpiry), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>
              </div>

              {selectedItem.contracts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Contracts</h4>
                  <div className="space-y-2">
                    {selectedItem.contracts.map((contract) => {
                      const statusConfig = CONTRACT_STATUS[contract.status] || CONTRACT_STATUS.DRAFT;
                      return (
                        <div key={contract.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{contract.title}</p>
                            <p className="text-sm text-gray-500">{contract.project?.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            <p className="text-sm font-medium mt-1">{formatCurrency(contract.contractAmount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedItem.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
