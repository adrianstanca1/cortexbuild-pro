"use client";

import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText,
  Users,
  HardHat,
  ClipboardCheck,
  Building2,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight,
  Scale,
  BookOpen,
  FileWarning,
  Wrench
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number | null;
  _count: {
    tasks: number;
    riskAssessments: number;
    toolboxTalks: number;
    inspections: number;
    safetyIncidents: number;
    dailyReports: number;
    documents: number;
    teamMembers: number;
  };
}

interface ComplianceResult {
  id: string;
  requirement: string;
  description: string;
  status: string;
  evidence: string;
  checkedAt: string;
}

interface ComplianceData {
  projectName: string;
  complianceResults: {
    prePlanningPhase: ComplianceResult[];
    constructionPhase: ComplianceResult[];
    documentation: ComplianceResult[];
    workerWelfare: ComplianceResult[];
  };
  scores: {
    prePlanning: number;
    construction: number;
    documentation: number;
    workerWelfare: number;
  };
  overallScore: number;
  summary: {
    totalRequirements: number;
    compliant: number;
    partial: number;
    requiresAction: number;
  };
  recommendations: { requirement: string; action: string }[];
}

export function ComplianceDashboardClient({ projects }: { projects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const runComplianceCheck = async (projectId: string) => {
    setChecking(true);
    setSelectedProject(projectId);

    try {
      const response = await fetch("/api/ai/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });

      if (!response.ok) throw new Error("Compliance check failed");

      const data = await response.json();
      setComplianceData(data);
      toast.success("CDM 2015 Compliance Check Complete");
    } catch (error) {
      toast.error("Failed to run compliance check");
    } finally {
      setChecking(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "PARTIAL":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "NON_COMPLIANT":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Compliant</Badge>;
      case "PARTIAL":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Partial</Badge>;
      case "NON_COMPLIANT":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  const sectionConfig = [
    { key: "prePlanningPhase", title: "Pre-Planning Phase", icon: Building2, color: "blue" },
    { key: "constructionPhase", title: "Construction Phase", icon: HardHat, color: "orange" },
    { key: "documentation", title: "Documentation", icon: FileText, color: "purple" },
    { key: "workerWelfare", title: "Worker Welfare", icon: Users, color: "green" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-8 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">CDM 2015 Compliance</h1>
                <p className="text-emerald-100 text-lg">Construction (Design and Management) Regulations 2015 Tracker</p>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                <Scale className="w-4 h-4 mr-2" />
                UK Regulations
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                25 Requirements
              </Badge>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              Select Project for Compliance Check
            </CardTitle>
            <CardDescription>
              Choose an active project to run CDM 2015 compliance analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedProject === project.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
                  onClick={() => !checking && runComplianceCheck(project.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{project.name}</h4>
                      <Badge variant="outline" className="mt-1">{project.status}</Badge>
                    </div>
                    {checking && selectedProject === project.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {project._count.documents} docs
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {project._count.riskAssessments} risks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project._count.teamMembers} team
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project._count.dailyReports} reports
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Results */}
        {complianceData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="md:col-span-1 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-slate-900">
                <CardContent className="pt-6 text-center">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">{complianceData.overallScore}%</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Overall Compliance</p>
                  <Progress value={complianceData.overallScore} className="mt-4 h-3" />
                </CardContent>
              </Card>

              {sectionConfig.map((section) => (
                <Card key={section.key} className="border-2">
                  <CardContent className="pt-6 text-center">
                    <section.icon className={`w-8 h-8 mx-auto mb-2 text-${section.color}-500`} />
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {complianceData.scores[section.key as keyof typeof complianceData.scores]}%
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{section.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{complianceData.summary.compliant}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Compliant</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{complianceData.summary.partial}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Partial</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-xl">
                    <FileWarning className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{complianceData.summary.requiresAction}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Requires Action</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <Wrench className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{complianceData.summary.totalRequirements}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Requirements</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Detailed Compliance Results
                </CardTitle>
                <CardDescription>
                  {complianceData.projectName} - CDM 2015 Requirements Breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sectionConfig.map((section) => (
                  <div key={section.key} className="border-2 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <section.icon className={`w-5 h-5 text-${section.color}-500`} />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{section.title}</span>
                        <Badge variant="outline">
                          {complianceData.scores[section.key as keyof typeof complianceData.scores]}%
                        </Badge>
                      </div>
                      {expandedSections.includes(section.key) ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedSections.includes(section.key) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            {complianceData.complianceResults[
                              section.key as keyof typeof complianceData.complianceResults
                            ].map((item: ComplianceResult) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                              >
                                {getStatusIcon(item.status)}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-medium text-slate-900 dark:text-slate-100">
                                      {item.requirement}
                                    </h5>
                                    {getStatusBadge(item.status)}
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {item.description}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                                    Evidence: {item.evidence}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {complianceData.recommendations && complianceData.recommendations.length > 0 && (
              <Card className="border-2 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    Priority Actions Required
                  </CardTitle>
                  <CardDescription>
                    Address these items to improve compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {complianceData.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <div className="w-6 h-6 flex-shrink-0 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-200">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-100">{rec.requirement}</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* No Results State */}
        {!complianceData && !checking && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900 flex items-center justify-center">
              <Shield className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Select a Project</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Choose a project above to run a comprehensive CDM 2015 compliance check and identify areas requiring attention.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
