"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Maximize2, ZoomIn, ZoomOut, RotateCw, Layers,
  Pencil, Type, Square, Circle, ArrowRight, Minus, Ruler, Highlighter,
  Eraser, Undo, Redo, Users, Eye, EyeOff, Trash2,
  MousePointer, Triangle, Cloud, MessageSquare,
  Move, Pipette, Pen, Brush, Sparkles,
  Star, Hexagon, ArrowUpRight, Hash, Stamp, Target,
  RotateCcw, ScanLine, Lock, Unlock,
  LayoutGrid, MessageCircle, Tag,
  CheckCircle, XCircle, AlertCircle, Clock, Info,
  PanelLeftClose, PanelLeft
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRealtime } from "@/hooks/use-realtime";
import { AnnotationCanvas, ToolType, Point, BrushSettings, Annotation } from "./annotation-canvas";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CollaboratorCursor {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
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

const STAMP_TYPES = [
  { id: 'approved', label: 'Approved', color: '#22c55e', icon: CheckCircle },
  { id: 'rejected', label: 'Rejected', color: '#ef4444', icon: XCircle },
  { id: 'revised', label: 'Revised', color: '#f59e0b', icon: AlertCircle },
  { id: 'draft', label: 'Draft', color: '#6b7280', icon: Clock },
  { id: 'forReview', label: 'For Review', color: '#3b82f6', icon: Info },
];

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
  'Verdana', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black'
];

const TOOL_CATEGORIES = {
  selection: [
    { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
    { id: 'pan', icon: Move, label: 'Pan', shortcut: 'H' },
  ],
  drawing: [
    { id: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
    { id: 'brush', icon: Brush, label: 'Brush', shortcut: 'B' },
    { id: 'marker', icon: Pencil, label: 'Marker', shortcut: 'M' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter', shortcut: 'G' },
    { id: 'spray', icon: Sparkles, label: 'Spray', shortcut: 'Y' },
  ],
  shapes: [
    { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
    { id: 'doubleArrow', icon: ArrowUpRight, label: 'Double Arrow', shortcut: 'Shift+A' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'filledRectangle', icon: Square, label: 'Filled Rectangle', shortcut: 'Shift+R' },
    { id: 'roundedRectangle', icon: Square, label: 'Rounded Rectangle', shortcut: 'Alt+R' },
    { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
    { id: 'filledCircle', icon: Circle, label: 'Filled Circle', shortcut: 'Shift+C' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'E' },
    { id: 'triangle', icon: Triangle, label: 'Triangle', shortcut: 'T' },
    { id: 'polygon', icon: Hexagon, label: 'Polygon', shortcut: 'Shift+P' },
    { id: 'star', icon: Star, label: 'Star', shortcut: 'S' },
  ],
  markup: [
    { id: 'cloud', icon: Cloud, label: 'Cloud', shortcut: 'O' },
    { id: 'cloudRevision', icon: Cloud, label: 'Revision Cloud', shortcut: 'Shift+O' },
    { id: 'callout', icon: MessageSquare, label: 'Callout', shortcut: 'K' },
    { id: 'speechBubble', icon: MessageCircle, label: 'Speech Bubble', shortcut: 'Shift+K' },
    { id: 'crosshatch', icon: Hash, label: 'Crosshatch', shortcut: 'X' },
  ],
  text: [
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'leader', icon: Tag, label: 'Leader', shortcut: 'Shift+L' },
  ],
  measurement: [
    { id: 'measurement', icon: Ruler, label: 'Linear', shortcut: 'D' },
    { id: 'areaMeasurement', icon: LayoutGrid, label: 'Area', shortcut: 'Shift+D' },
    { id: 'angleMeasurement', icon: Target, label: 'Angle', shortcut: 'Alt+D' },
    { id: 'dimension', icon: ScanLine, label: 'Dimension', shortcut: 'Ctrl+D' },
  ],
  utility: [
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'X' },
    { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
    { id: 'stamp', icon: Stamp, label: 'Stamp', shortcut: 'Shift+S' },
  ],
};

const PRESET_COLORS = [
  '#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00',
  '#ADFF2F', '#00FF00', '#00FA9A', '#00FFFF', '#1E90FF',
  '#0000FF', '#8A2BE2', '#FF00FF', '#FF1493', '#DC143C',
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
];

export function DrawingViewerClient({
  drawing,
  annotations: initialAnnotations,
  currentUser,
}: DrawingViewerClientProps) {
  const router = useRouter();
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [color, setColor] = useState("#FF0000");
  const [fillColor, _setFillColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [brushSettings, _setBrushSettings] = useState<BrushSettings>({
    size: 20,
    hardness: 100,
    opacity: 100,
    spacing: 25,
  });
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, _setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(
    drawing.revisions[0]?.id || ""
  );
  const [activeUsers, setActiveUsers] = useState<string[]>([currentUser.name]);
  const [collaboratorCursors, setCollaboratorCursors] = useState<CollaboratorCursor[]>([]);
  const [saving, setSaving] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontStyle, setFontStyle] = useState("normal");
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showToolSettings, _setShowToolSettings] = useState(true);
  const [stampType, setStampType] = useState('approved');
  const [showStampDialog, setShowStampDialog] = useState(false);
  const [stampPosition, setStampPosition] = useState<Point | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      // Update cursor position
      if (data.cursorPosition) {
        setCollaboratorCursors(prev => {
          const existing = prev.find(c => c.id === data.userId);
          if (existing) {
            return prev.map(c => c.id === data.userId ? { ...c, ...data.cursorPosition } : c);
          }
          return [...prev, {
            id: data.userId,
            name: data.userName,
            x: data.cursorPosition.x,
            y: data.cursorPosition.y,
            color: getRandomColor(),
          }];
        });
      }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Undo/Redo
      if (ctrl && key === 'z' && !shift) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((ctrl && key === 'y') || (ctrl && shift && key === 'z')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete
      if ((key === 'delete' || key === 'backspace') && selectedAnnotationId) {
        e.preventDefault();
        handleDeleteAnnotation(selectedAnnotationId);
        return;
      }

      // Tool shortcuts
      if (!ctrl && !alt) {
        switch (key) {
          case 'v': setSelectedTool('select'); break;
          case 'h': setSelectedTool('pan'); break;
          case 'p': setSelectedTool(shift ? 'polygon' : 'pen'); break;
          case 'b': setSelectedTool('brush'); break;
          case 'm': setSelectedTool('marker'); break;
          case 'g': setSelectedTool('highlighter'); break;
          case 'y': setSelectedTool('spray'); break;
          case 'l': setSelectedTool(shift ? 'leader' : 'line'); break;
          case 'a': setSelectedTool(shift ? 'doubleArrow' : 'arrow'); break;
          case 'r': setSelectedTool(shift ? 'filledRectangle' : 'rectangle'); break;
          case 'c': setSelectedTool(shift ? 'filledCircle' : 'circle'); break;
          case 'e': setSelectedTool('ellipse'); break;
          case 't': setSelectedTool('text'); break;
          case 's': setSelectedTool(shift ? 'stamp' : 'star'); break;
          case 'o': setSelectedTool(shift ? 'cloudRevision' : 'cloud'); break;
          case 'k': setSelectedTool(shift ? 'speechBubble' : 'callout'); break;
          case 'd': setSelectedTool('measurement'); break;
          case 'i': setSelectedTool('eyedropper'); break;
          case 'x': setSelectedTool(shift ? 'crosshatch' : 'eraser'); break;
          case '=': case '+': handleZoomIn(); break;
          case '-': handleZoomOut(); break;
          case '0': handleResetView(); break;
          case '[': setStrokeWidth(Math.max(1, strokeWidth - 1)); break;
          case ']': setStrokeWidth(Math.min(50, strokeWidth + 1)); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnnotationId, strokeWidth]);

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateCounterClockwise = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleResetView = () => {
    setZoom(100);
    setRotation(0);
    if (canvasRef.current) {
      canvasRef.current.resetView();
    }
  };

  const handleAnnotationComplete = async (annotationData: any) => {
    // Handle text input dialog
    if (annotationData.needsTextInput) {
      setTextPosition({ x: annotationData.x, y: annotationData.y });
      setShowTextDialog(true);
      return;
    }

    // Handle stamp placement
    if (selectedTool === 'stamp') {
      setStampPosition({ x: annotationData.data.x, y: annotationData.data.y });
      setShowStampDialog(true);
      return;
    }

    await saveAnnotation(annotationData);
  };

  const saveAnnotation = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/drawings/${drawing.id}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedTool,
          data,
          color,
          fillColor,
          strokeWidth,
          opacity,
          text: textInput || undefined,
          fontFamily,
          fontSize,
          fontStyle,
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

  const handleSaveText = async () => {
    if (!textPosition || !textInput.trim()) {
      setShowTextDialog(false);
      return;
    }

    await saveAnnotation({
      x: textPosition.x,
      y: textPosition.y,
    });

    setShowTextDialog(false);
    setTextInput("");
    setTextPosition(null);
  };

  const handleSaveStamp = async () => {
    if (!stampPosition) {
      setShowStampDialog(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/drawings/${drawing.id}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: 'stamp',
          data: {
            x: stampPosition.x,
            y: stampPosition.y,
            type: stampType,
            size: 50,
          },
          color: STAMP_TYPES.find(s => s.id === stampType)?.color || '#000000',
          strokeWidth: 3,
          opacity: 1,
        }),
      });
      if (!res.ok) throw new Error("Failed to save stamp");
      const newAnnotation = await res.json();
      setAnnotations((prev) => [newAnnotation, ...prev]);
      addToHistory({ type: "add", annotation: newAnnotation });
      toast.success("Stamp added");
    } catch (error) {
      toast.error("Failed to add stamp");
    } finally {
      setSaving(false);
      setShowStampDialog(false);
      setStampPosition(null);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const res = await fetch(`/api/drawings/${drawing.id}/annotations/${annotationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete annotation");
      const deleted = annotations.find(a => a.id === annotationId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
      addToHistory({ type: "delete", annotation: deleted });
      setSelectedAnnotationId(null);
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

  const handleToggleLock = (annotationId: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, locked: !a.locked } : a))
    );
  };

  const handleUndo = () => {
    if (historyIndex < 0) return;
    const action = history[historyIndex];
    if (action.type === 'add') {
      setAnnotations(prev => prev.filter(a => a.id !== action.annotation.id));
    } else if (action.type === 'delete') {
      setAnnotations(prev => [action.annotation, ...prev]);
    }
    setHistoryIndex(prev => prev - 1);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const action = history[historyIndex + 1];
    if (action.type === 'add') {
      setAnnotations(prev => [action.annotation, ...prev]);
    } else if (action.type === 'delete') {
      setAnnotations(prev => prev.filter(a => a.id !== action.annotation.id));
    }
    setHistoryIndex(prev => prev + 1);
  };

  const addToHistory = (action: any) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), action]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf' = 'png') => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.exportAsDataUrl(format === 'jpg' ? 'jpeg' : 'png');
      const link = document.createElement("a");
      link.download = `${drawing.number}-annotated.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success(`Drawing exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export drawing");
    }
  };

  const handleCursorMove = useCallback((position: Point) => {
    // Broadcast cursor position to other users
    fetch(`/api/drawings/${drawing.id}/presence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name,
        cursorPosition: position,
      }),
    }).catch(() => {});
  }, [drawing.id, currentUser.id, currentUser.name]);

  const handleAnnotationMove = (id: string, _delta: Point) => {
    // Update annotation position locally
    setAnnotations(prev => prev.map(a => {
      if (a.id !== id) return a;
      // This would need proper implementation based on annotation type
      return a;
    }));
  };

  const handleAnnotationResize = (_id: string, _bounds: any) => {
    // Update annotation bounds locally
  };

  const handleColorPick = (pickedColor: string) => {
    setColor(pickedColor);
    setSelectedTool('select');
    toast.success(`Color picked: ${pickedColor}`);
  };

  const selectedRevisionData = drawing.revisions.find(
    (r: any) => r.id === selectedRevision
  );

  const visibleAnnotations = showAnnotations
    ? annotations.filter((a) => a.visible !== false)
    : [];

  const renderToolButton = (tool: any, isActive: boolean) => (
    <TooltipProvider key={tool.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 w-9 p-0",
              isActive && "bg-primary text-primary-foreground shadow-md"
            )}
            onClick={() => setSelectedTool(tool.id as ToolType)}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{tool.label}</span>
          <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs">{tool.shortcut}</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-800 px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                {drawing.number}
              </span>
              <h1 className="font-semibold text-sm">{drawing.title}</h1>
              <Badge variant="outline" className="text-xs">{drawing.discipline}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {drawing.project.name} • Rev {drawing.currentRevision}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none h-8"
                    onClick={handleUndo}
                    disabled={historyIndex < 0}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="h-6 w-px bg-border" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none h-8"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Rotation */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="sm" className="h-8 rounded-none" onClick={handleRotateCounterClockwise}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2">{rotation}°</span>
            <Button variant="ghost" size="sm" className="h-8 rounded-none" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleResetView}>
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Active users */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {activeUsers.length}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Collaborating Now</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeUsers.map((user, idx) => (
                <DropdownMenuItem key={idx}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    {user}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('png')}>Export as PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('jpg')}>Export as JPG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {saving && (
            <Badge variant="secondary" className="animate-pulse">
              Saving...
            </Badge>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? 56 : 240 }}
          className="bg-white dark:bg-slate-800 border-r flex flex-col"
        >
          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="m-2 self-end"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>

          <ScrollArea className="flex-1">
            <div className={cn("p-2 space-y-4", sidebarCollapsed && "px-1")}>
              {/* Tool categories */}
              {Object.entries(TOOL_CATEGORIES).map(([category, tools]) => (
                <div key={category}>
                  {!sidebarCollapsed && (
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2 px-1">
                      {category}
                    </p>
                  )}
                  <div className={cn(
                    "grid gap-1",
                    sidebarCollapsed ? "grid-cols-1" : "grid-cols-4"
                  )}>
                    {tools.map((tool) => renderToolButton(tool, selectedTool === tool.id))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Tool settings at bottom */}
          {!sidebarCollapsed && showToolSettings && (
            <div className="border-t p-3 space-y-4">
              {/* Color picker */}
              <div>
                <Label className="text-xs">Stroke Color</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {PRESET_COLORS.slice(0, 14).map((c) => (
                    <button
                      key={c}
                      className={cn(
                        "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                        color === c ? "border-primary scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-5 h-5 rounded border-2 border-dashed border-muted-foreground/50"
                        style={{ background: `linear-gradient(135deg, red, yellow, green, blue, purple)` }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-32"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Stroke width */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Stroke Width</Label>
                  <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
                </div>
                <Slider
                  value={[strokeWidth]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={([v]) => setStrokeWidth(v)}
                  className="mt-1"
                />
              </div>

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Opacity</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setOpacity(v / 100)}
                  className="mt-1"
                />
              </div>

              {/* Grid settings */}
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Grid</Label>
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
              </div>
              {showGrid && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Snap to Grid</Label>
                  <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <AnnotationCanvas
            ref={canvasRef}
            imageUrl={selectedRevisionData?.fileUrl || drawing.fileUrl || ""}
            annotations={visibleAnnotations}
            selectedTool={selectedTool}
            color={color}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            brushSettings={brushSettings}
            zoom={zoom}
            rotation={rotation}
            showGrid={showGrid}
            gridSize={gridSize}
            snapToGrid={snapToGrid}
            selectedAnnotationId={selectedAnnotationId}
            collaboratorCursors={collaboratorCursors}
            onAnnotationComplete={handleAnnotationComplete}
            onAnnotationSelect={setSelectedAnnotationId}
            onAnnotationMove={handleAnnotationMove}
            onAnnotationResize={handleAnnotationResize}
            onColorPick={handleColorPick}
            onCursorMove={handleCursorMove}
          />

          {/* Selected tool indicator */}
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-medium capitalize">
                {selectedTool.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-xs text-muted-foreground">| {strokeWidth}px</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Layers & Annotations */}
        <AnimatePresence>
          {showLayersPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border-l overflow-hidden"
            >
              <Tabs defaultValue="annotations" className="h-full flex flex-col">
                <TabsList className="w-full rounded-none border-b">
                  <TabsTrigger value="annotations" className="flex-1">Annotations</TabsTrigger>
                  <TabsTrigger value="revisions" className="flex-1">Revisions</TabsTrigger>
                </TabsList>

                <TabsContent value="annotations" className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">
                          {annotations.length} Annotations
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAnnotations(!showAnnotations)}
                        >
                          {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      </div>

                      {annotations.map((annotation) => (
                        <Card
                          key={annotation.id}
                          className={cn(
                            "p-2 cursor-pointer transition-colors",
                            selectedAnnotationId === annotation.id && "ring-2 ring-primary",
                            !annotation.visible && "opacity-50"
                          )}
                          onClick={() => setSelectedAnnotationId(annotation.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: annotation.color }}
                              />
                              <span className="text-sm capitalize">
                                {annotation.type.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLock(annotation.id);
                                }}
                              >
                                {annotation.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAnnotationVisibility(annotation.id);
                                }}
                              >
                                {annotation.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnotation(annotation.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {annotation.text && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {annotation.text}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="revisions" className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                      {drawing.revisions.map((rev: any) => (
                        <Card
                          key={rev.id}
                          className={cn(
                            "p-3 cursor-pointer",
                            selectedRevision === rev.id && "ring-2 ring-primary"
                          )}
                          onClick={() => setSelectedRevision(rev.id)}
                        >
                          <div className="flex items-center justify-between">
                            <Badge>Rev {rev.revisionNumber}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(rev.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {rev.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {rev.description}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle layers panel button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={() => setShowLayersPanel(!showLayersPanel)}
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Input Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text Annotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Text</Label>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your text..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Family</Label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                  min={8}
                  max={72}
                />
              </div>
            </div>
            <div>
              <Label>Style</Label>
              <div className="flex gap-2 mt-1">
                {['normal', 'bold', 'italic', 'bold italic'].map(style => (
                  <Button
                    key={style}
                    variant={fontStyle === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFontStyle(style)}
                  >
                    {style === 'normal' ? 'Regular' : style}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTextDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveText}>Add Text</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stamp Dialog */}
      <Dialog open={showStampDialog} onOpenChange={setShowStampDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stamp</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {STAMP_TYPES.map(stamp => (
              <Card
                key={stamp.id}
                className={cn(
                  "p-4 cursor-pointer text-center transition-all hover:scale-105",
                  stampType === stamp.id && "ring-2 ring-primary"
                )}
                onClick={() => setStampType(stamp.id)}
              >
                <stamp.icon className="h-8 w-8 mx-auto mb-2" style={{ color: stamp.color }} />
                <span className="font-medium" style={{ color: stamp.color }}>
                  {stamp.label}
                </span>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStampDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveStamp}>Add Stamp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
