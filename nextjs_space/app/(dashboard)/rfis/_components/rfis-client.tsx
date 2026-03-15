"use client";

import { useState, useCallback } from "react";
import {
  format,
  formatDistanceToNow,
  isPast,
  isWithinInterval,
  addDays,
} from "date-fns";
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Paperclip,
  Calendar,
  ArrowRight,
  X,
  PoundSterling,
  Timer,
  LayoutGrid,
  List,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Eye,
  User,
  Building2,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { FileUpload } from "@/components/ui/file-upload";
import { useRouter } from "next/navigation";

interface Attachment {
  id?: string;
  name: string;
  cloud_storage_path?: string;
  cloudStoragePath?: string;
  fileSize?: number;
  mimeType?: string;
  isUploading?: boolean;
}

interface RFI {
  id: string;
  number: number;
  subject: string;
  question: string;
  answer?: string;
  status: "DRAFT" | "OPEN" | "ANSWERED" | "CLOSED";
  dueDate?: string;
  ballInCourt?: string;
  specSection?: string;
  drawingRef?: string;
  costImpact: boolean;
  scheduleImpact: boolean;
  projectId: string;
  project: { id: string; name: string };
  createdBy: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string };
  answeredAt?: string;
  createdAt: string;
  _count: { attachments: number };
}

interface RFIsClientProps {
  initialRFIs: RFI[];
  projects: { id: string; name: string }[];
  teamMembers: {
    id: string;
    user: { id: string; name: string; email: string };
  }[];
}

const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  DRAFT: {
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Draft",
  },
  OPEN: {
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: <Send className="w-3.5 h-3.5" />,
    label: "Open",
  },
  ANSWERED: {
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Answered",
  },
  CLOSED: {
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Closed",
  },
};

export function RFIsClient({
  initialRFIs,
  projects,
  teamMembers,
}: RFIsClientProps) {
  const router = useRouter();
  const [rfis, setRFIs] = useState<RFI[]>(initialRFIs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [loading, setLoading] = useState(false);
  const [newRFI, setNewRFI] = useState({
    subject: "",
    question: "",
    projectId: "",
    dueDate: "",
    assignedToId: "",
    specSection: "",
    drawingRef: "",
    costImpact: false,
    scheduleImpact: false,
  });
  const [answerInput, setAnswerInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const handleRFIEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(
    ["rfi_created", "rfi_updated", "rfi_deleted"],
    handleRFIEvent,
  );

  const fetchAttachments = async (rfiId: string) => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/rfis/${rfiId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(
          data.map((a: any) => ({
            id: a.id,
            name: a.name,
            cloud_storage_path: a.cloudStoragePath,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
          })),
        );
      }
    } catch (_error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleAttachmentUpload = async (file: Attachment) => {
    if (!selectedRFI || !file.cloud_storage_path) return;
    try {
      const res = await fetch(`/api/rfis/${selectedRFI.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          cloud_storage_path: file.cloud_storage_path,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setAttachments((prev) =>
          prev.map((a) =>
            a.name === file.name && !a.id ? { ...a, id: saved.id } : a,
          ),
        );
      }
    } catch (_error) {
      console.error("Failed to save attachment:", error);
    }
  };

  const handleAttachmentDelete = async (file: Attachment) => {
    if (!selectedRFI || !file.id) return;
    try {
      await fetch(
        `/api/rfis/${selectedRFI.id}/attachments?attachmentId=${file.id}`,
        {
          method: "DELETE",
        },
      );
    } catch (_error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  const openDetailModal = (rfi: RFI) => {
    setSelectedRFI(rfi);
    setAttachments([]);
    setShowDetailModal(true);
    fetchAttachments(rfi.id);
  };

  const handleCreateRFI = async () => {
    if (!newRFI.subject || !newRFI.question || !newRFI.projectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rfis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRFI),
      });

      if (res.ok) {
        const created = await res.json();
        setRFIs([created, ...rfis]);
        setShowNewModal(false);
        setNewRFI({
          subject: "",
          question: "",
          projectId: "",
          dueDate: "",
          assignedToId: "",
          specSection: "",
          drawingRef: "",
          costImpact: false,
          scheduleImpact: false,
        });
        toast.success("RFI created successfully");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create RFI");
      }
    } catch (_error) {
      toast.error("Failed to create RFI");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerRFI = async () => {
    if (!selectedRFI || !answerInput.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rfis/${selectedRFI.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerInput }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRFIs(
          rfis.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
        );
        setSelectedRFI({ ...selectedRFI, ...updated });
        setAnswerInput("");
        toast.success("RFI answered successfully");
      } else {
        toast.error("Failed to answer RFI");
      }
    } catch (_error) {
      toast.error("Failed to answer RFI");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRFI = async () => {
    if (!selectedRFI) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/rfis/${selectedRFI.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRFIs(
          rfis.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
        );
        setSelectedRFI({ ...selectedRFI, ...updated });
        toast.success("RFI closed");
      }
    } catch (_error) {
      toast.error("Failed to close RFI");
    } finally {
      setLoading(false);
    }
  };

  const filteredRFIs = rfis.filter((rfi) => {
    const matchesSearch =
      rfi.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfi.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `RFI-${rfi.number}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfi.status === statusFilter;
    const matchesProject =
      projectFilter === "all" || rfi.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const stats = {
    total: rfis.length,
    open: rfis.filter((r) => r.status === "OPEN").length,
    answered: rfis.filter((r) => r.status === "ANSWERED").length,
    overdue: rfis.filter(
      (r) => r.dueDate && isPast(new Date(r.dueDate)) && r.status === "OPEN",
    ).length,
    dueSoon: rfis.filter(
      (r) =>
        r.dueDate &&
        !isPast(new Date(r.dueDate)) &&
        isWithinInterval(new Date(r.dueDate), {
          start: new Date(),
          end: addDays(new Date(), 7),
        }) &&
        r.status === "OPEN",
    ).length,
    withCostImpact: rfis.filter((r) => r.costImpact && r.status !== "CLOSED")
      .length,
  };

  const getUrgencyIndicator = (rfi: RFI) => {
    if (rfi.status === "CLOSED" || rfi.status === "ANSWERED") return null;
    if (rfi.dueDate && isPast(new Date(rfi.dueDate))) return "overdue";
    if (
      rfi.dueDate &&
      isWithinInterval(new Date(rfi.dueDate), {
        start: new Date(),
        end: addDays(new Date(), 3),
      })
    )
      return "urgent";
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            Requests for Information
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track RFIs and responses across projects
          </p>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          New RFI
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total RFIs
                </p>
              </div>
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <FileQuestion className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.open}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
                  Open
                </p>
              </div>
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.answered}
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                  Answered
                </p>
              </div>
              <div className="p-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.overdue}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 font-medium">
                  Overdue
                </p>
              </div>
              <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.dueSoon}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">
                  Due Soon
                </p>
              </div>
              <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg">
                <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-0 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.withCostImpact}
                </p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">
                  Cost Impact
                </p>
              </div>
              <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <PoundSterling className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by subject, question, or RFI number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ANSWERED">Answered</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
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

      {/* RFI List/Grid */}
      {filteredRFIs.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit mx-auto mb-4">
              <FileQuestion className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No RFIs found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Get started by creating your first RFI
            </p>
            <Button
              onClick={() => setShowNewModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Create RFI
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredRFIs.map((rfi) => {
            const urgency = getUrgencyIndicator(rfi);
            return (
              <Card
                key={rfi.id}
                className={`group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  urgency === "overdue"
                    ? "border-l-4 border-l-red-500"
                    : urgency === "urgent"
                      ? "border-l-4 border-l-amber-500"
                      : ""
                }`}
                onClick={() => openDetailModal(rfi)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                          RFI-{String(rfi.number).padStart(3, "0")}
                        </span>
                        <Badge
                          className={`${statusConfig[rfi.status].bgColor} ${statusConfig[rfi.status].color} border-0`}
                        >
                          {statusConfig[rfi.status].icon}
                          <span className="ml-1">
                            {statusConfig[rfi.status].label}
                          </span>
                        </Badge>
                        {rfi.costImpact && (
                          <Badge
                            variant="outline"
                            className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                          >
                            <PoundSterling className="w-3 h-3 mr-1" />
                            Cost Impact
                          </Badge>
                        )}
                        {rfi.scheduleImpact && (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20"
                          >
                            <Timer className="w-3 h-3 mr-1" />
                            Schedule Impact
                          </Badge>
                        )}
                        {urgency === "overdue" && (
                          <Badge className="bg-red-500 text-white border-0">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {rfi.subject}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {rfi.question}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {rfi.project.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {rfi.createdBy.name}
                        </span>
                        {rfi.dueDate && (
                          <span
                            className={`flex items-center gap-1.5 ${urgency === "overdue" ? "text-red-500 font-medium" : urgency === "urgent" ? "text-amber-500 font-medium" : ""}`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Due {format(new Date(rfi.dueDate), "MMM d")}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(rfi.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {rfi._count.attachments > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5" />
                            {rfi._count.attachments}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRFIs.map((rfi) => {
            const urgency = getUrgencyIndicator(rfi);
            return (
              <Card
                key={rfi.id}
                className={`group border-0 shadow-md hover:shadow-xl transition-all cursor-pointer ${
                  urgency === "overdue"
                    ? "ring-2 ring-red-500"
                    : urgency === "urgent"
                      ? "ring-2 ring-amber-500"
                      : ""
                }`}
                onClick={() => openDetailModal(rfi)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                      RFI-{String(rfi.number).padStart(3, "0")}
                    </span>
                    <Badge
                      className={`${statusConfig[rfi.status].bgColor} ${statusConfig[rfi.status].color} border-0`}
                    >
                      {statusConfig[rfi.status].label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {rfi.subject}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {rfi.question}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {rfi.costImpact && (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-300 text-xs"
                      >
                        <PoundSterling className="w-3 h-3 mr-1" />
                        Cost
                      </Badge>
                    )}
                    {rfi.scheduleImpact && (
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-300 text-xs"
                      >
                        <Timer className="w-3 h-3 mr-1" />
                        Schedule
                      </Badge>
                    )}
                    {urgency === "overdue" && (
                      <Badge className="bg-red-500 text-white border-0 text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
                      {rfi.project.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(rfi.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New RFI Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileQuestion className="w-5 h-5 text-purple-600" />
              </div>
              Create New RFI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Project *
              </label>
              <Select
                value={newRFI.projectId}
                onValueChange={(v) => setNewRFI({ ...newRFI, projectId: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Subject *
              </label>
              <Input
                className="mt-1.5"
                value={newRFI.subject}
                onChange={(e) =>
                  setNewRFI({ ...newRFI, subject: e.target.value })
                }
                placeholder="Brief description of the RFI"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Question *
              </label>
              <Textarea
                className="mt-1.5"
                value={newRFI.question}
                onChange={(e) =>
                  setNewRFI({ ...newRFI, question: e.target.value })
                }
                placeholder="Detailed question or clarification needed"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Due Date
                </label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={newRFI.dueDate}
                  onChange={(e) =>
                    setNewRFI({ ...newRFI, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Assign To
                </label>
                <Select
                  value={newRFI.assignedToId}
                  onValueChange={(v) =>
                    setNewRFI({ ...newRFI, assignedToId: v })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((tm) => (
                      <SelectItem key={tm.user.id} value={tm.user.id}>
                        {tm.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Spec Section
                </label>
                <Input
                  className="mt-1.5"
                  value={newRFI.specSection}
                  onChange={(e) =>
                    setNewRFI({ ...newRFI, specSection: e.target.value })
                  }
                  placeholder="e.g., 03 30 00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Drawing Reference
                </label>
                <Input
                  className="mt-1.5"
                  value={newRFI.drawingRef}
                  onChange={(e) =>
                    setNewRFI({ ...newRFI, drawingRef: e.target.value })
                  }
                  placeholder="e.g., A-101"
                />
              </div>
            </div>
            <div className="flex gap-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRFI.costImpact}
                  onChange={(e) =>
                    setNewRFI({ ...newRFI, costImpact: e.target.checked })
                  }
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Cost Impact
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRFI.scheduleImpact}
                  onChange={(e) =>
                    setNewRFI({ ...newRFI, scheduleImpact: e.target.checked })
                  }
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Schedule Impact
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRFI}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Creating..." : "Create RFI"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RFI Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRFI && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3">
                    <span className="font-mono text-lg text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded">
                      RFI-{String(selectedRFI.number).padStart(3, "0")}
                    </span>
                    <Badge
                      className={`${statusConfig[selectedRFI.status].bgColor} ${statusConfig[selectedRFI.status].color} border-0`}
                    >
                      {statusConfig[selectedRFI.status].label}
                    </Badge>
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedRFI.subject}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {selectedRFI.project.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Created By:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedRFI.createdBy.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Assigned To:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedRFI.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                  {selectedRFI.specSection && (
                    <div className="flex items-center gap-2">
                      <FileQuestion className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Spec Section:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedRFI.specSection}
                      </span>
                    </div>
                  )}
                  {selectedRFI.drawingRef && (
                    <div className="flex items-center gap-2">
                      <FileQuestion className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Drawing Ref:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {selectedRFI.drawingRef}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-5">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    Question
                  </h4>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                      {selectedRFI.question}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-5">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-purple-500" />
                    Attachments
                  </h4>
                  <FileUpload
                    files={attachments}
                    onFilesChange={setAttachments}
                    onUploadComplete={handleAttachmentUpload}
                    onDelete={handleAttachmentDelete}
                    maxFiles={10}
                    maxSize={50}
                    disabled={selectedRFI.status === "CLOSED"}
                  />
                </div>

                {selectedRFI.answer && (
                  <div className="border-t pt-5">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Answer
                    </h4>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {selectedRFI.answer}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRFI.status === "OPEN" && (
                  <div className="border-t pt-5">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                      Provide Answer
                    </h4>
                    <Textarea
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={4}
                      className="bg-slate-50 dark:bg-slate-800"
                    />
                    <div className="flex justify-end gap-3 mt-3">
                      <Button
                        onClick={handleAnswerRFI}
                        disabled={loading || !answerInput.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {loading ? "Submitting..." : "Submit Answer"}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedRFI.status === "ANSWERED" && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleCloseRFI}
                      disabled={loading}
                      variant="outline"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Close RFI
                    </Button>
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
