"use client";

import { useState, useRef, useCallback } from "react";
import {
  Eye,
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  ChevronLeft,
  ImageIcon,
  CheckCircle,
  Camera,
  ShieldAlert,
  Wrench,
  BarChart2,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

const ANALYSIS_TYPES = [
  {
    value: "general",
    label: "General Analysis",
    icon: Camera,
    description: "Overall site condition and observations",
    prompt:
      "Analyse this construction site photo. Describe what you see, identify notable features, safety concerns, progress indicators, or issues to report.",
  },
  {
    value: "safety",
    label: "Safety & PPE Check",
    icon: ShieldAlert,
    description: "Identify safety hazards and PPE compliance",
    prompt:
      "Perform a safety inspection of this construction photo. Identify: PPE compliance, hazards, access/egress issues, housekeeping concerns, and immediate dangers. Rate overall safety and list priority actions.",
  },
  {
    value: "defects",
    label: "Defect Detection",
    icon: Wrench,
    description: "Identify defects and quality issues",
    prompt:
      "Inspect this construction photo for defects and quality issues. List each defect with: location, description, severity (Critical/Major/Minor), and recommended remediation action.",
  },
  {
    value: "progress",
    label: "Progress Assessment",
    icon: BarChart2,
    description: "Estimate completion and progress status",
    prompt:
      "Assess the construction progress in this photo. Estimate percentage complete for visible work, identify what is done, in progress, and outstanding. Note any programme risks.",
  },
];

interface AnalysisResult {
  type: string;
  filename: string;
  result: string;
  timestamp: Date;
}

export default function PhotoAnalysisPage() {
  const [analysisType, setAnalysisType] = useState("general");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large (max 10MB)");
        return;
      }
      setSelectedImage(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
      setCurrentResult("");
    },
    [],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    setSelectedImage(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
    setCurrentResult("");
  }, []);

  const selectedType = ANALYSIS_TYPES.find((t) => t.value === analysisType)!;

  const parseStream = async (
    response: Response,
    onChunk: (t: string) => void,
  ) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let partial = "";
    if (!reader) return "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      partial += decoder.decode(value, { stream: true });
      const lines = partial.split("\n");
      partial = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content || "";
            if (chunk) {
              full += chunk;
              onChunk(full);
            }
          } catch {
            /* skip */
          }
        }
      }
    }
    return full;
  };

  const analyse = async () => {
    if (!selectedImage) {
      toast.error("Please select a file first");
      return;
    }
    setIsAnalysing(true);
    setCurrentResult("");
    const prompt = customPrompt.trim() || selectedType.prompt;
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("query", prompt);
      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      let finalResult = "";
      await parseStream(response, (text) => {
        setCurrentResult(text);
        finalResult = text;
      });
      if (finalResult) {
        setResults((prev) => [
          {
            type: selectedType.label,
            filename: selectedImage.name,
            result: finalResult,
            timestamp: new Date(),
          },
          ...prev,
        ]);
        toast.success("Analysis complete");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ai-insights">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            AI Insights
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="h-6 w-6 text-green-600" />
            AI Photo Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload site photos for defect, safety, and progress analysis
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
        <div>
          <p className="font-medium">
            Vision model required for image analysis
          </p>
          <p className="mt-1 text-amber-700 dark:text-amber-300">
            Run{" "}
            <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono text-xs">
              ollama pull llava
            </code>{" "}
            and set{" "}
            <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono text-xs">
              OLLAMA_MODEL=llava
            </code>{" "}
            in your environment. Text documents (.txt, .csv) work with any
            model.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  selectedImage
                    ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*,.txt,.csv,.pdf"
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Selected"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setImagePreview(null);
                        setCurrentResult("");
                      }}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-2 font-medium">
                      <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                      {selectedImage?.name}
                    </p>
                  </div>
                ) : selectedImage ? (
                  <div>
                    <Bot className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                      {selectedImage.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setCurrentResult("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium">
                      Drop a file or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images (JPG, PNG, WEBP) or text files (.txt, .csv) up to
                      10MB
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Analysis Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {ANALYSIS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setAnalysisType(type.value);
                      setCustomPrompt("");
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      analysisType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <type.icon
                      className={`h-4 w-4 mb-1 ${analysisType === type.value ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p className="text-xs font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
              <Textarea
                placeholder={`Custom prompt (optional) — default: ${selectedType.prompt.substring(0, 60)}...`}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
              <Button
                className="w-full"
                onClick={analyse}
                disabled={!selectedImage || isAnalysing}
              >
                {isAnalysing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyse
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Analysis Result
                {results.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {results.length} analyses
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!currentResult && !isAnalysing ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Upload a file and click Analyse</p>
                </div>
              ) : (
                <div className="relative">
                  {isAnalysing && !currentResult && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analysing...
                    </div>
                  )}
                  {currentResult && (
                    <Textarea
                      value={currentResult}
                      readOnly
                      rows={18}
                      className="resize-none font-mono text-xs leading-relaxed"
                    />
                  )}
                  {isAnalysing && currentResult && (
                    <div className="absolute bottom-2 right-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {results.length > 1 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Previous Analyses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.slice(1, 4).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentResult(r.result)}
                    className="w-full text-left p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">
                        {r.filename}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0 ml-2"
                      >
                        {r.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
