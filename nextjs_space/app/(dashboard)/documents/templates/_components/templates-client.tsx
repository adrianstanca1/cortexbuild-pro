'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  FileText, Plus, Search, Copy, Edit, Trash2, Download, Filter, Upload,
  Loader2, LayoutGrid, List, Eye, FileSignature, Shield, ClipboardList,
  HardHat, CheckSquare, Settings, Sparkles, Lock, Globe, ChevronRight,
  Package, AlertTriangle, Calendar, Wrench, X, ChevronDown, ChevronUp,
  File, FileUp, Check, Info, Tag, FolderOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  fields: TemplateField[];
}

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  columns?: string[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  content: { title?: string; version?: string; sections?: TemplateSection[] } | null;
  tags: string[];
  usageCount: number;
  isSystemTemplate: boolean;
  isActive: boolean;
  thumbnailUrl?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

interface DocumentTemplatesClientProps {
  templates: Template[];
  stats: { total: number; system: number; custom: number; byCategory: Record<string, number> };
  userRole: string;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  METHOD_STATEMENT: { label: 'Method Statement', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  RISK_ASSESSMENT: { label: 'Risk Assessment', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  TOOLBOX_TALK: { label: 'Toolbox Talk', icon: HardHat, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  SITE_INDUCTION: { label: 'Site Induction', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  PERMIT_TO_WORK: { label: 'Permit to Work', icon: FileSignature, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  INSPECTION_FORM: { label: 'Inspection Form', icon: ClipboardList, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  DAILY_REPORT: { label: 'Daily Report', icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  MAINTENANCE: { label: 'Maintenance', icon: Wrench, color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  OTHER: { label: 'Other', icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' }
};

const fieldTypeLabels: Record<string, string> = {
  text: 'Text Input',
  textarea: 'Multi-line Text',
  number: 'Number',
  date: 'Date',
  datetime: 'Date & Time',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  checklist: 'Checklist',
  signature: 'Signature',
  table: 'Table',
  attendance_list: 'Attendance List',
  inspection_checklist: 'Inspection Checklist',
  file: 'File Upload'
};

export function DocumentTemplatesClient({ templates, stats, userRole }: DocumentTemplatesClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '', description: '', category: 'OTHER', tags: '', version: '1.0',
    sections: [] as TemplateSection[]
  });
  const [editTemplate, setEditTemplate] = useState<{
    id: string; name: string; description: string; category: string; tags: string; version: string;
    sections: TemplateSection[];
  } | null>(null);

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'COMPANY_OWNER';

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSource = sourceFilter === 'all' ||
      (sourceFilter === 'system' && t.isSystemTemplate) ||
      (sourceFilter === 'custom' && !t.isSystemTemplate);
    return matchesSearch && matchesCategory && matchesSource;
  });

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setExpandedSections({});
    setShowPreviewModal(true);
  };

  const handleEdit = (template: Template) => {
    if (template.isSystemTemplate && !isAdmin) {
      toast.error('Cannot edit system templates');
      return;
    }
    setEditTemplate({
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category,
      tags: template.tags.join(', '),
      version: template.version,
      sections: template.content?.sections || []
    });
    setShowEditModal(true);
  };

  const handleDuplicate = async (template: Template) => {
    setLoading(true);
    try {
      const res = await fetch('/api/document-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          content: template.content,
          tags: template.tags,
          version: template.version
        })
      });

      if (res.ok) {
        toast.success('Template duplicated successfully');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to duplicate template');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (template.isSystemTemplate && !isAdmin) {
      toast.error('Cannot delete system templates');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/document-templates/${template.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Template deleted successfully');
        router.refresh();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.name) {
      toast.error('Template name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/document-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category,
          tags: newTemplate.tags.split(',').map(t => t.trim()).filter(Boolean),
          version: newTemplate.version || '1.0',
          content: {
            title: newTemplate.name,
            version: newTemplate.version || '1.0',
            sections: newTemplate.sections.length > 0 ? newTemplate.sections : [
              { id: 'main', title: 'Main Section', fields: [] }
            ]
          }
        })
      });

      if (res.ok) {
        toast.success('Template created successfully');
        setShowNewModal(false);
        setNewTemplate({ name: '', description: '', category: 'OTHER', tags: '', version: '1.0', sections: [] });
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create template');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTemplate) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/document-templates/${editTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTemplate.name,
          description: editTemplate.description,
          category: editTemplate.category,
          tags: editTemplate.tags.split(',').map(t => t.trim()).filter(Boolean),
          version: editTemplate.version,
          content: {
            title: editTemplate.name,
            version: editTemplate.version,
            sections: editTemplate.sections
          }
        })
      });

      if (res.ok) {
        toast.success('Template updated successfully');
        setShowEditModal(false);
        setEditTemplate(null);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update template');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', newTemplate.category || 'OTHER');
      formData.append('tags', newTemplate.tags);

      const res = await fetch('/api/document-templates/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Template "${data.template.name}" created from uploaded file`);
        setShowUploadModal(false);
        setUploadFile(null);
        setNewTemplate({ name: '', description: '', category: 'OTHER', tags: '', version: '1.0', sections: [] });
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to upload template');
      }
    } catch (error) {
      toast.error('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSeedSystem = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/document-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedSystemTemplates: true })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.created} system templates loaded`);
        router.refresh();
      } else {
        toast.error('Failed to load system templates');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const addSection = (setter: Function, currentSections: TemplateSection[]) => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      fields: []
    };
    setter([...currentSections, newSection]);
  };

  const removeSection = (setter: Function, currentSections: TemplateSection[], sectionId: string) => {
    setter(currentSections.filter(s => s.id !== sectionId));
  };

  const updateSection = (setter: Function, currentSections: TemplateSection[], sectionId: string, updates: Partial<TemplateSection>) => {
    setter(currentSections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const addField = (setter: Function, currentSections: TemplateSection[], sectionId: string) => {
    const newField: TemplateField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false
    };
    setter(currentSections.map(s =>
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    ));
  };

  const removeField = (setter: Function, currentSections: TemplateSection[], sectionId: string, fieldName: string) => {
    setter(currentSections.map(s =>
      s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.name !== fieldName) } : s
    ));
  };

  const updateField = (setter: Function, currentSections: TemplateSection[], sectionId: string, fieldName: string, updates: Partial<TemplateField>) => {
    setter(currentSections.map(s =>
      s.id === sectionId ? {
        ...s,
        fields: s.fields.map(f => f.name === fieldName ? { ...f, ...updates } : f)
      } : s
    ));
  };

  const renderSectionEditor = (sections: TemplateSection[], setter: Function) => (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <Card key={section.id} className="border-slate-200 dark:border-slate-700">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <Input
                value={section.title}
                onChange={e => updateSection(setter, sections, section.id, { title: e.target.value })}
                className="font-medium w-64"
                placeholder="Section Title"
              />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => addField(setter, sections, section.id)}>
                  <Plus className="h-4 w-4 mr-1" /> Field
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeSection(setter, sections, section.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            {section.fields.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No fields yet. Click "+ Field" to add.</p>
            ) : (
              <div className="space-y-2">
                {section.fields.map((field, fIdx) => (
                  <div key={field.name} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Input
                      value={field.label}
                      onChange={e => updateField(setter, sections, section.id, field.name, { label: e.target.value })}
                      className="flex-1"
                      placeholder="Field Label"
                    />
                    <Select
                      value={field.type}
                      onValueChange={v => updateField(setter, sections, section.id, field.name, { type: v })}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(fieldTypeLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-1 text-sm">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={v => updateField(setter, sections, section.id, field.name, { required: !!v })}
                      />
                      Required
                    </label>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeField(setter, sections, section.id, field.name)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" className="w-full" onClick={() => addSection(setter, sections)}>
        <Plus className="h-4 w-4 mr-2" /> Add Section
      </Button>
    </div>
  );

  const renderTemplateCard = (template: Template) => {
    const config = categoryConfig[template.category] || categoryConfig.OTHER;
    const Icon = config.icon;

    return (
      <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="flex items-center gap-1">
              {template.isSystemTemplate ? (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                  <Lock className="h-3 w-3 mr-1" /> System
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  <Globe className="h-3 w-3 mr-1" /> Custom
                </Badge>
              )}
            </div>
          </div>

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-3 line-clamp-1">
            {template.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {template.description || 'No description'}
          </p>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
            <span>v{template.version}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {template.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                <Tag className="h-3 w-3 mr-1" />{tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{template.tags.length - 3}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {template.content?.sections?.length || 0} sections
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Used {template.usageCount}x
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handlePreview(template)} title="Preview">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleDuplicate(template)} title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              {(!template.isSystemTemplate || isAdmin) && (
                <>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleEdit(template)} title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500" onClick={() => handleDelete(template)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Document Templates
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Pre-built UK construction templates for method statements, risk assessments, permits & more
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && stats.system === 0 && (
            <Button variant="outline" onClick={handleSeedSystem} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Load System Templates
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Templates</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">System Templates</p>
                <p className="text-2xl font-bold text-amber-600">{stats.system}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Custom Templates</p>
                <p className="text-2xl font-bold text-green-600">{stats.custom}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.byCategory).length}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <FolderOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates by name, description, or tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">No templates found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center max-w-sm">
              {search || categoryFilter !== 'all' || sourceFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first template or load system templates to get started'}
            </p>
            {!search && categoryFilter === 'all' && sourceFilter === 'all' && (
              <div className="flex gap-2 mt-4">
                {isAdmin && stats.system === 0 && (
                  <Button variant="outline" onClick={handleSeedSystem} disabled={loading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Load System Templates
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button onClick={() => setShowNewModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-3'
        }>
          {filteredTemplates.map(template => (
            viewMode === 'grid' ? renderTemplateCard(template) : (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${categoryConfig[template.category]?.bgColor || 'bg-gray-100'}`}>
                    {(() => {
                      const Icon = categoryConfig[template.category]?.icon || Package;
                      return <Icon className={`h-5 w-5 ${categoryConfig[template.category]?.color || 'text-gray-600'}`} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{template.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{template.description}</p>
                  </div>
                  <Badge variant={template.isSystemTemplate ? 'secondary' : 'outline'}>
                    {template.isSystemTemplate ? 'System' : 'Custom'}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {template.content?.sections?.length || 0} sections
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Used {template.usageCount}x</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {(!template.isSystemTemplate || isAdmin) && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(template)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                uploadFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary'
              }`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) setUploadFile(file);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.json"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setUploadFile(file);
                }}
              />
              {uploadFile ? (
                <div className="flex flex-col items-center gap-2">
                  <Check className="h-10 w-10 text-green-500" />
                  <p className="font-medium text-slate-900 dark:text-white">{uploadFile.name}</p>
                  <p className="text-sm text-slate-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  <Button variant="outline" size="sm" onClick={() => setUploadFile(null)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="h-10 w-10 text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-300">Drag and drop or click to upload</p>
                  <p className="text-sm text-slate-500">PDF, Word, TXT, or JSON files</p>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Uploaded documents will be analyzed to extract template structure. You can edit the result after upload.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <Select value={newTemplate.category} onValueChange={v => setNewTemplate({ ...newTemplate, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
              <Input
                value={newTemplate.tags}
                onChange={e => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                placeholder="e.g., safety, compliance, HSE"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>Cancel</Button>
            <Button onClick={handleFileUpload} disabled={!uploadFile || uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload & Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Template Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Template Name *</label>
                <Input
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Site Safety Inspection Form"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Version</label>
                <Input
                  value={newTemplate.version}
                  onChange={e => setNewTemplate({ ...newTemplate, version: e.target.value })}
                  placeholder="1.0"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Textarea
                value={newTemplate.description}
                onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Brief description of the template"
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <Select value={newTemplate.category} onValueChange={v => setNewTemplate({ ...newTemplate, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
                <Input
                  value={newTemplate.tags}
                  onChange={e => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                  placeholder="e.g., safety, compliance, HSE"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Form Sections & Fields</label>
              {renderSectionEditor(
                newTemplate.sections,
                (sections: TemplateSection[]) => setNewTemplate({ ...newTemplate, sections })
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Template
            </DialogTitle>
          </DialogHeader>
          {editTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Template Name *</label>
                  <Input
                    value={editTemplate.name}
                    onChange={e => setEditTemplate({ ...editTemplate, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Version</label>
                  <Input
                    value={editTemplate.version}
                    onChange={e => setEditTemplate({ ...editTemplate, version: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <Textarea
                  value={editTemplate.description}
                  onChange={e => setEditTemplate({ ...editTemplate, description: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                  <Select value={editTemplate.category} onValueChange={v => setEditTemplate({ ...editTemplate, category: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
                  <Input
                    value={editTemplate.tags}
                    onChange={e => setEditTemplate({ ...editTemplate, tags: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Form Sections & Fields</label>
                {renderSectionEditor(
                  editTemplate.sections,
                  (sections: TemplateSection[]) => setEditTemplate({ ...editTemplate, sections })
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (() => {
                const Icon = categoryConfig[selectedTemplate.category]?.icon || Package;
                return <Icon className={`h-5 w-5 ${categoryConfig[selectedTemplate.category]?.color || 'text-primary'}`} />;
              })()}
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedTemplate.isSystemTemplate ? 'secondary' : 'outline'}>
                  {selectedTemplate.isSystemTemplate ? 'System Template' : 'Custom Template'}
                </Badge>
                <Badge variant="outline">
                  {categoryConfig[selectedTemplate.category]?.label || selectedTemplate.category}
                </Badge>
                <Badge variant="outline">v{selectedTemplate.version}</Badge>
              </div>

              <p className="text-slate-600 dark:text-slate-400">{selectedTemplate.description}</p>

              {selectedTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {selectedTemplate.content?.sections && (
                <div className="space-y-3 mt-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Form Structure ({selectedTemplate.content.sections.length} sections)
                  </h4>
                  {selectedTemplate.content.sections.map((section: TemplateSection, i: number) => (
                    <Card key={i} className="border-slate-200 dark:border-slate-700">
                      <CardHeader
                        className="py-3 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => toggleSection(section.id || `section_${i}`)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {section.title}
                            <Badge variant="outline" className="text-xs font-normal">
                              {section.fields?.length || 0} fields
                            </Badge>
                          </CardTitle>
                          {expandedSections[section.id || `section_${i}`] ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections[section.id || `section_${i}`] && (
                        <CardContent className="py-3 px-4 border-t border-slate-100 dark:border-slate-800">
                          {section.fields && section.fields.length > 0 ? (
                            <div className="space-y-2">
                              {section.fields.map((field: TemplateField, j: number) => (
                                <div key={j} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 text-xs">*</span>}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {fieldTypeLabels[field.type] || field.type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No fields in this section</p>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400 space-x-4">
                  <span>Used {selectedTemplate.usageCount} times</span>
                  {selectedTemplate.createdBy && (
                    <span>Created by {selectedTemplate.createdBy.name}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { handleEdit(selectedTemplate); setShowPreviewModal(false); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={() => { handleDuplicate(selectedTemplate); setShowPreviewModal(false); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
