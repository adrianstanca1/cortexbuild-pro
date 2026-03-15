"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  User,
  Loader2,
  FileUp,
  Trash2,
  FileText,
  Eye,
  AlertTriangle,
  CheckSquare,
  FolderOpen,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Stats {
  openTasks: number;
  openRFIs: number;
  activeIncidents: number;
  projectCount: number;
}

interface AIInsightsClientProps {
  projects: Project[];
  stats: Stats;
  ollamaModel: string;
}

const SUGGESTED_PROMPTS = [
  "Give me a summary of all active projects",
  "What are the most overdue tasks?",
  "Show me all open RFIs and their status",
  "Are there any critical safety incidents I should know about?",
  "Which projects are over budget or at risk?",
  "Summarise recent change orders and their cost impact",
];

function MessageBubble({
  message,
  onCopy,
}: {
  message: Message;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 group ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          }`}
        >
          {message.isStreaming ? (
            <span>
              {message.content}
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
            </span>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        {!isUser && !message.isStreaming && message.content && (
          <button
            onClick={handleCopy}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
        <span className="text-xs text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

export function AIInsightsClient({
  projects,
  stats,
  ollamaModel,
}: AIInsightsClientProps) {
  // router available for future navigation needs
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama status on mount
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setOllamaOnline(d?.services?.ai?.available ?? false))
      .catch(() => setOllamaOnline(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseStream = async (
    response: Response,
    onChunk: (chunk: string) => void,
  ): Promise<string> => {
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

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isLoading) return;

      setInput("");

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };

      const assistantMsgId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        const contextMessages = messages
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            context: contextMessages,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Failed" }));
          throw new Error(err.error || "AI request failed");
        }

        await parseStream(response, (currentText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: currentText, isStreaming: true }
                : m,
            ),
          );
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m,
          ),
        );
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Failed to get AI response";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Sorry, I encountered an error: ${msg}`,
                  isStreaming: false,
                }
              : m,
          ),
        );
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `📎 Analysing document: ${file.name}`,
      timestamp: new Date(),
    };
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "query",
        "Analyse this construction document. Identify key information, risks, and action items.",
      );

      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Analysis failed");
      }

      await parseStream(response, (currentText) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: currentText, isStreaming: true }
              : m,
          ),
        );
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m,
        ),
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Document analysis failed";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Sorry, I could not analyse the document: ${msg}`,
                isStreaming: false,
              }
            : m,
        ),
      );
      toast.error(msg);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Powered by{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              {ollamaModel}
            </code>{" "}
            via Ollama
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
              ollamaOnline === null
                ? "text-muted-foreground border-border"
                : ollamaOnline
                  ? "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800"
                  : "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaOnline === null
                  ? "bg-muted-foreground animate-pulse"
                  : ollamaOnline
                    ? "bg-green-500"
                    : "bg-red-500"
              }`}
            />
            {ollamaOnline === null
              ? "Checking..."
              : ollamaOnline
                ? "Ollama Online"
                : "Ollama Offline"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetch("/api/health")
                .then((r) => r.json())
                .then((d) =>
                  setOllamaOnline(d?.services?.ai?.available ?? false),
                );
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0">
          {/* Stats */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Live Context
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {[
                {
                  label: "Active Projects",
                  value: stats.projectCount,
                  icon: FolderOpen,
                  color: "text-blue-600",
                },
                {
                  label: "Open Tasks",
                  value: stats.openTasks,
                  icon: CheckSquare,
                  color: "text-orange-600",
                },
                {
                  label: "Open RFIs",
                  value: stats.openRFIs,
                  icon: FileText,
                  color: "text-purple-600",
                },
                {
                  label: "Safety Alerts",
                  value: stats.activeIncidents,
                  icon: AlertTriangle,
                  color: "text-red-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {s.value}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                AI Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              <Link
                href="/ai-insights/document-generator"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-sm group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Document Generator</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
              <Link
                href="/ai-insights/photo-analysis"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-sm group"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span>Photo Analysis</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* Projects quick ref */}
          {projects.length > 0 && (
            <Card className="border-border/50 flex-1 min-h-0">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {projects.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          sendMessage(`Tell me about the project: ${p.name}`)
                        }
                        className="w-full text-left text-xs p-1.5 rounded hover:bg-accent transition-colors truncate text-muted-foreground hover:text-foreground"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-h-0 border rounded-xl overflow-hidden bg-background">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold mb-2">CortexBuild AI</h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-8">
                  Ask me anything about your projects, tasks, RFIs, safety, or
                  upload a document for instant analysis.
                </p>
                {ollamaOnline === false && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 px-4 py-2 rounded-lg mb-6 border border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Ollama is offline. Start Ollama to enable AI features.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={isLoading || ollamaOnline === false}
                      className="text-left text-xs p-3 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-2">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
            {messages.length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setMessages([])}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear chat
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.txt,.csv,.md"
                className="hidden"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Upload document for analysis"
              >
                <FileUp className="h-4 w-4" />
              </Button>
              <Textarea
                ref={inputRef}
                placeholder={
                  ollamaOnline === false
                    ? "Ollama is offline — start Ollama to use AI features"
                    : "Ask about your projects, tasks, RFIs... (Enter to send, Shift+Enter for new line)"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || ollamaOnline === false}
                rows={1}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              />
              <Button
                className="h-10 flex-shrink-0"
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim() || ollamaOnline === false}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI responses are generated by a local Ollama model and may not
              always be accurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
