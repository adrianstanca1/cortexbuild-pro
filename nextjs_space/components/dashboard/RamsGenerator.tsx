"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Sparkles, Download, Copy, Check, AlertTriangle, HardHat, Shield, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RamsData {
  activity: string;
  hazards: string[];
  riskLevel: string;
  controls: string[];
  residualRisk: string;
  methodStatement: string;
  ppe: string[];
  emergencyProcedures: string;
}

export default function RamsGenerator() {
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [personnel, setPersonnel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [ramsData, setRamsData] = useState<RamsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const riskLevels = ["LOW", "MEDIUM", "HIGH", "EXTREME"];
  const locations = [
    "Office",
    "Warehouse",
    "Construction Site",
    "Roof Work",
    "Confined Space",
    "Working at Height",
    "Electrical Work",
    "Hot Work",
    "Excavation",
    "Demolition",
  ];

  const handleGenerateRams = async () => {
    if (!activity.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the work activity",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a comprehensive RAMS (Risk Assessment Method Statement) for the following construction activity:

Activity: ${activity}
Location: ${location || "Not specified"}
Duration: ${duration || "Not specified"}
Personnel: ${personnel || "Not specified"}

Please provide:
1. Identified hazards
2. Initial risk level (LOW/MEDIUM/HIGH/EXTREME)
3. Control measures to mitigate risks
4. Residual risk level after controls
5. Step-by-step method statement
6. Required PPE
7. Emergency procedures

Format as JSON with keys: hazards, riskLevel, controls, residualRisk, methodStatement, ppe, emergencyProcedures`,
          type: "rams_generation",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.response || data.content;

        // Parse AI response - expecting structured content
        const parsedRams: RamsData = {
          activity,
          hazards: extractList(aiResponse, "hazards"),
          riskLevel: extractValue(aiResponse, "riskLevel") || "MEDIUM",
          controls: extractList(aiResponse, "controls"),
          residualRisk: extractValue(aiResponse, "residualRisk") || "LOW",
          methodStatement: extractSection(aiResponse, "method statement") || aiResponse,
          ppe: extractList(aiResponse, "ppe"),
          emergencyProcedures: extractSection(aiResponse, "emergency"),
        };

        setRamsData(parsedRams);
        toast({
          title: "RAMS Generated",
          description: "Risk Assessment Method Statement has been created",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Could not generate RAMS. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating RAMS:", error);
      toast({
        title: "Error",
        description: "Failed to generate RAMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const extractList = (text: string, keyword: string): string[] => {
    const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\s*\\n|\\Z)`, "i");
    const match = text.match(regex);
    if (match) {
      return match[1]
        .split(/\n/)
        .filter((line) => line.trim().length > 1)
        .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0);
    }
    return [];
  };

  const extractValue = (text: string, keyword: string): string => {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const extractSection = (text: string, keyword: string): string => {
    const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\s*\\n|\\Z)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const handleCopy = () => {
    if (ramsData) {
      const text = `
RAMS - Risk Assessment Method Statement

Activity: ${ramsData.activity}
Risk Level: ${ramsData.riskLevel}
Residual Risk: ${ramsData.residualRisk}

Hazards:
${ramsData.hazards.map((h) => `- ${h}`).join("\n")}

Control Measures:
${ramsData.controls.map((c) => `- ${c}`).join("\n")}

Method Statement:
${ramsData.methodStatement}

PPE Required:
${ramsData.ppe.map((p) => `- ${p}`).join("\n")}

Emergency Procedures:
${ramsData.emergencyProcedures}
`.trim();

      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "RAMS content copied to clipboard" });
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/rams/${ramsData.activity}/export?format=pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ramsData })
      });
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `rams-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast({ title: "Export Complete", description: "RAMS report downloaded. Open in browser and print to PDF." });
      } else {
        // Fallback: download as HTML directly
        const htmlContent = generateRamsHTML(ramsData);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `rams-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast({ title: "Export Complete", description: "RAMS downloaded as HTML" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const generateRamsHTML = (rams: RamsData) => {
    return `<!DOCTYPE html>
<html>
<head>
  <title>RAMS - ${rams.activity}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { color: #1e40af; margin-bottom: 10px; }
    h2 { color: #374151; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }
    .header { border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
    .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
    .risk-extreme { background: #ef4444; color: white; }
    .risk-high { background: #f97316; color: white; }
    .risk-medium { background: #eab308; color: black; }
    .risk-low { background: #22c55e; color: white; }
    .section { margin-top: 25px; background: #f9fafb; padding: 20px; border-radius: 8px; }
    ul { line-height: 1.8; }
    .ppe-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .ppe-badge { background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 4px; }
    .emergency { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RAMS - Risk Assessment Method Statement</h1>
    <p style="color: #6b7280;">Generated on ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>Activity</h2>
    <p style="font-size: 18px; font-weight: 600;">${rams.activity}</p>
  </div>

  <div class="section">
    <h2>Risk Assessment</h2>
    <p><strong>Initial Risk Level:</strong> <span class="risk-badge risk-${rams.riskLevel.toLowerCase()}">${rams.riskLevel}</span></p>
    <p><strong>Residual Risk:</strong> <span class="risk-badge risk-${rams.residualRisk.toLowerCase()}">${rams.residualRisk}</span></p>
  </div>

  <div class="section">
    <h2>Identified Hazards</h2>
    <ul>${rams.hazards.map(h => `<li>${h}</li>`).join('')}</ul>
  </div>

  <div class="section">
    <h2>Control Measures</h2>
    <ul>${rams.controls.map(c => `<li>${c}</li>`).join('')}</ul>
  </div>

  <div class="section">
    <h2>Method Statement</h2>
    <p style="line-height: 1.8; white-space: pre-wrap;">${rams.methodStatement}</p>
  </div>

  ${rams.ppe && rams.ppe.length > 0 ? `
  <div class="section">
    <h2>Required PPE</h2>
    <div class="ppe-container">${rams.ppe.map(p => `<span class="ppe-badge">${p}</span>`).join('')}</div>
  </div>
  ` : ''}

  ${rams.emergencyProcedures ? `
  <div class="emergency">
    <h2 style="margin-top: 0; color: #92400e;">Emergency Procedures</h2>
    <p style="line-height: 1.6;">${rams.emergencyProcedures}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by CortexBuild Pro RAMS Generator | ${new Date().toLocaleString('en-GB')}</p>
  </div>
</body>
</html>`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "EXTREME":
        return "bg-red-500 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-black";
      case "LOW":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate RAMS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="activity">Work Activity *</Label>
              <Textarea
                id="activity"
                placeholder="Describe the work activity in detail (e.g., 'Installing metal roofing panels on a commercial building at height')"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2 hours">1-2 hours</SelectItem>
                    <SelectItem value="Half day">Half day</SelectItem>
                    <SelectItem value="Full day">Full day</SelectItem>
                    <SelectItem value="2-3 days">2-3 days</SelectItem>
                    <SelectItem value="1 week">1 week</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="personnel">Personnel Involved</Label>
              <Textarea
                id="personnel"
                placeholder="List personnel and their roles (e.g., 2 roofers, 1 supervisor, 1 ground assistant)"
                value={personnel}
                onChange={(e) => setPersonnel(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            <Button onClick={handleGenerateRams} disabled={generating || !activity.trim()} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Generating RAMS..." : "Generate RAMS"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated RAMS Output */}
      {ramsData && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Generated RAMS
              </CardTitle>
              <div className="flex gap-2">
                <Badge className={getRiskColor(ramsData.riskLevel)}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {ramsData.riskLevel} Risk
                </Badge>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exp...' : 'PDF'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-muted-foreground">Initial Risk Level</p>
                <p className={`text-lg font-bold ${getRiskColor(ramsData.riskLevel).replace("bg-", "text-").split(" ")[0]}`}>
                  {ramsData.riskLevel}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-muted-foreground">Residual Risk</p>
                <p className={`text-lg font-bold ${getRiskColor(ramsData.residualRisk).replace("bg-", "text-").split(" ")[0]}`}>
                  {ramsData.residualRisk}
                </p>
              </div>
            </div>

            {/* Hazards */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Identified Hazards
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {ramsData.hazards.map((hazard, idx) => (
                  <li key={idx}>{hazard}</li>
                ))}
              </ul>
            </div>

            {/* Control Measures */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <HardHat className="h-4 w-4 text-blue-500" />
                Control Measures
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {ramsData.controls.map((control, idx) => (
                  <li key={idx}>{control}</li>
                ))}
              </ul>
            </div>

            {/* Method Statement */}
            <div>
              <h3 className="font-semibold mb-2">Method Statement</h3>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm whitespace-pre-wrap">
                {ramsData.methodStatement}
              </div>
            </div>

            {/* PPE */}
            {ramsData.ppe && ramsData.ppe.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Required PPE</h3>
                <div className="flex flex-wrap gap-2">
                  {ramsData.ppe.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Procedures */}
            {ramsData.emergencyProcedures && (
              <div>
                <h3 className="font-semibold mb-2">Emergency Procedures</h3>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-900 dark:text-amber-100">
                  {ramsData.emergencyProcedures}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
