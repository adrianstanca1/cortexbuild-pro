'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Users,
  Wrench,
  Award,
  FolderOpen,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  HardHat,
  Loader2,
  CheckCircle2,
  FileWarning,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  location: string;
  clientName: string;
  status: string;
}

type DocumentType = 
  | 'method_statement'
  | 'risk_assessment'
  | 'site_induction'
  | 'permit_to_work'
  | 'toolbox_talk'
  | 'inspection_checklist'
  | 'completion_certificate'
  | 'handover_document';

const documentTypes: { id: DocumentType; name: string; icon: React.ElementType; description: string; color: string }[] = [
  { id: 'method_statement', name: 'Method Statement', icon: FileText, description: 'Step-by-step work procedures with safety controls', color: 'from-blue-500 to-blue-600' },
  { id: 'risk_assessment', name: 'Risk Assessment', icon: AlertTriangle, description: 'Comprehensive hazard identification and control measures', color: 'from-amber-500 to-orange-600' },
  { id: 'site_induction', name: 'Site Induction', icon: Users, description: 'Complete site safety induction package', color: 'from-green-500 to-emerald-600' },
  { id: 'permit_to_work', name: 'Permit to Work', icon: Shield, description: 'Formal authorisation for high-risk activities', color: 'from-red-500 to-rose-600' },
  { id: 'toolbox_talk', name: 'Toolbox Talk', icon: Wrench, description: 'Brief safety discussions for site teams', color: 'from-purple-500 to-violet-600' },
  { id: 'inspection_checklist', name: 'Inspection Checklist', icon: ClipboardCheck, description: 'Systematic inspection and audit forms', color: 'from-cyan-500 to-teal-600' },
  { id: 'completion_certificate', name: 'Completion Certificate', icon: Award, description: 'Practical completion and handover certification', color: 'from-emerald-500 to-green-600' },
  { id: 'handover_document', name: 'Handover Document', icon: FolderOpen, description: 'Project handover documentation package', color: 'from-indigo-500 to-blue-600' },
];

export default function DocumentGeneratorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [_loading, setLoading] = useState(true);

  // Form fields
  const [workDescription, setWorkDescription] = useState('');
  const [hazards, setHazards] = useState('');
  const [controls, setControls] = useState('');
  const [ppe, setPpe] = useState('');
  const [personnel, setPersonnel] = useState('');
  const [equipment, setEquipment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const handleGenerate = async () => {
    if (!selectedDocType) {
      toast.error('Please select a document type');
      return;
    }

    if (!workDescription.trim()) {
      toast.error('Please provide a work description');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const response = await fetch('/api/ai/document-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedDocType,
          projectId: selectedProject || undefined,
          context: {
            projectName: selectedProjectData?.name || 'Construction Project',
            projectLocation: selectedProjectData?.location || 'Site Location',
            clientName: selectedProjectData?.clientName || 'Client',
            workDescription,
            hazards: hazards.split(',').map(h => h.trim()).filter(Boolean),
            controls: controls.split(',').map(c => c.trim()).filter(Boolean),
            ppe: ppe.split(',').map(p => p.trim()).filter(Boolean),
            personnel: personnel.split(',').map(p => p.trim()).filter(Boolean),
            equipment: equipment.split(',').map(e => e.trim()).filter(Boolean),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            additionalNotes: additionalNotes || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      toast.success('Document generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard!');
  };

  const downloadDocument = () => {
    const docTypeName = documentTypes.find(d => d.id === selectedDocType)?.name || 'Document';
    const fileName = `${docTypeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-violet-800 to-purple-900 dark:from-white dark:via-violet-200 dark:to-purple-200 bg-clip-text text-transparent">
                  AI Document Generator
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Generate CDM 2015 compliant construction documents instantly
                </p>
              </div>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            AI Powered
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Selection */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Select Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">No project (generic)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {selectedProjectData && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-sm space-y-1">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4" />
                      {selectedProjectData.location}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4" />
                      {selectedProjectData.clientName}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Type Selection */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-500" />
                  Document Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documentTypes.map((docType) => (
                  <motion.button
                    key={docType.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDocType(docType.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      selectedDocType === docType.id
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${docType.color} text-white`}>
                        <docType.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{docType.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {docType.description}
                        </p>
                      </div>
                      {selectedDocType === docType.id && (
                        <CheckCircle2 className="h-5 w-5 text-violet-500" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Panel - Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                  Document Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Work Description *</label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Describe the work activity or topic..."
                    className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" /> Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" /> End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Hazards
                  </label>
                  <Input
                    value={hazards}
                    onChange={(e) => setHazards(e.target.value)}
                    placeholder="Working at height, manual handling..."
                    className="h-10 rounded-xl"
                  />
                  <p className="text-xs text-slate-500 mt-1">Comma-separated</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" /> Control Measures
                  </label>
                  <Input
                    value={controls}
                    onChange={(e) => setControls(e.target.value)}
                    placeholder="Guardrails, safety nets, supervision..."
                    className="h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-orange-500" /> PPE Required
                  </label>
                  <Input
                    value={ppe}
                    onChange={(e) => setPpe(e.target.value)}
                    placeholder="Hard hat, hi-vis, safety boots..."
                    className="h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" /> Personnel
                  </label>
                  <Input
                    value={personnel}
                    onChange={(e) => setPersonnel(e.target.value)}
                    placeholder="Site manager, supervisor, operatives..."
                    className="h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-500" /> Equipment
                  </label>
                  <Input
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="Scaffold, MEWP, hand tools..."
                    className="h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Additional Notes</label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any specific requirements or context..."
                    className="w-full h-20 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedDocType}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Document...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Output */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Generated Document
                  </CardTitle>
                  {generatedContent && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-8 px-3 rounded-lg"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadDocument}
                        className="h-8 px-3 rounded-lg"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-12 w-12 text-violet-500 mb-4" />
                    </motion.div>
                    <p className="font-medium">Generating your document...</p>
                    <p className="text-sm">This may take a moment</p>
                  </div>
                ) : generatedContent ? (
                  <div className="h-[calc(100vh-320px)] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      {generatedContent}
                    </pre>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                    <FileWarning className="h-12 w-12 mb-4" />
                    <p className="font-medium">No document generated yet</p>
                    <p className="text-sm text-center mt-1">
                      Select a document type and fill in the details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
