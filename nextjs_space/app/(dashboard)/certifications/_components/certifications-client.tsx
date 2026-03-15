"use client";

import { useState, useCallback } from "react";
import { format, isPast, addDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import {
  Award,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ChevronRight,
  FileText,
  Calendar,
  Building2,
  Shield,
  AlertCircle,
  XCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type CertificationType =
  | "CSCS"
  | "CSR"
  | "FIRST_AID"
  | "MANUAL_HANDLING"
  | "ASBESTOS"
  | "SCAFFOLDING"
  | "MEWP"
  | "CRANE"
  | "ELECTRICAL"
  | "GAS"
  | "OTHER";
type CertificationStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

interface Certification {
  id: string;
  certificationType: CertificationType;
  certificationName: string;
  cardNumber?: string;
  issuingBody?: string;
  issueDate: string;
  expiryDate?: string;
  isLifetime: boolean;
  documentUrl?: string;
  notes?: string;
  status: CertificationStatus;
  worker: { id: string; name: string; email: string };
  verifiedBy?: { id: string; name: string };
  verifiedAt?: string;
  createdAt: string;
}

interface CertificationsClientProps {
  certifications: Certification[];
  workers: { id: string; user: { id: string; name: string; email: string } }[];
  projects: { id: string; name: string }[];
}

const certificationTypeConfig: Record<
  CertificationType,
  { label: string; color: string; icon: React.ReactNode }
> = {
  CSCS: {
    label: "CSCS Card",
    color: "bg-green-100 text-green-700",
    icon: <Shield className="w-4 h-4" />,
  },
  CSR: {
    label: "CSR Card",
    color: "bg-blue-100 text-blue-700",
    icon: <Shield className="w-4 h-4" />,
  },
  FIRST_AID: {
    label: "First Aid",
    color: "bg-red-100 text-red-700",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  MANUAL_HANDLING: {
    label: "Manual Handling",
    color: "bg-orange-100 text-orange-700",
    icon: <Award className="w-4 h-4" />,
  },
  ASBESTOS: {
    label: "Asbestos",
    color: "bg-purple-100 text-purple-700",
    icon: <Shield className="w-4 h-4" />,
  },
  SCAFFOLDING: {
    label: "Scaffolding",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Building2 className="w-4 h-4" />,
  },
  MEWP: {
    label: "MEWP",
    color: "bg-cyan-100 text-cyan-700",
    icon: <Award className="w-4 h-4" />,
  },
  CRANE: {
    label: "Crane Operation",
    color: "bg-indigo-100 text-indigo-700",
    icon: <Award className="w-4 h-4" />,
  },
  ELECTRICAL: {
    label: "Electrical",
    color: "bg-amber-100 text-amber-700",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  GAS: {
    label: "Gas Safe",
    color: "bg-rose-100 text-rose-700",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  OTHER: {
    label: "Other",
    color: "bg-gray-100 text-gray-700",
    icon: <FileText className="w-4 h-4" />,
  },
};

const statusConfig: Record<
  CertificationStatus,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  VALID: {
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Valid",
  },
  EXPIRING_SOON: {
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Expiring Soon",
  },
  EXPIRED: {
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Expired",
  },
};

export function CertificationsClient({
  certifications,
  workers,
  projects: _projects,
}: CertificationsClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<Certification[]>(certifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCert, setNewCert] = useState({
    workerId: "",
    certificationType: "CSCS" as CertificationType,
    certificationName: "",
    cardNumber: "",
    issuingBody: "",
    issueDate: format(new Date(), "yyyy-MM-dd"),
    expiryDate: "",
    isLifetime: false,
    notes: "",
    documentUrl: "",
  });

  const handleCertEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["certification_created", "certification_updated", "certification_deleted"],
    handleCertEvent,
  );

  const getCertStatus = (cert: Certification): CertificationStatus => {
    if (cert.isLifetime) return "VALID";
    if (!cert.expiryDate) return "VALID";
    const expiry = new Date(cert.expiryDate);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    if (isPast(expiry)) return "EXPIRED";
    if (expiry <= thirtyDaysFromNow) return "EXPIRING_SOON";
    return "VALID";
  };

  const openDetailModal = (cert: Certification) => {
    setSelectedCert(cert);
    setShowDetailModal(true);
  };

  const handleCreate = async () => {
    if (!newCert.workerId || !newCert.certificationName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCert),
      });

      if (res.ok) {
        const created = await res.json();
        setItems((prev) => [created, ...prev]);
        setShowNewModal(false);
        setNewCert({
          workerId: "",
          certificationType: "CSCS",
          certificationName: "",
          cardNumber: "",
          issuingBody: "",
          issueDate: format(new Date(), "yyyy-MM-dd"),
          expiryDate: "",
          isLifetime: false,
          notes: "",
          documentUrl: "",
        });
        toast.success("Certification added successfully");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add certification");
      }
    } catch (_error) {
      toast.error("Failed to add certification");
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = items.filter((cert) => {
    const matchesSearch =
      cert.certificationName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      cert.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.cardNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || cert.certificationType === typeFilter;
    const matchesStatus =
      statusFilter === "all" || getCertStatus(cert) === statusFilter;
    const matchesWorker =
      workerFilter === "all" || cert.worker.id === workerFilter;
    return matchesSearch && matchesType && matchesStatus && matchesWorker;
  });

  const stats = {
    total: items.length,
    valid: items.filter((c) => getCertStatus(c) === "VALID").length,
    expiringSoon: items.filter((c) => getCertStatus(c) === "EXPIRING_SOON")
      .length,
    expired: items.filter((c) => getCertStatus(c) === "EXPIRED").length,
    lifetime: items.filter((c) => c.isLifetime).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/25">
              <Award className="w-6 h-6 text-white" />
            </div>
            Worker Certifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage worker certifications and training records
          </p>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total
                </p>
              </div>
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <Award className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.valid}
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                  Valid
                </p>
              </div>
              <div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-0 shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.expiringSoon}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">
                  Expiring Soon
                </p>
              </div>
              <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-0 shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.expired}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 font-medium">
                  Expired
                </p>
              </div>
              <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.lifetime}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
                  Lifetime
                </p>
              </div>
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, worker, or card number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(certificationTypeConfig).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="VALID">Valid</SelectItem>
                  <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={workerFilter} onValueChange={setWorkerFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Worker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workers</SelectItem>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 shadow-sm"
                    : ""
                }
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 shadow-sm"
                    : ""
                }
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications List/Grid */}
      {filteredCerts.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-fit mx-auto mb-4">
              <Award className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No certifications found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add certifications to track worker qualifications
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredCerts.map((cert) => {
            const status = getCertStatus(cert);
            const typeConfig = certificationTypeConfig[cert.certificationType];
            return (
              <Card
                key={cert.id}
                className="group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-emerald-500"
                onClick={() => openDetailModal(cert)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`${typeConfig.color} border-0`}>
                          {typeConfig.icon}
                          <span className="ml-1">{typeConfig.label}</span>
                        </Badge>
                        <Badge
                          className={`${statusConfig[status].bgColor} ${statusConfig[status].color} border-0`}
                        >
                          {statusConfig[status].icon}
                          <span className="ml-1">
                            {statusConfig[status].label}
                          </span>
                        </Badge>
                        {cert.isLifetime && (
                          <Badge className="bg-blue-500 text-white border-0">
                            <Shield className="w-3 h-3 mr-1" />
                            Lifetime
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {cert.certificationName}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {cert.worker.name}
                        </span>
                        {cert.cardNumber && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Card: {cert.cardNumber}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Issued:{" "}
                          {format(new Date(cert.issueDate), "MMM d, yyyy")}
                        </span>
                        {!cert.isLifetime && cert.expiryDate && (
                          <span
                            className={`flex items-center gap-1.5 ${status === "EXPIRED" ? "text-red-500" : status === "EXPIRING_SOON" ? "text-amber-500" : ""}`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Expires:{" "}
                            {format(new Date(cert.expiryDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCerts.map((cert) => {
            const status = getCertStatus(cert);
            const typeConfig = certificationTypeConfig[cert.certificationType];
            return (
              <Card
                key={cert.id}
                className="group border-0 shadow-md hover:shadow-xl transition-all cursor-pointer border-t-4 border-t-emerald-500"
                onClick={() => openDetailModal(cert)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${typeConfig.color} border-0`}>
                      {typeConfig.icon}
                      <span className="ml-1">{typeConfig.label}</span>
                    </Badge>
                    <Badge
                      className={`${statusConfig[status].bgColor} ${statusConfig[status].color} border-0`}
                    >
                      {statusConfig[status].label}
                    </Badge>
                  </div>
                  <p className="text-slate-900 dark:text-white font-medium mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {cert.certificationName}
                  </p>
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{cert.worker.name}</span>
                    </div>
                    {cert.cardNumber && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{cert.cardNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Issued {format(new Date(cert.issueDate), "MMM yyyy")}
                    </span>
                    {!cert.isLifetime && cert.expiryDate && (
                      <span
                        className={
                          status === "EXPIRED"
                            ? "text-red-500"
                            : status === "EXPIRING_SOON"
                              ? "text-amber-500"
                              : "text-slate-500"
                        }
                      >
                        Expires {format(new Date(cert.expiryDate), "MMM yyyy")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Certification Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              Add Certification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Worker *
                </label>
                <Select
                  value={newCert.workerId}
                  onValueChange={(v) => setNewCert({ ...newCert, workerId: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.user.id} value={w.user.id}>
                        {w.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Certification Type *
                </label>
                <Select
                  value={newCert.certificationType}
                  onValueChange={(v) =>
                    setNewCert({
                      ...newCert,
                      certificationType: v as CertificationType,
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(certificationTypeConfig).map(
                      ([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Certification Name *
              </label>
              <Input
                className="mt-1.5"
                value={newCert.certificationName}
                onChange={(e) =>
                  setNewCert({ ...newCert, certificationName: e.target.value })
                }
                placeholder="e.g., CSCS Green Card, First Aid Level 3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Card/Number
                </label>
                <Input
                  className="mt-1.5"
                  value={newCert.cardNumber}
                  onChange={(e) =>
                    setNewCert({ ...newCert, cardNumber: e.target.value })
                  }
                  placeholder="e.g., CSC123456789"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Issuing Body
                </label>
                <Input
                  className="mt-1.5"
                  value={newCert.issuingBody}
                  onChange={(e) =>
                    setNewCert({ ...newCert, issuingBody: e.target.value })
                  }
                  placeholder="e.g., CITB, HSE"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Issue Date *
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={newCert.issueDate}
                  onChange={(e) =>
                    setNewCert({ ...newCert, issueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={newCert.expiryDate}
                  onChange={(e) =>
                    setNewCert({ ...newCert, expiryDate: e.target.value })
                  }
                  disabled={newCert.isLifetime}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isLifetime"
                checked={newCert.isLifetime}
                onCheckedChange={(checked) =>
                  setNewCert({
                    ...newCert,
                    isLifetime: checked as boolean,
                    expiryDate: "",
                  })
                }
              />
              <label
                htmlFor="isLifetime"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Lifetime Certification (no expiry)
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <Textarea
                className="mt-1.5"
                value={newCert.notes}
                onChange={(e) =>
                  setNewCert({ ...newCert, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? "Saving..." : "Add Certification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  Certification Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={`${certificationTypeConfig[selectedCert.certificationType].color} border-0`}
                  >
                    {
                      certificationTypeConfig[selectedCert.certificationType]
                        .label
                    }
                  </Badge>
                  <Badge
                    className={`${statusConfig[getCertStatus(selectedCert)].bgColor} ${statusConfig[getCertStatus(selectedCert)].color} border-0`}
                  >
                    {statusConfig[getCertStatus(selectedCert)].label}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">
                      Certification
                    </h4>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedCert.certificationName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Worker:</span>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedCert.worker.name}
                      </p>
                    </div>
                    {selectedCert.cardNumber && (
                      <div>
                        <span className="text-slate-500">Card Number:</span>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {selectedCert.cardNumber}
                        </p>
                      </div>
                    )}
                    {selectedCert.issuingBody && (
                      <div>
                        <span className="text-slate-500">Issuing Body:</span>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {selectedCert.issuingBody}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Issue Date:</span>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {format(
                          new Date(selectedCert.issueDate),
                          "MMM d, yyyy",
                        )}
                      </p>
                    </div>
                    {!selectedCert.isLifetime && selectedCert.expiryDate && (
                      <div>
                        <span className="text-slate-500">Expiry Date:</span>
                        <p
                          className={`font-medium ${getCertStatus(selectedCert) === "EXPIRED" ? "text-red-500" : getCertStatus(selectedCert) === "EXPIRING_SOON" ? "text-amber-500" : "text-slate-900 dark:text-white"}`}
                        >
                          {format(
                            new Date(selectedCert.expiryDate),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedCert.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">
                      Notes
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      {selectedCert.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
