"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  Send,
  Code,
  Type,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "notification" | "alert" | "report" | "marketing" | "transactional";
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

const VARIABLE_OPTIONS = [
  "{{userName}}",
  "{{userEmail}}",
  "{{organizationName}}",
  "{{projectName}}",
  "{{taskName}}",
  "{{dueDate}}",
  "{{amount}}",
  "{{link}}",
  "{{date}}",
  "{{time}}"
];

export function EmailTemplatesClient() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    category: "notification" as "notification" | "alert" | "report" | "marketing" | "transactional",
    isActive: true
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/email-templates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      } else {
        toast.error("Failed to fetch templates");
      }
    } catch (error) {
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchTemplates();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleCreate = async () => {
    if (!formData.name || !formData.subject) {
      toast.error("Please fill in name and subject");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Template created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", subject: "", body: "", category: "notification", isActive: true });
        fetchTemplates();
      } else {
        toast.error("Failed to create template");
      }
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Template updated successfully");
        setShowEditModal(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        toast.error("Failed to update template");
      }
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete ${template.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}/duplicate`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("Template duplicated successfully");
        fetchTemplates();
      } else {
        toast.error("Failed to duplicate template");
      }
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + variable
    }));
  };

  const openEditModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
      isActive: template.isActive
    });
    setShowEditModal(true);
  };

  const openPreviewModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      notification: "bg-blue-100 text-blue-800",
      alert: "bg-red-100 text-red-800",
      report: "bg-green-100 text-green-800",
      marketing: "bg-purple-100 text-purple-800",
      transactional: "bg-yellow-100 text-yellow-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
            Email Templates
          </h1>
          <p className="text-gray-500 mt-1">Manage email templates with variable substitution</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Templates</p>
                <p className="text-2xl font-bold mt-1">{templates.length}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold mt-1">
                  {templates.filter(t => t.isActive).length}
                </p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold mt-1">
                  {new Set(templates.map(t => t.category)).size}
                </p>
              </div>
              <Type className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Uses</p>
                <p className="text-2xl font-bold mt-1">
                  {templates.reduce((acc, t) => acc + t.usageCount, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isActive && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Active
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${getCategoryColor(template.category)} mt-2`}>
                      {template.category}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openPreviewModal(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(template)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Subject</p>
                    <p className="text-sm font-medium line-clamp-1">{template.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Body Preview</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Code className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {template.variables.length} variables
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Used {template.usageCount} times
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No email templates found</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4">
            Create First Template
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {[
        { open: showCreateModal, setOpen: setShowCreateModal, title: "Create Template", action: handleCreate },
        { open: showEditModal, setOpen: setShowEditModal, title: "Edit Template", action: handleUpdate }
      ].map(({ open, setOpen, title, action }, idx) => (
        <Dialog key={idx} open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {idx === 0 ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Welcome Email"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Welcome to {{organizationName}}"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Email Body</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Code className="h-4 w-4 mr-2" />
                        Insert Variable
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {VARIABLE_OPTIONS.map((variable) => (
                        <DropdownMenuItem
                          key={variable}
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Hi {{userName}}, welcome to our platform..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables like {"{{"} userName {"}"} for dynamic content
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`isActive-${idx}`}
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor={`isActive-${idx}`}>Active template</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={action} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : idx === 0 ? <Plus className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {idx === 0 ? "Create" : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs text-gray-500">Template Name</Label>
                <p className="font-medium mt-1">{selectedTemplate.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Category</Label>
                <div className="mt-1">
                  <Badge className={getCategoryColor(selectedTemplate.category)}>
                    {selectedTemplate.category}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Subject</Label>
                <p className="font-medium mt-1">{selectedTemplate.subject}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Body</Label>
                <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <p className="whitespace-pre-wrap text-sm">{selectedTemplate.body}</p>
                </div>
              </div>
              {selectedTemplate.variables.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        <Code className="h-3 w-3 mr-1" />
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setShowPreviewModal(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
