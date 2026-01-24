"use client";

import { useState } from "react";
import {
  BookOpen, Plus, Search, Calendar, Cloud, Sun, CloudRain,
  Users, Truck, Wrench, Loader2, Eye, Edit, Clock, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const WEATHER_OPTIONS = ["Sunny", "Cloudy", "Partly Cloudy", "Rainy", "Stormy", "Snowy", "Windy", "Foggy"];

const getWeatherIcon = (weather: string | null) => {
  if (!weather) return <Cloud className="h-4 w-4" />;
  if (weather.toLowerCase().includes("sun")) return <Sun className="h-4 w-4 text-yellow-500" />;
  if (weather.toLowerCase().includes("rain") || weather.toLowerCase().includes("storm")) return <CloudRain className="h-4 w-4 text-blue-500" />;
  return <Cloud className="h-4 w-4 text-gray-500" />;
};

interface SiteDiaryClientProps {
  diaries: any[];
  projects: any[];
}

export function SiteDiaryClient({ diaries: initialDiaries, projects }: SiteDiaryClientProps) {
  const [diaries, setDiaries] = useState(initialDiaries);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDiary, setNewDiary] = useState({
    projectId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    weatherMorning: "",
    weatherAfternoon: "",
    tempMorning: "",
    tempAfternoon: "",
    workAreas: "",
    workProgress: "",
    labourCount: "",
    subcontractors: "",
    equipmentOnSite: "",
    delays: "",
    healthSafety: "",
    qualityIssues: "",
    clientInstructions: "",
    generalNotes: "",
  });

  const filteredDiaries = diaries.filter((diary) => {
    const matchesSearch = diary.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
      diary.workProgress?.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === "all" || diary.projectId === projectFilter;
    return matchesSearch && matchesProject;
  });

  const handleCreateDiary = async () => {
    if (!newDiary.projectId || !newDiary.date) {
      toast.error("Please select a project and date");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/site-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDiary),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create diary entry");
      }
      const diary = await res.json();
      setDiaries([diary, ...diaries]);
      setShowNewModal(false);
      setNewDiary({
        projectId: "", date: format(new Date(), "yyyy-MM-dd"),
        weatherMorning: "", weatherAfternoon: "", tempMorning: "", tempAfternoon: "",
        workAreas: "", workProgress: "", labourCount: "", subcontractors: "",
        equipmentOnSite: "", delays: "", healthSafety: "", qualityIssues: "",
        clientInstructions: "", generalNotes: "",
      });
      toast.success("Site diary entry created");
    } catch (error: any) {
      toast.error(error.message || "Failed to create diary entry");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: diaries.length,
    thisWeek: diaries.filter(d => {
      const date = new Date(d.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }).length,
    withDelays: diaries.filter(d => d.delays).length,
    avgLabour: diaries.length > 0 
      ? Math.round(diaries.reduce((sum, d) => sum + (d.labourCount || 0), 0) / diaries.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-green-600">{stats.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Delays</p>
                <p className="text-2xl font-bold text-orange-600">{stats.withDelays}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Labour</p>
                <p className="text-2xl font-bold">{stats.avgLabour}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
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
              placeholder="Search entries..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Entry
        </Button>
      </div>

      {/* Diary Entries List */}
      <div className="space-y-4">
        {filteredDiaries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No diary entries found</p>
              <Button onClick={() => setShowNewModal(true)} variant="outline" className="mt-4">
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredDiaries.map((diary) => (
            <Card key={diary.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
                          {format(new Date(diary.date), "EEEE, MMMM d, yyyy")}
                        </h3>
                        <p className="text-sm text-muted-foreground">{diary.project?.name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        {getWeatherIcon(diary.weatherMorning)}
                        <span className="text-muted-foreground">AM:</span>
                        <span>{diary.weatherMorning || "-"}</span>
                        {diary.tempMorning && <span>({diary.tempMorning}°C)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getWeatherIcon(diary.weatherAfternoon)}
                        <span className="text-muted-foreground">PM:</span>
                        <span>{diary.weatherAfternoon || "-"}</span>
                        {diary.tempAfternoon && <span>({diary.tempAfternoon}°C)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="text-muted-foreground">Labour:</span>
                        <span className="font-medium">{diary.labourCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-muted-foreground">Entries:</span>
                        <span>{diary.entries?.length || 0}</span>
                      </div>
                    </div>

                    {diary.workProgress && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Work Progress</p>
                        <p className="text-sm line-clamp-2">{diary.workProgress}</p>
                      </div>
                    )}

                    {diary.delays && (
                      <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Delays Noted</p>
                          <p className="text-sm text-orange-600 dark:text-orange-300 line-clamp-1">{diary.delays}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Diary Entry Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Site Diary Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <Select value={newDiary.projectId} onValueChange={(v) => setNewDiary({ ...newDiary, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={newDiary.date}
                  onChange={(e) => setNewDiary({ ...newDiary, date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4" /> Weather
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Morning</label>
                  <Select value={newDiary.weatherMorning} onValueChange={(v) => setNewDiary({ ...newDiary, weatherMorning: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map(w => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Temp (°C)</label>
                  <Input
                    type="number"
                    value={newDiary.tempMorning}
                    onChange={(e) => setNewDiary({ ...newDiary, tempMorning: e.target.value })}
                    placeholder="e.g., 18"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Afternoon</label>
                  <Select value={newDiary.weatherAfternoon} onValueChange={(v) => setNewDiary({ ...newDiary, weatherAfternoon: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map(w => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Temp (°C)</label>
                  <Input
                    type="number"
                    value={newDiary.tempAfternoon}
                    onChange={(e) => setNewDiary({ ...newDiary, tempAfternoon: e.target.value })}
                    placeholder="e.g., 22"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Work Summary
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Work Areas</label>
                  <Input
                    value={newDiary.workAreas}
                    onChange={(e) => setNewDiary({ ...newDiary, workAreas: e.target.value })}
                    placeholder="Areas worked on today"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Progress Description</label>
                  <Textarea
                    value={newDiary.workProgress}
                    onChange={(e) => setNewDiary({ ...newDiary, workProgress: e.target.value })}
                    placeholder="Describe work completed..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> Resources
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Labour Count</label>
                  <Input
                    type="number"
                    value={newDiary.labourCount}
                    onChange={(e) => setNewDiary({ ...newDiary, labourCount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Subcontractors on Site</label>
                  <Input
                    value={newDiary.subcontractors}
                    onChange={(e) => setNewDiary({ ...newDiary, subcontractors: e.target.value })}
                    placeholder="e.g., ABC Electric, XYZ Plumbing"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Equipment Used</label>
                  <Input
                    value={newDiary.equipmentOnSite}
                    onChange={(e) => setNewDiary({ ...newDiary, equipmentOnSite: e.target.value })}
                    placeholder="e.g., Crane, Excavator"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Issues & Notes
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Delays</label>
                  <Textarea
                    value={newDiary.delays}
                    onChange={(e) => setNewDiary({ ...newDiary, delays: e.target.value })}
                    placeholder="Any delays encountered..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Health & Safety</label>
                  <Textarea
                    value={newDiary.healthSafety}
                    onChange={(e) => setNewDiary({ ...newDiary, healthSafety: e.target.value })}
                    placeholder="H&S observations..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-sm text-muted-foreground">General Notes</label>
                <Textarea
                  value={newDiary.generalNotes}
                  onChange={(e) => setNewDiary({ ...newDiary, generalNotes: e.target.value })}
                  placeholder="Any other notes..."
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreateDiary} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
