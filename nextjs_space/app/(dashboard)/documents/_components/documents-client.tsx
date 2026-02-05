"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Download, Eye, File, FileSignature, FileSpreadsheet, FileText, FolderOpen, HardDrive, Image, LayoutGrid, List, Loader2, Ruler, ScrollText, Search, Trash2, Upload } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { DocumentViewer } from "@/components/ui/document-viewer";

interface Document {
  id: string;
  name: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  project?: {
    id: string;
    name: string;
  };
  uploadedBy?: {
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

interface DocumentsClientProps {
  documents: Document[];
  projects: Project[];
}

const typeConfig = {
  PLANS: { label: "Plans", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: FileText },
  DRAWINGS: { label: "Drawings", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: Ruler },
  PERMITS: { label: "Permits", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: FileSignature },
  PHOTOS: { label: "Photos", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: Image },
  REPORTS: { label: "Reports", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", icon: FileSpreadsheet },
  SPECIFICATIONS: { label: "Specs", bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", icon: ScrollText },
  CONTRACTS: { label: "Contracts", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: File },
  OTHER: { label: "Other", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-400", icon: FileText }
};

export function DocumentsClient({ documents, projects }: DocumentsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadForm, setUploadForm] = useState({ projectId: "", documentType: "OTHER" });

  const handleDocumentEvent = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription(['document_uploaded'], handleDocumentEvent, []);

  const filteredDocs = (documents ?? [])?.filter((doc: any) => {
    const matchesSearch = (doc?.name ?? "")?.toLowerCase()?.includes(search?.toLowerCase() ?? "");
    const matchesType = typeFilter === "all" || doc?.documentType === typeFilter;
    const matchesProject = projectFilter === "all" || doc?.projectId === projectFilter;
    return matchesSearch && matchesType && matchesProject;
  });

  // Calculate stats
  const stats = {
    total: documents?.length ?? 0,
    totalSize: documents?.reduce((sum, d) => sum + (d?.fileSize || 0), 0) ?? 0,
    byType: Object.keys(typeConfig).reduce((acc, type) => {
      acc[type] = documents?.filter(d => d?.documentType === type)?.length ?? 0;
      return acc;
    }, {} as Record<string, number>)
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setViewerOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    if (!uploadForm.projectId) {
      toast.error("Please select a project");
      return;
    }

    setLoading(true);
    try {
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          isPublic: false
        })
      });

      if (!presignRes.ok) {
        toast.error("Failed to get upload URL");
        return;
      }

      const { uploadUrl, cloud_storage_path } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type }
      });

      if (!uploadRes.ok) {
        toast.error("Failed to upload file");
        return;
      }

      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedFile.name,
          cloudStoragePath: cloud_storage_path,
          isPublic: false,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          projectId: uploadForm.projectId,
          documentType: uploadForm.documentType
        })
      });

      if (docRes.ok) {
        toast.success("Document uploaded successfully!");
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadForm({ projectId: "", documentType: "OTHER" });
        router.refresh();
      } else {
        toast.error("Failed to save document record");
      }
    } catch {
      console.error(e);
      toast.error("An error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const res = await fetch(`/api/documents/${doc?.id ?? ""}/download`);
      if (res.ok) {
        const { url } = await res.json();
        const link = document.createElement("a");
        link.href = url;
        link.download = doc?.name ?? "document";
        link.click();
      } else {
        toast.error("Failed to get download URL");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete document");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Documents</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage project documents, plans, and photos</p>
        </div>
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
              <Upload className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project *</label>
                <Select value={uploadForm.projectId} onValueChange={(v) => setUploadForm({ ...uploadForm, projectId: v })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {(projects ?? [])?.map((p: any) => (
                      <SelectItem key={p?.id ?? Math.random()} value={p?.id ?? ""}>{p?.name ?? "Unknown"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Document Type</label>
                <Select value={uploadForm.documentType} onValueChange={(v) => setUploadForm({ ...uploadForm, documentType: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">File *</label>
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {selectedFile ? (
                    <div>
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-7 w-7 text-primary" />
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Click to select a file</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Max 100MB</p>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleUpload} disabled={loading} className="w-full h-11 bg-gradient-to-r from-primary to-purple-600">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                <FolderOpen className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50">
                <Ruler className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.byType.DRAWINGS + stats.byType.PLANS}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Plans & Drawings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/50">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.byType.PHOTOS}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {(projects ?? [])?.map((p: any) => (
                    <SelectItem key={p?.id ?? Math.random()} value={p?.id ?? ""}>{p?.name ?? "Unknown"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {filteredDocs?.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No documents found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Upload your first document to get started</p>
            <Button onClick={() => setShowUploadModal(true)} >
              <Upload className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs?.map((doc: any) => {
            const config = typeConfig[doc?.documentType as keyof typeof typeConfig] ?? typeConfig.OTHER;
            const Icon = config.icon;

            return (
              <Card key={doc?.id} className="border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors" title={doc?.name ?? ""}>
                        {doc?.name ?? "Untitled"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc?.project?.name ?? "No project"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`${config.bg} ${config.text} border-0 text-xs`}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(doc?.fileSize ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} className="flex-1">
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(doc?.id ?? "")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs?.map((doc: any) => {
            const config = typeConfig[doc?.documentType as keyof typeof typeConfig] ?? typeConfig.OTHER;
            const Icon = config.icon;

            return (
              <Card key={doc?.id} className="border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {doc?.name ?? "Untitled"}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <span>{doc?.project?.name ?? "No project"}</span>
                          <Badge className={`${config.bg} ${config.text} border-0 text-xs`}>
                            {config.label}
                          </Badge>
                          <span>{formatFileSize(doc?.fileSize ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(doc?.id ?? "")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </div>
  );
}
