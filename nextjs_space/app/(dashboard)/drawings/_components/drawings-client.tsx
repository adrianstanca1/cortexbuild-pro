"use client";

import { useState } from "react";
import {
  FileImage, Plus, Search, _Filter, Grid, List, Loader2,
  Eye, Edit, Upload, History, CheckCircle, Clock, _XCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { _format } from "date-fns";

const DISCIPLINES = [
  "ARCHITECTURAL", "STRUCTURAL", "MECHANICAL", "ELECTRICAL", "PLUMBING",
  "CIVIL", "LANDSCAPE", "FIRE_PROTECTION", "INTERIOR", "SHOP_DRAWING", "AS_BUILT", "OTHER"
];

const STATUSES = ["DRAFT", "FOR_REVIEW", "APPROVED", "SUPERSEDED", "VOID"];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    FOR_REVIEW: "bg-yellow-500",
    APPROVED: "bg-green-500",
    SUPERSEDED: "bg-orange-500",
    VOID: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

const getDisciplineColor = (discipline: string) => {
  const colors: Record<string, string> = {
    ARCHITECTURAL: "bg-blue-100 text-blue-800",
    STRUCTURAL: "bg-purple-100 text-purple-800",
    MECHANICAL: "bg-orange-100 text-orange-800",
    ELECTRICAL: "bg-yellow-100 text-yellow-800",
    PLUMBING: "bg-cyan-100 text-cyan-800",
    CIVIL: "bg-green-100 text-green-800",
  };
  return colors[discipline] || "bg-gray-100 text-gray-800";
};

interface DrawingsClientProps {
  drawings: any[];
  projects: any[];
}

export function DrawingsClient({ drawings: initialDrawings, projects }: DrawingsClientProps) {
  const [drawings, setDrawings] = useState(initialDrawings);
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDrawing, setNewDrawing] = useState({
    projectId: "",
    number: "",
    title: "",
    description: "",
    discipline: "ARCHITECTURAL",
    scale: "",
    sheetSize: "",
  });

  const filteredDrawings = drawings.filter((drawing) => {
    const matchesSearch = drawing.title.toLowerCase().includes(search.toLowerCase()) ||
      drawing.number.toLowerCase().includes(search.toLowerCase());
    const matchesDiscipline = disciplineFilter === "all" || drawing.discipline === disciplineFilter;
    const matchesStatus = statusFilter === "all" || drawing.status === statusFilter;
    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const handleCreateDrawing = async () => {
    if (!newDrawing.projectId || !newDrawing.number || !newDrawing.title) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDrawing),
      });
      if (!res.ok) throw new Error("Failed to create drawing");
      const drawing = await res.json();
      setDrawings([drawing, ...drawings]);
      setShowNewModal(false);
      setNewDrawing({
        projectId: "", number: "", title: "", description: "",
        discipline: "ARCHITECTURAL", scale: "", sheetSize: "",
      });
      toast.success("Drawing created successfully");
    } catch (error) {
      toast.error("Failed to create drawing");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: drawings.length,
    approved: drawings.filter(d => d.status === "APPROVED").length,
    forReview: drawings.filter(d => d.status === "FOR_REVIEW").length,
    disciplines: [...new Set(drawings.map(d => d.discipline))].length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drawings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileImage className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">For Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.forReview}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disciplines</p>
                <p className="text-2xl font-bold">{stats.disciplines}</p>
              </div>
              <Grid className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drawings..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disciplines</SelectItem>
              {DISCIPLINES.map(d => (
                <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Drawing
          </Button>
        </div>
      </div>

      {/* Drawings List */}
      {filteredDrawings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drawings found</p>
            <Button onClick={() => setShowNewModal(true)} variant="outline" className="mt-4">
              Add First Drawing
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredDrawings.map((drawing) => (
            <Card key={drawing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <FileImage className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {drawing.number}
                        </span>
                        <h3 className="font-semibold" style={{ color: "#1a1a1a" }}>{drawing.title}</h3>
                        <Badge className={getStatusColor(drawing.status)}>{drawing.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{drawing.project?.name}</span>
                        <Badge variant="outline" className={getDisciplineColor(drawing.discipline)}>
                          {drawing.discipline.replace("_", " ")}
                        </Badge>
                        {drawing.scale && <span>Scale: {drawing.scale}</span>}
                        <span className="flex items-center gap-1">
                          <History className="h-3 w-3" /> Rev {drawing.currentRevision}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.location.href = `/drawings/${drawing.id}/view`}
                      title="View & Annotate"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Upload Revision"><Upload className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Edit Details"><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrawings.map((drawing) => (
            <Card 
              key={drawing.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/drawings/${drawing.id}/view`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getStatusColor(drawing.status)}>{drawing.status.replace("_", " ")}</Badge>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    Rev {drawing.currentRevision}
                  </span>
                </div>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                  <FileImage className="h-12 w-12 text-muted-foreground" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">{drawing.number}</span>
                <h3 className="font-semibold mt-1" style={{ color: "#1a1a1a" }}>{drawing.title}</h3>
                <Badge variant="outline" className={`mt-2 ${getDisciplineColor(drawing.discipline)}`}>
                  {drawing.discipline.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Drawing Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Drawing</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Project *</label>
              <Select value={newDrawing.projectId} onValueChange={(v) => setNewDrawing({ ...newDrawing, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Drawing Number *</label>
                <Input
                  value={newDrawing.number}
                  onChange={(e) => setNewDrawing({ ...newDrawing, number: e.target.value })}
                  placeholder="e.g., A-101"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Discipline</label>
                <Select value={newDrawing.discipline} onValueChange={(v) => setNewDrawing({ ...newDrawing, discipline: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map(d => (
                      <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={newDrawing.title}
                onChange={(e) => setNewDrawing({ ...newDrawing, title: e.target.value })}
                placeholder="e.g., Ground Floor Plan"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newDrawing.description}
                onChange={(e) => setNewDrawing({ ...newDrawing, description: e.target.value })}
                placeholder="Drawing description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Scale</label>
                <Input
                  value={newDrawing.scale}
                  onChange={(e) => setNewDrawing({ ...newDrawing, scale: e.target.value })}
                  placeholder="e.g., 1:100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sheet Size</label>
                <Select value={newDrawing.sheetSize} onValueChange={(v) => setNewDrawing({ ...newDrawing, sheetSize: v })}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A0">A0</SelectItem>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="24x36">24"x36"</SelectItem>
                    <SelectItem value="30x42">30"x42"</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreateDrawing} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Drawing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}