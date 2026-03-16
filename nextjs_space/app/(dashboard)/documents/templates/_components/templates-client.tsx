"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FileSignature,
  Copy,
  Trash2,
  Edit,
  Loader2,
  LayoutGrid,
  List,
  Star,
  Tag,
  MoreHorizontal,
  Eye,
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  isActive: boolean;
  isSystemTemplate: boolean;
  usageCount: number;
  tags: string[];
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
}

interface TemplatesClientProps {
  templates: DocumentTemplate[];
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  METHOD_STATEMENT: {
    label: "Method Statement",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  RISK_ASSESSMENT: {
    label: "Risk Assessment",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  COSHH_ASSESSMENT: {
    label: "COSHH Assessment",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  PERMIT_TO_WORK: {
    label: "Permit to Work",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  TOOLBOX_TALK: {
    label: "Toolbox Talk",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  INSPECTION_FORM: {
    label: "Inspection Form",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  SAFETY_BRIEFING: {
    label: "Safety Briefing",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  SITE_INDUCTION: {
    label: "Site Induction",
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  PROGRESS_REPORT: {
    label: "Progress Report",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  MEETING_AGENDA: {
    label: "Meeting Agenda",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  },
  CONTRACT_DOCUMENT: {
    label: "Contract Document",
    color:
      "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  },
  DELIVERY_RECEIPT: {
    label: "Delivery Receipt",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  QUALITY_CHECKLIST: {
    label: "Quality Checklist",
    color: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  },
  HANDOVER_DOCUMENT: {
    label: "Handover Document",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  SNAG_LIST: {
    label: "Snag List",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
  EMAIL_TEMPLATE: {
    label: "Email Template",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
  OTHER: {
    label: "Other",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

const CATEGORIES = Object.entries(categoryConfig).map(([value, { label }]) => ({
  value,
  label,
}));

export function TemplatesClient({
  templates: initialTemplates,
}: TemplatesClientProps) {
  const router = useRouter();
  const [templates, setTemplates] =
    useState<DocumentTemplate[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<DocumentTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "OTHER",
    version: "1.0",
    tags: "",
  });

  const filtered = templates.filter((t) => {
    const matchSearch =
      search === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const systemTemplates = filtered.filter((t) => t.isSystemTemplate);
  const customTemplates = filtered.filter((t) => !t.isSystemTemplate);

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          content: { sections: [], fields: [] },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setTemplates((prev) => [created, ...prev]);
      setCreateOpen(false);
      setForm({
        name: "",
        description: "",
        category: "OTHER",
        version: "1.0",
        tags: "",
      });
      toast.success("Template created successfully");
      router.refresh();
    } catch {
      toast.error("Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDuplicate(template: DocumentTemplate) {
    try {
      const res = await fetch(
        `/api/document-templates/${template.id}/duplicate`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      const duplicated = await res.json();
      setTemplates((prev) => [duplicated, ...prev]);
      toast.success("Template duplicated");
      router.refresh();
    } catch {
      toast.error("Failed to duplicate template");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/document-templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  }

  function TemplateCard({ template }: { template: DocumentTemplate }) {
    const cat = categoryConfig[template.category] ?? categoryConfig.OTHER;
    return (
      <Card className="group relative hover:shadow-md transition-shadow border border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                <FileSignature className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  v{template.version}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                </DropdownMenuItem>
                {!template.isSystemTemplate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {template.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {template.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mt-3">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}
            >
              {cat.label}
            </span>
            {template.isSystemTemplate && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium flex items-center gap-1">
                <Star className="h-3 w-3" /> System
              </span>
            )}
          </div>

          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1"
                >
                  <Tag className="h-2.5 w-2.5" /> {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Used {template.usageCount}×
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => setPreviewTemplate(template)}
            >
              Use Template
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function TemplateRow({ template }: { template: DocumentTemplate }) {
    const cat = categoryConfig[template.category] ?? categoryConfig.OTHER;
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors group">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <FileSignature className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{template.name}</p>
          {template.description && (
            <p className="text-xs text-muted-foreground truncate">
              {template.description}
            </p>
          )}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block ${cat.color}`}
        >
          {cat.label}
        </span>
        <span className="text-xs text-muted-foreground hidden md:block">
          v{template.version}
        </span>
        <span className="text-xs text-muted-foreground hidden lg:block">
          {template.usageCount} uses
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPreviewTemplate(template)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleDuplicate(template)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {!template.isSystemTemplate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => handleDelete(template.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Document Templates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {templates.length} template{templates.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Name *</Label>
                <Input
                  id="t-name"
                  placeholder="e.g. Weekly Progress Report"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-desc">Description</Label>
                <Textarea
                  id="t-desc"
                  placeholder="Brief description of this template..."
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-version">Version</Label>
                  <Input
                    id="t-version"
                    placeholder="1.0"
                    value={form.version}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, version: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-tags">Tags (comma-separated)</Label>
                <Input
                  id="t-tags"
                  placeholder="e.g. safety, weekly, report"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Templates",
            value: templates.length,
            icon: FileSignature,
            color: "text-indigo-600",
          },
          {
            label: "System Templates",
            value: templates.filter((t) => t.isSystemTemplate).length,
            icon: Star,
            color: "text-amber-600",
          },
          {
            label: "Custom Templates",
            value: templates.filter((t) => !t.isSystemTemplate).length,
            icon: Edit,
            color: "text-blue-600",
          },
          {
            label: "Total Uses",
            value: templates.reduce((a, t) => a + t.usageCount, 0),
            icon: Copy,
            color: "text-green-600",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates */}
      {filtered.length === 0 ? (
        <Card className="border border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileSignature className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">
              No templates found
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first template to get started"}
            </p>
            {!search && categoryFilter === "all" && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {systemTemplates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> System Templates
              </h2>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {systemTemplates.map((t) => (
                    <TemplateCard key={t.id} template={t} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {systemTemplates.map((t) => (
                    <TemplateRow key={t.id} template={t} />
                  ))}
                </div>
              )}
            </div>
          )}

          {customTemplates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-indigo-500" /> Custom
                Templates
              </h2>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {customTemplates.map((t) => (
                    <TemplateCard key={t.id} template={t} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {customTemplates.map((t) => (
                    <TemplateRow key={t.id} template={t} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-indigo-600" />
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {categoryConfig[previewTemplate.category]?.label ??
                    previewTemplate.category}
                </Badge>
                <Badge variant="outline">v{previewTemplate.version}</Badge>
                {previewTemplate.isSystemTemplate && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    System Template
                  </Badge>
                )}
              </div>
              {previewTemplate.description && (
                <p className="text-sm text-muted-foreground">
                  {previewTemplate.description}
                </p>
              )}
              {previewTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {previewTemplate.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t pt-3 flex justify-between">
                <span>Used {previewTemplate.usageCount} times</span>
                {previewTemplate.createdBy && (
                  <span>By {previewTemplate.createdBy.name}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                handleDuplicate(previewTemplate!);
                setPreviewTemplate(null);
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
