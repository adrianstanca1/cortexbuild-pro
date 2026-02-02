"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Maximize2, ZoomIn, ZoomOut, RotateCw, Layers,
  Pencil, Type, Square, Circle, ArrowRight, Minus, Ruler, Highlighter,
  Eraser, Save, Undo, Redo, Users, FileText, Eye, EyeOff, Trash2,
  ChevronDown, MousePointer, Triangle, CloudLightning, MessageSquare,
  Grid3X3, Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRealtime } from "@/hooks/use-realtime";
import { AnnotationCanvas } from "./annotation-canvas";
import { cn } from "@/lib/utils";

type Tool =
  | "select"
  | "pan"
  | "pen"
  | "highlighter"
  | "text"
  | "rectangle"
  | "circle"
  | "arrow"
  | "line"
  | "polygon"
  | "cloud"
  | "measurement"
  | "eraser";

interface Annotation {
  id: string;
  drawingId: string;
  type: string;
  data: any;
  color: string;
  strokeWidth: number;
  text?: string;
  visible: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface DrawingViewerClientProps {
  drawing: any;
  annotations: Annotation[];
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export function DrawingViewerClient({
  drawing,
  annotations: initialAnnotations,
  currentUser,
}: DrawingViewerClientProps) {
  const router = useRouter();
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [color, setColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(
    drawing.revisions[0]?.id || ""
  );
  const [activeUsers, setActiveUsers] = useState<string[]>([currentUser.name]);
  const [saving, setSaving] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [tempTextPosition, setTempTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const canvasRef = useRef<any>(null);

  // Real-time collaboration
  useRealtime((event) => {
    const data = event.payload as any;
    if (event.type === "annotation_added" && data.drawingId === drawing.id) {
      setAnnotations((prev) => [data.annotation, ...prev]);
    } else if (event.type === "annotation_updated" && data.drawingId === drawing.id) {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === data.annotation.id ? data.annotation : a))
      );
    } else if (event.type === "annotation_deleted" && data.drawingId === drawing.id) {
      setAnnotations((prev) => prev.filter((a) => a.id !== data.annotationId));
    } else if (event.type === "user_viewing_drawing" && data.drawingId === drawing.id) {
      setActiveUsers((prev) => {
        const name = data.userName;
        return prev.includes(name) ? prev : [...prev, name];
      });
    }
  });

  // Announce presence
  useEffect(() => {
    const announcePresence = async () => {
      try {
        await fetch(`/api/drawings/${drawing.id}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, userName: currentUser.name }),
        });
      } catch (error) {
        console.error("Failed to announce presence:", error);
      }
    };
    announcePresence();
    const interval = setInterval(announcePresence, 30000);
    return () => clearInterval(interval);
  }, [drawing.id, currentUser.id, currentUser.name]);

  const colors = [
    { value: "#FF0000", label: "Red" },
    { value: "#00FF00", label: "Green" },
    { value: "#0000FF", label: "Blue" },
    { value: "#FFFF00", label: "Yellow" },
    { value: "#FF00FF", label: "Magenta" },
    { value: "#00FFFF", label: "Cyan" },
    { value: "#000000", label: "Black" },
    { value: "#FFFFFF", label: "White" },
    { value: "#FFA500", label: "Orange" },
    { value: "#800080", label: "Purple" },
  ];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleSaveAnnotation = async (annotationData: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/drawings/${drawing.id}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedTool,
          data: annotationData,
          color,
          strokeWidth,
          text: textInput || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save annotation");
      const newAnnotation = await res.json();
      setAnnotations((prev) => [newAnnotation, ...prev]);
      addToHistory({ type: "add", annotation: newAnnotation });
      toast.success("Annotation saved");
    } catch (error) {
      toast.error("Failed to save annotation");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const res = await fetch(`/api/drawings/${drawing.id}/annotations/${annotationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete annotation");
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
      addToHistory({ type: "delete", annotationId });
      toast.success("Annotation deleted");
    } catch (error) {
      toast.error("Failed to delete annotation");
    }
  };

  const handleToggleAnnotationVisibility = (annotationId: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, visible: !a.visible } : a))
    );
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      // Apply history state
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      // Apply history state
    }
  };

  const addToHistory = (action: any) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), action]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${drawing.number}-annotated.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Drawing exported");
    } catch (error) {
      toast.error("Failed to export drawing");
    }
  };

  const selectedRevisionData = drawing.revisions.find(
    (r: any) => r.id === selectedRevision
  );

  const visibleAnnotations = showAnnotations
    ? annotations.filter((a) => a.visible)
    : [];

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="border-l h-6" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                {drawing.number}
              </span>
              <h1 className="font-semibold">{drawing.title}</h1>
              <Badge variant="outline">{drawing.discipline}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {drawing.project.name} • Rev {drawing.currentRevision}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {activeUsers.length} Viewing
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Active Users</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeUsers.map((user, idx) => (
                <DropdownMenuItem key={idx}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    {user}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-white dark:bg-slate-800 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={selectedTool === "select" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("select")}
              title="Select"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "pan" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("pan")}
              title="Pan"
            >
              <Move className="h-4 w-4" />
            </Button>
            <div className="border-l h-6 mx-1" />
            <Button
              variant={selectedTool === "pen" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("pen")}
              title="Pen"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "highlighter" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("highlighter")}
              title="Highlighter"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("text")}
              title="Text"
            >
              <Type className="h-4 w-4" />
            </Button>
            <div className="border-l h-6 mx-1" />
            <Button
              variant={selectedTool === "line" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("line")}
              title="Line"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "arrow" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("arrow")}
              title="Arrow"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "rectangle" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("rectangle")}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "circle" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("circle")}
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "cloud" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("cloud")}
              title="Cloud"
            >
              <CloudLightning className="h-4 w-4" />
            </Button>
            <div className="border-l h-6 mx-1" />
            <Button
              variant={selectedTool === "measurement" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("measurement")}
              title="Measurement"
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "eraser" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTool("eraser")}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          {/* Tool Properties */}
          <div className="flex items-center gap-4">
            {/* Color Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  Color
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="grid grid-cols-5 gap-1 p-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      className={cn(
                        "w-8 h-8 rounded border-2 hover:scale-110 transition-transform",
                        color === c.value ? "border-blue-500" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Stroke Width */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Width:</span>
              <div className="w-24">
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([v]) => setStrokeWidth(v)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-xs w-6">{strokeWidth}px</span>
            </div>

            <div className="border-l h-6" />

            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
              title="Toggle Annotations"
            >
              {showAnnotations ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <div className="border-l h-6" />
            <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotate} title="Rotate">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              title="Reset View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-950">
          <AnnotationCanvas
            ref={canvasRef}
            imageUrl={selectedRevisionData?.cloudStoragePath || ""}
            annotations={visibleAnnotations}
            selectedTool={selectedTool}
            color={color}
            strokeWidth={strokeWidth}
            zoom={zoom}
            rotation={rotation}
            showGrid={showGrid}
            onAnnotationComplete={handleSaveAnnotation}
            onAnnotationSelect={setSelectedAnnotation}
          />
          {saving && (
            <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm">Saving annotation...</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Annotations Panel */}
        <div className="w-80 border-l bg-white dark:bg-slate-800 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Annotations
              </h3>
              <Badge variant="secondary">{annotations.length}</Badge>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Revision</label>
              <select
                value={selectedRevision}
                onChange={(e) => setSelectedRevision(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm"
              >
                {drawing.revisions.map((rev: any) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.revision} - {format(new Date(rev.createdAt), "dd MMM yyyy")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {annotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No annotations yet</p>
                  <p className="text-xs mt-1">Start drawing to add annotations</p>
                </div>
              ) : (
                annotations.map((annotation) => (
                  <Card
                    key={annotation.id}
                    className={cn(
                      "p-3 cursor-pointer transition-colors",
                      selectedAnnotation === annotation.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedAnnotation(annotation.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <span className="text-xs font-medium capitalize truncate">
                            {annotation.type.replace("_", " ")}
                          </span>
                        </div>
                        {annotation.text && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {annotation.text}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {annotation.createdBy.name} •{" "}
                          {format(new Date(annotation.createdAt), "dd MMM HH:mm")}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAnnotationVisibility(annotation.id);
                          }}
                        >
                          {annotation.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                        {annotation.createdBy.id === currentUser.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnotation(annotation.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Text Input Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Annotation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your text..."
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTextDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (textInput.trim() && tempTextPosition) {
                  handleSaveAnnotation({
                    x: tempTextPosition.x,
                    y: tempTextPosition.y,
                    text: textInput,
                  });
                  setTextInput("");
                  setShowTextDialog(false);
                  setTempTextPosition(null);
                }
              }}
            >
              Add Text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}