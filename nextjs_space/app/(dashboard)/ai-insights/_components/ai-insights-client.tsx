"use client";

import { useState } from "react";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Target,
  Activity,
  Sparkles,
  Shield,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number | null;
  budget: number | null;
  startDate: Date;
  endDate: Date;
  _count: {
    tasks: number;
    riskRegister: number;
    defects: number;
    safetyIncidents: number;
  };
}

interface Signal {
  id: string;
  signalType: string;
  signalName: string;
  severity: string;
  confidence: number;
  description: string;
  recommendations: string[];
  createdAt: Date;
  project: {
    id: string;
    name: string;
    status: string;
  };
}

interface AIInsightsClientProps {
  projects: Project[];
  signals: Signal[];
}

export function AIInsightsClient({ projects, signals }: AIInsightsClientProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [riskPrediction, setRiskPrediction] = useState<any>(null);

  const runRiskAnalysis = async (projectId: string) => {
    setAnalyzing(true);
    setSelectedProject(projectId);

    try {
      const response = await fetch("/api/ai/risk-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setRiskPrediction(data);
      toast.success("AI Risk Analysis Complete");
    } catch {
      toast.error("Failed to analyze project");
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate portfolio health
  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const totalRisks = projects.reduce((sum, p) => sum + p._count.riskRegister, 0);
  const totalDefects = projects.reduce((sum, p) => sum + p._count.defects, 0);
  const totalIncidents = projects.reduce((sum, p) => sum + p._count.safetyIncidents, 0);

  // Recent critical signals
  const criticalSignals = signals.filter(s => s.severity === "HIGH" || s.severity === "CRITICAL");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">AI Intelligence Centre</h1>
                <p className="text-violet-100 text-lg">Predictive analytics and intelligent insights for your projects</p>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Analysis
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                <Activity className="w-4 h-4 mr-2" />
                Real-time Monitoring
              </Badge>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{activeProjects}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{projects.length} total projects</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Active Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{totalRisks}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{criticalSignals.length} critical signals</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Safety Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">{totalIncidents}</div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Across all projects</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Open Defects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{totalDefects}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Pending resolution</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Analysis */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-600" />
                AI Risk Analysis
              </CardTitle>
              <CardDescription>
                Select a project to run comprehensive risk prediction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-violet-300 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{project.name}</h4>
                    <div className="flex gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.progress || 0}%
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {project._count.riskRegister} risks
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => { runRiskAnalysis(project.id); }}
                    disabled={analyzing}
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white cursor-pointer"
                  >
                    {analyzing && selectedProject === project.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Analyze</>
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Risk Prediction Results */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Prediction Results
              </CardTitle>
              <CardDescription>
                AI-generated risk insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskPrediction ? (
                <div className="space-y-4">
                  {/* Risk Score */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Health Score</span>
                      <Badge variant="outline" className={
                        riskPrediction.prediction?.riskScore >= 80 ? "border-emerald-500 text-emerald-700" :
                        riskPrediction.prediction?.riskScore >= 60 ? "border-amber-500 text-amber-700" :
                        "border-red-500 text-red-700"
                      }>
                        {riskPrediction.prediction?.riskScore || 0}/100
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div 
                        style={{ width: `${riskPrediction.prediction?.riskScore || 0}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          riskPrediction.prediction?.riskScore >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                          riskPrediction.prediction?.riskScore >= 60 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                          "bg-gradient-to-r from-red-500 to-rose-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Early Warnings */}
                  {riskPrediction.prediction?.earlyWarnings && riskPrediction.prediction.earlyWarnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Early Warning Signals
                      </h4>
                      {riskPrediction.prediction.earlyWarnings.slice(0, 3).map((warning: string, idx: number) => (
                        <div key={idx} className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {riskPrediction.prediction?.recommendations && riskPrediction.prediction.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Recommended Actions
                      </h4>
                      {riskPrediction.prediction.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <div key={idx} className="flex gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-violet-600 dark:text-violet-300" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Select a project to view AI predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Predictive Signals */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Predictive Signals
            </CardTitle>
            <CardDescription>
              AI-detected patterns and anomalies across your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signals.slice(0, 10).map((signal) => (
                <div key={signal.id} className="flex items-start gap-4 p-4 border-2 rounded-xl hover:border-blue-300 transition-all">
                  <div className={
                    signal.severity === "HIGH" || signal.severity === "CRITICAL" ? "p-2 bg-red-100 dark:bg-red-950 rounded-lg" :
                    signal.severity === "MEDIUM" ? "p-2 bg-amber-100 dark:bg-amber-950 rounded-lg" :
                    "p-2 bg-blue-100 dark:bg-blue-950 rounded-lg"
                  }>
                    <AlertTriangle className={
                      signal.severity === "HIGH" || signal.severity === "CRITICAL" ? "w-5 h-5 text-red-600" :
                      signal.severity === "MEDIUM" ? "w-5 h-5 text-amber-600" :
                      "w-5 h-5 text-blue-600"
                    } />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{signal.signalName}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{signal.project.name}</p>
                      </div>
                      <Badge variant="outline" className={
                        signal.severity === "HIGH" || signal.severity === "CRITICAL" ? "border-red-500 text-red-700" :
                        signal.severity === "MEDIUM" ? "border-amber-500 text-amber-700" :
                        "border-blue-500 text-blue-700"
                      }>
                        {signal.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{signal.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Confidence: {Math.round(signal.confidence * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No predictive signals detected yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
