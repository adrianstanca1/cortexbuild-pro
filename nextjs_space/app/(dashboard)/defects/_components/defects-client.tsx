"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Loader2,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

const TRADES = [
  "GENERAL",
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "ROOFING",
  "CONCRETE",
  "FRAMING",
  "DRYWALL",
  "PAINTING",
  "FLOORING",
  "LANDSCAPING",
  "OTHER",
];

const STATUSES = [
  "IDENTIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "VERIFIED",
  "DISPUTED",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    IDENTIFIED: "bg-red-500",
    ASSIGNED: "bg-blue-500",
    IN_PROGRESS: "bg-yellow-500",
    COMPLETED: "bg-green-500",
    VERIFIED: "bg-emerald-600",
    DISPUTED: "bg-orange-500",
  };
  return colors[status] || "bg-gray-500";
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    LOW: "bg-gray-400",
    MEDIUM: "bg-yellow-500",
    HIGH: "bg-orange-500",
    CRITICAL: "bg-red-600",
  };
  return colors[priority] || "bg-gray-500";
};

interface DefectsClientProps {
  defects: any[];
  projects: any[];
  teamMembers: any[];
}

export function DefectsClient({
  defects: initialDefects,
  projects,
  teamMembers,
}: DefectsClientProps) {
  const [defects, setDefects] = useState(initialDefects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDefect, setNewDefect] = useState({
    projectId: "",
    title: "",
    description: "",
    location: "",
    floor: "",
    room: "",
    trade: "GENERAL",
    priority: "MEDIUM",
    dueDate: "",
    responsibleParty: "",
    assignedToId: "",
  });

  const filteredDefects = defects.filter((defect) => {
    const matchesSearch =
      defect.title.toLowerCase().includes(search.toLowerCase()) ||
      defect.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || defect.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || defect.priority === priorityFilter;
    const matchesTrade = tradeFilter === "all" || defect.trade === tradeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesTrade;
  });

  const handleCreateDefect = async () => {
    if (!newDefect.projectId || !newDefect.title) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDefect),
      });
      if (!res.ok) throw new Error("Failed to create defect");
      const defect = await res.json();
      setDefects([defect, ...defects]);
      setShowNewModal(false);
      setNewDefect({
        projectId: "",
        title: "",
        description: "",
        location: "",
        floor: "",
        room: "",
        trade: "GENERAL",
        priority: "MEDIUM",
        dueDate: "",
        responsibleParty: "",
        assignedToId: "",
      });
      toast.success("Defect logged successfully");
    } catch (_error) {
      toast.error("Failed to create defect");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: defects.length,
    open: defects.filter((d) =>
      ["IDENTIFIED", "ASSIGNED", "IN_PROGRESS"].includes(d.status),
    ).length,
    completed: defects.filter(
      (d) => d.status === "COMPLETED" || d.status === "VERIFIED",
    ).length,
    critical: defects.filter(
      (d) => d.priority === "CRITICAL" && d.status !== "VERIFIED",
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Defects</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.open}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
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
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.critical}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center flex-wrap w-full md:w-auto">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search defects..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Log Defect
        </Button>
      </div>

      {/* Defects List */}
      <div className="grid gap-4">
        {filteredDefects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No defects found</p>
              <Button
                onClick={() => setShowNewModal(true)}
                variant="outline"
                className="mt-4"
              >
                Log First Defect
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredDefects.map((defect) => (
            <Card key={defect.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div
                      className={`p-2 rounded-lg ${getPriorityColor(defect.priority)} bg-opacity-20`}
                    >
                      <AlertTriangle
                        className={`h-5 w-5 ${defect.priority === "CRITICAL" ? "text-red-600" : "text-orange-600"}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{defect.number}
                        </span>
                        <h3
                          className="font-semibold"
                          style={{ color: "#1a1a1a" }}
                        >
                          {defect.title}
                        </h3>
                        <Badge className={getStatusColor(defect.status)}>
                          {defect.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(defect.priority)}>
                          {defect.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {defect.project?.name}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {defect.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {defect.location}
                          </span>
                        )}
                        {defect.floor && <span>Floor: {defect.floor}</span>}
                        {defect.room && <span>Room: {defect.room}</span>}
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> {defect.trade}
                        </span>
                        {defect.dueDate && (
                          <span>
                            Due:{" "}
                            {format(new Date(defect.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Defect Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log New Defect</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <Select
                  value={newDefect.projectId}
                  onValueChange={(v) =>
                    setNewDefect({ ...newDefect, projectId: v })
                  }
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium">Trade</label>
                <Select
                  value={newDefect.trade}
                  onValueChange={(v) =>
                    setNewDefect({ ...newDefect, trade: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={newDefect.title}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, title: e.target.value })
                }
                placeholder="Brief description of the defect"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newDefect.description}
                onChange={(e) =>
                  setNewDefect({ ...newDefect, description: e.target.value })
                }
                placeholder="Detailed description..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newDefect.location}
                  onChange={(e) =>
                    setNewDefect({ ...newDefect, location: e.target.value })
                  }
                  placeholder="e.g., Building A"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Floor</label>
                <Input
                  value={newDefect.floor}
                  onChange={(e) =>
                    setNewDefect({ ...newDefect, floor: e.target.value })
                  }
                  placeholder="e.g., 2nd Floor"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Room</label>
                <Input
                  value={newDefect.room}
                  onChange={(e) =>
                    setNewDefect({ ...newDefect, room: e.target.value })
                  }
                  placeholder="e.g., Room 201"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newDefect.priority}
                  onValueChange={(v) =>
                    setNewDefect({ ...newDefect, priority: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newDefect.dueDate}
                  onChange={(e) =>
                    setNewDefect({ ...newDefect, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Responsible Party</label>
                <Input
                  value={newDefect.responsibleParty}
                  onChange={(e) =>
                    setNewDefect({
                      ...newDefect,
                      responsibleParty: e.target.value,
                    })
                  }
                  placeholder="e.g., ABC Contractors"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDefect} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Defect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
