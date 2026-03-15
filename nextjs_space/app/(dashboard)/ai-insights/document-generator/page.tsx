"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  ChevronLeft,
  Bot,
  FileUp,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

const DOCUMENT_TYPES = [
  { value: "variation_letter", label: "Variation / Change Order Letter" },
  { value: "eot_notice", label: "Extension of Time (EOT) Notice" },
  { value: "delay_claim", label: "Delay & Disruption Claim Draft" },
  { value: "meeting_minutes", label: "Meeting Minutes" },
  { value: "site_instruction", label: "Site Instruction" },
  { value: "defect_notice", label: "Defect Notice" },
  { value: "payment_notice", label: "Payment / Withholding Notice" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "method_statement", label: "Method Statement" },
  { value: "progress_report", label: "Progress Report" },
  { value: "custom", label: "Custom Document" },
];

const TEMPLATES: Record<string, string> = {
  variation_letter: `Please draft a formal variation letter for the following:
- Project: [PROJECT NAME]
- Contractor: [CONTRACTOR NAME]
- Client: [CLIENT NAME]
- Variation description: [DESCRIBE THE VARIATION]
- Estimated cost impact: £[AMOUNT]
- Programme impact: [DAYS] days

Include: reference number, date, contract details, clear scope description, cost breakdown summary, programme impact, and signature block.`,
  eot_notice: `Please draft an Extension of Time notice for:
- Project: [PROJECT NAME]
- Contract reference: [REF]
- Delay event: [DESCRIBE THE DELAY EVENT]
- Date of delay: [DATE]
- Period of extension requested: [WEEKS/DAYS]
- Relevant contract clause: [CLAUSE]

Include formal notice language, delay event description, causation analysis, and time impact.`,
  delay_claim: `Please draft a delay and disruption claim letter for:
- Project: [PROJECT NAME]
- Events causing delay: [LIST EVENTS]
- Period affected: [START DATE] to [END DATE]
- Costs incurred: £[AMOUNT]
- Programme impact: [DAYS] weeks delay

Include: executive summary, delay events, causal link to costs, quantification approach, and relief sought.`,
  meeting_minutes: `Please draft meeting minutes for:
- Meeting type: [e.g. Site progress meeting]
- Date: [DATE]
- Location: [LOCATION]
- Attendees: [LIST NAMES AND ROLES]
- Agenda items discussed: [LIST ITEMS]
- Actions arising: [LIST ACTIONS WITH OWNERS AND DUE DATES]`,
  risk_assessment: `Please draft a risk assessment for:
- Activity: [ACTIVITY NAME]
- Location: [SITE / AREA]
- Persons at risk: [WHO IS AT RISK]
- Hazards identified: [LIST HAZARDS]
- Existing controls: [LIST CURRENT CONTROLS]
- Assessor: [NAME]
- Date: [DATE]`,
  custom: "",
};

export default function DocumentGeneratorPage() {
  const [docType, setDocType] = useState("variation_letter");
  const [prompt, setPrompt] = useState(TEMPLATES.variation_letter);
  const [generated, setGenerated] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (value: string) => {
    setDocType(value);
    setPrompt(TEMPLATES[value] || "");
    setGenerated("");
  };

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
            // skip
          }
        }
      }
    }
    return full;
  };

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGenerated("");

    try {
      const selectedType =
        DOCUMENT_TYPES.find((d) => d.value === docType)?.label ||
        "Construction Document";

      const fullPrompt = `You are a professional construction contract administrator. Generate a formal, professional ${selectedType} based on the following details. Use appropriate legal/professional language for UK construction contracts. Format with clear sections and headings.

${prompt}

Generate the complete document now:`;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullPrompt }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Generation failed");
      }

      await parseStream(response, (text) => setGenerated(text));
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Document generation failed";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    setGenerated("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "query",
        `Analyse this document and generate a professional ${DOCUMENT_TYPES.find((d) => d.value === docType)?.label || "construction document"} based on its contents. Use formal UK construction contract language.`,
      );

      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Analysis failed");
      }

      await parseStream(response, (text) => setGenerated(text));
      toast.success("Document generated from uploaded file");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "File analysis failed";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyDocument = () => {
    navigator.clipboard.writeText(generated).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const downloadDocument = () => {
    const blob = new Blob([generated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label =
      DOCUMENT_TYPES.find((d) => d.value === docType)?.label || "document";
    a.download = `${label.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ai-insights">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            AI Insights
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            AI Document Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate professional construction documents using AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Document Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={docType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Details & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Fill in the details above or write your own instructions..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={12}
                className="resize-none font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  onClick={generate}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Document
                    </>
                  )}
                </Button>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.csv,.md"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    title="Generate from uploaded file"
                  >
                    <FileUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output panel */}
        <div className="space-y-4">
          <Card className="border-border/50 flex flex-col">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Generated Document
              </CardTitle>
              {generated && (
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyDocument}
                    className="h-7 text-xs"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDocument}
                    className="h-7 text-xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGenerated("")}
                    className="h-7 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!generated && !isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">
                    Fill in the details and click Generate
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    Or upload an existing document to analyse and draft from
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {isGenerating && !generated && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating your document...
                    </div>
                  )}
                  {generated && (
                    <Textarea
                      value={generated}
                      onChange={(e) => setGenerated(e.target.value)}
                      rows={20}
                      className="resize-none font-mono text-xs leading-relaxed"
                    />
                  )}
                  {isGenerating && generated && (
                    <div className="absolute bottom-2 right-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {generated && (
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Always review AI-generated documents before sending. Seek legal
              advice where required.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
