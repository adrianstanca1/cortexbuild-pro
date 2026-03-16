"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DOMPurify from "dompurify";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Printer, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RamsGenerator() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState("");
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<any>(null);
  const { toast } = useToast();

  const project = useMemo(
    () => ({
      name,
      location,
      description,
      date: date.toISOString().slice(0, 10),
      tasks: tasks
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }),
    [name, location, description, date, tasks]
  );

  async function generate() {
    if (!name) {
      toast({
        title: "Missing Information",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHtml("");
    setError(null);

    try {
      const response = await fetch("/api/rams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate RAMS");
      }

      const data = await response.json();
      const sanitizedHtml = DOMPurify.sanitize(data.html || "");
      setHtml(sanitizedHtml);

      // Save to database
      if (data.id) {
        toast({
          title: "Success",
          description: "RAMS document generated and saved successfully",
        });
      } else {
        toast({
          title: "Success",
          description: "RAMS document generated successfully",
        });
      }
    } catch (e: any) {
      console.error("RAMS generation failed:", e);
      setError(e);

      toast({
        title: "Generation Failed",
        description: "Failed to generate RAMS document.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openPrint() {
    if (!html) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RAMS Document - ${name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${DOMPurify.sanitize(html)}
      </body>
      </html>
    `;

    win.document.write(printContent);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>RAMS Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Project name *</Label>
              <Input
                id="name"
                placeholder="Project name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="tasks">Tasks (comma separated)</Label>
              <Input
                id="tasks"
                placeholder="e.g., Site preparation, Foundation work, Steel erection"
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading || !name}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarIcon className="h-4 w-4 mr-2" />
              )}
              {loading ? "Generating..." : "Generate RAMS"}
            </Button>
            <Button variant="outline" onClick={openPrint} disabled={!html}>
              <Printer className="h-4 w-4 mr-2" />
              Print / Open
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">Generation failed</p>
              <p className="text-xs text-muted-foreground mt-1">{error?.message || String(error)}</p>
              <Button variant="outline" size="sm" onClick={generate} className="mt-2">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {html && (
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 max-h-[400px] overflow-auto border border-slate-700">
              <div
                className="text-slate-100"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
