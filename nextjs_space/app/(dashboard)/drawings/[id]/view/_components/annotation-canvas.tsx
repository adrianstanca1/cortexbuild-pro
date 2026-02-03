"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { Loader2 } from "lucide-react";

export interface Point {
  x: number;
  y: number;
}

export interface BrushSettings {
  size: number;
  hardness: number;
  opacity: number;
  spacing: number;
}

export interface Annotation {
  id: string;
  type: string;
  data: any;
  color: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  visible: boolean;
  locked?: boolean;
  layer?: number;
  transform?: {
    scaleX: number;
    scaleY: number;
    rotation: number;
    translateX: number;
    translateY: number;
  };
}

export type ToolType =
  | "select"
  | "pan"
  | "pen"
  | "brush"
  | "highlighter"
  | "marker"
  | "spray"
  | "eraser"
  | "text"
  | "line"
  | "arrow"
  | "doubleArrow"
  | "rectangle"
  | "filledRectangle"
  | "roundedRectangle"
  | "circle"
  | "filledCircle"
  | "ellipse"
  | "triangle"
  | "polygon"
  | "star"
  | "cloud"
  | "callout"
  | "speechBubble"
  | "measurement"
  | "areaMeasurement"
  | "angleMeasurement"
  | "stamp"
  | "fill"
  | "eyedropper"
  | "bezier"
  | "spline"
  | "freeformShape"
  | "dimension"
  | "leader"
  | "cloudRevision"
  | "crosshatch"
  | "gradient";

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  selectedTool: ToolType;
  color: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  brushSettings: BrushSettings;
  zoom: number;
  rotation: number;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  selectedAnnotationId: string | null;
  collaboratorCursors: Array<{ id: string; name: string; x: number; y: number; color: string }>;
  onAnnotationComplete: (data: any) => void;
  onAnnotationSelect: (id: string | null) => void;
  onAnnotationMove: (id: string, delta: Point) => void;
  onAnnotationResize: (id: string, bounds: any) => void;
  onColorPick: (color: string) => void;
  onCursorMove: (position: Point) => void;
}

export const AnnotationCanvas = forwardRef<any, AnnotationCanvasProps>(
  (
    {
      imageUrl,
      annotations,
      selectedTool,
      color,
      fillColor,
      strokeWidth,
      opacity,
      brushSettings,
      zoom,
      rotation,
      showGrid,
      gridSize,
      snapToGrid,
      selectedAnnotationId,
      collaboratorCursors,
      onAnnotationComplete,
      onAnnotationSelect,
      onAnnotationMove,
      _onAnnotationResize,
      onColorPick,
      onCursorMove,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Point[]>([]);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
    const [_bezierControlPoints, _setBezierControlPoints] = useState<Point[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
    const [_resizeHandle, _setResizeHandle] = useState<string | null>(null);
    const [hoverAnnotationId, setHoverAnnotationId] = useState<string | null>(null);
    const animationFrameRef = useRef<number>();
    const lastRenderTime = useRef<number>(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      exportAsDataUrl: (format: string = 'png') => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL(`image/${format}`);
      },
      resetView: () => {
        setPanOffset({ x: 0, y: 0 });
      },
    }));

    // Load image
    useEffect(() => {
      if (!imageUrl) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        setLoading(false);
      };
      img.onerror = () => {
        console.error("Failed to load image");
        setLoading(false);
      };
      img.src = imageUrl;
    }, [imageUrl]);

    // Setup canvas and render
    useEffect(() => {
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !overlay || !container) return;

      const resizeCanvas = () => {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        overlay.width = width;
        overlay.height = height;
        render();
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [image, annotations, zoom, rotation, showGrid, panOffset, selectedAnnotationId]);

    // Optimized render with requestAnimationFrame
    const render = useCallback(() => {
      const now = performance.now();
      if (now - lastRenderTime.current < 16) return; // Cap at 60fps
      lastRenderTime.current = now;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom / 100, zoom / 100);

      // Draw checkerboard background for transparency
      if (image) {
        drawCheckerboard(ctx, -image.width / 2, -image.height / 2, image.width, image.height);
      }

      // Draw grid
      if (showGrid && image) {
        drawGrid(ctx, -image.width / 2, -image.height / 2, image.width, image.height);
      }

      // Draw image
      if (image) {
        ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
      }

      // Draw annotations by layer
      const sortedAnnotations = [...annotations].sort((a, b) => (a.layer || 0) - (b.layer || 0));
      sortedAnnotations.forEach((annotation) => {
        if (!annotation.visible) return;
        drawAnnotation(ctx, annotation, annotation.id === selectedAnnotationId);
      });

      // Draw current drawing
      if (isDrawing && currentPath.length > 0) {
        drawCurrentPath(ctx);
      }

      // Draw polygon in progress
      if (polygonPoints.length > 0) {
        drawPolygonInProgress(ctx);
      }

      ctx.restore();

      // Render overlay (selection handles, cursors)
      renderOverlay();
    }, [image, annotations, zoom, rotation, showGrid, panOffset, isDrawing, currentPath, selectedAnnotationId, polygonPoints, color, strokeWidth, selectedTool, opacity]);

    useEffect(() => {
      render();
    }, [render]);

    const renderOverlay = () => {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;

      const ctx = overlay.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, overlay.width, overlay.height);

      // Draw selection handles
      if (selectedAnnotationId) {
        const _annotation = annotations.find(a => a.id === selectedAnnotationId);
        if (annotation && !annotation.locked) {
          drawSelectionHandles(ctx, annotation);
        }
      }

      // Draw collaborator cursors
      collaboratorCursors.forEach(cursor => {
        const screenPos = canvasToScreen(cursor.x, cursor.y);
        drawCollaboratorCursor(ctx, screenPos.x, screenPos.y, cursor.name, cursor.color);
      });
    };

    const drawCheckerboard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      const size = 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#e0e0e0';
      for (let i = 0; i < w / size; i++) {
        for (let j = 0; j < h / size; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(x + i * size, y + j * size, size, size);
          }
        }
      }
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      const step = gridSize;
      ctx.strokeStyle = "rgba(100, 100, 255, 0.3)";
      ctx.lineWidth = 0.5;

      for (let i = x; i <= x + w; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i, y + h);
        ctx.stroke();
      }

      for (let j = y; j <= y + h; j += step) {
        ctx.beginPath();
        ctx.moveTo(x, j);
        ctx.lineTo(x + w, j);
        ctx.stroke();
      }

      // Major grid lines
      ctx.strokeStyle = "rgba(100, 100, 255, 0.5)";
      ctx.lineWidth = 1;
      const majorStep = step * 5;

      for (let i = x; i <= x + w; i += majorStep) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i, y + h);
        ctx.stroke();
      }

      for (let j = y; j <= y + h; j += majorStep) {
        ctx.beginPath();
        ctx.moveTo(x, j);
        ctx.lineTo(x + w, j);
        ctx.stroke();
      }
    };

    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation, isSelected: boolean) => {
      ctx.save();
      ctx.globalAlpha = annotation.opacity ?? 1;
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.fillColor || annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Apply transform if exists
      if (annotation.transform) {
        const bounds = getAnnotationBounds(annotation);
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((annotation.transform.rotation * Math.PI) / 180);
        ctx.scale(annotation.transform.scaleX, annotation.transform.scaleY);
        ctx.translate(-cx, -cy);
      }

      const { type, data } = annotation;

      switch (type) {
        case "pen":
        case "brush":
          drawPenPath(ctx, data, annotation);
          break;
        case "highlighter":
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = annotation.strokeWidth * 3;
          drawPenPath(ctx, data, annotation);
          break;
        case "marker":
          ctx.lineWidth = annotation.strokeWidth * 2;
          drawPenPath(ctx, data, annotation);
          break;
        case "spray":
          drawSprayPath(ctx, data, annotation);
          break;
        case "line":
          drawLine(ctx, data);
          break;
        case "arrow":
          drawArrow(ctx, data.x1, data.y1, data.x2, data.y2, false);
          break;
        case "doubleArrow":
          drawArrow(ctx, data.x1, data.y1, data.x2, data.y2, true);
          break;
        case "rectangle":
          ctx.strokeRect(data.x, data.y, data.width, data.height);
          break;
        case "filledRectangle":
          ctx.fillRect(data.x, data.y, data.width, data.height);
          ctx.strokeRect(data.x, data.y, data.width, data.height);
          break;
        case "roundedRectangle":
          drawRoundedRect(ctx, data.x, data.y, data.width, data.height, data.radius || 10, false);
          break;
        case "circle":
          ctx.beginPath();
          ctx.arc(data.x, data.y, data.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "filledCircle":
          ctx.beginPath();
          ctx.arc(data.x, data.y, data.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case "ellipse":
          drawEllipse(ctx, data.x, data.y, data.rx, data.ry, false);
          break;
        case "triangle":
          drawTriangle(ctx, data, false);
          break;
        case "polygon":
          drawPolygon(ctx, data.points, false);
          break;
        case "star":
          drawStar(ctx, data.x, data.y, data.outerRadius, data.innerRadius, data.points || 5, false);
          break;
        case "cloud":
          drawCloud(ctx, data.x, data.y, data.width, data.height);
          break;
        case "cloudRevision":
          drawCloudRevision(ctx, data.points);
          break;
        case "callout":
          drawCallout(ctx, data, annotation.text || "");
          break;
        case "speechBubble":
          drawSpeechBubble(ctx, data, annotation.text || "");
          break;
        case "text":
          drawText(ctx, annotation);
          break;
        case "measurement":
          drawMeasurement(ctx, data.x1, data.y1, data.x2, data.y2, data.distance, data.unit);
          break;
        case "areaMeasurement":
          drawAreaMeasurement(ctx, data.points, data.area, data.unit);
          break;
        case "angleMeasurement":
          drawAngleMeasurement(ctx, data.p1, data.vertex, data.p2, data.angle);
          break;
        case "dimension":
          drawDimension(ctx, data);
          break;
        case "leader":
          drawLeader(ctx, data, annotation.text || "");
          break;
        case "bezier":
          drawBezierCurve(ctx, data.points);
          break;
        case "spline":
          drawSpline(ctx, data.points);
          break;
        case "crosshatch":
          drawCrosshatch(ctx, data);
          break;
        case "stamp":
          drawStamp(ctx, data);
          break;
      }

      // Draw selection outline
      if (isSelected) {
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const bounds = getAnnotationBounds(annotation);
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        ctx.setLineDash([]);
      }

      ctx.restore();
    };

    // Drawing helper functions
    const drawPenPath = (ctx: CanvasRenderingContext2D, data: any, _annotation: Annotation) => {
      if (!data.points || data.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(data.points[0].x, data.points[0].y);
      
      // Smooth curve through points using quadratic bezier
      for (let i = 1; i < data.points.length - 1; i++) {
        const xc = (data.points[i].x + data.points[i + 1].x) / 2;
        const yc = (data.points[i].y + data.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(data.points[i].x, data.points[i].y, xc, yc);
      }
      
      // Last point
      if (data.points.length > 1) {
        const last = data.points[data.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      
      ctx.stroke();
    };

    const drawSprayPath = (ctx: CanvasRenderingContext2D, data: any, _annotation: Annotation) => {
      if (!data.sprays) return;
      
      data.sprays.forEach((spray: { x: number; y: number; dots: Point[] }) => {
        spray.dots.forEach(dot => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    };

    const drawLine = (ctx: CanvasRenderingContext2D, data: any) => {
      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.stroke();
    };

    const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, double: boolean) => {
      const headLength = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // End arrowhead
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
      ctx.stroke();

      // Start arrowhead for double arrow
      if (double) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + headLength * Math.cos(angle - Math.PI / 6), y1 + headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + headLength * Math.cos(angle + Math.PI / 6), y1 + headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    };

    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, filled: boolean) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (filled) ctx.fill();
      ctx.stroke();
    };

    const drawEllipse = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, filled: boolean) => {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
      if (filled) ctx.fill();
      ctx.stroke();
    };

    const drawTriangle = (ctx: CanvasRenderingContext2D, data: any, filled: boolean) => {
      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.lineTo(data.x3, data.y3);
      ctx.closePath();
      if (filled) ctx.fill();
      ctx.stroke();
    };

    const drawPolygon = (ctx: CanvasRenderingContext2D, points: Point[], filled: boolean) => {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      if (filled) ctx.fill();
      ctx.stroke();
    };

    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number, filled: boolean) => {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (filled) ctx.fill();
      ctx.stroke();
    };

    const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      const bumps = Math.max(4, Math.floor(Math.min(Math.abs(w), Math.abs(h)) / 20));
      const bumpSize = Math.min(Math.abs(w), Math.abs(h)) / 4;

      ctx.beginPath();
      // Top bumps
      for (let i = 0; i < bumps; i++) {
        const bx = x + (w / bumps) * i + w / (bumps * 2);
        ctx.arc(bx, y, bumpSize, Math.PI, 0);
      }
      // Right bumps
      for (let i = 0; i < Math.floor(bumps / 2); i++) {
        const by = y + (h / (bumps / 2)) * i + h / bumps;
        ctx.arc(x + w, by, bumpSize, -Math.PI / 2, Math.PI / 2);
      }
      // Bottom bumps
      for (let i = bumps - 1; i >= 0; i--) {
        const bx = x + (w / bumps) * i + w / (bumps * 2);
        ctx.arc(bx, y + h, bumpSize, 0, Math.PI);
      }
      // Left bumps
      for (let i = Math.floor(bumps / 2) - 1; i >= 0; i--) {
        const by = y + (h / (bumps / 2)) * i + h / bumps;
        ctx.arc(x, by, bumpSize, Math.PI / 2, -Math.PI / 2);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const drawCloudRevision = (ctx: CanvasRenderingContext2D, points: Point[]) => {
      if (points.length < 2) return;
      const bumpSize = 8;
      
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const bumps = Math.max(2, Math.floor(dist / (bumpSize * 2)));
        
        for (let j = 0; j < bumps; j++) {
          const t = j / bumps;
          const cx = p1.x + (p2.x - p1.x) * t + (p2.x - p1.x) / (bumps * 2);
          const cy = p1.y + (p2.y - p1.y) * t + (p2.y - p1.y) / (bumps * 2);
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2;
          ctx.arc(cx, cy, bumpSize, angle, angle + Math.PI);
        }
      }
      ctx.stroke();
    };

    const drawCallout = (ctx: CanvasRenderingContext2D, data: any, text: string) => {
      const { x, y, width, height, pointerX, pointerY } = data;
      const r = 8;

      // Draw rounded rectangle
      drawRoundedRect(ctx, x, y, width, height, r, true);

      // Draw pointer
      ctx.beginPath();
      ctx.moveTo(x + width / 2 - 10, y + height);
      ctx.lineTo(pointerX, pointerY);
      ctx.lineTo(x + width / 2 + 10, y + height);
      ctx.fill();
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + width / 2, y + height / 2);
    };

    const drawSpeechBubble = (ctx: CanvasRenderingContext2D, data: any, text: string) => {
      const { x, y, width, height, tailX, tailY } = data;
      const r = 15;

      ctx.fillStyle = '#ffffff';
      
      // Main bubble
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      
      // Tail
      ctx.lineTo(x + width * 0.4, y + height);
      ctx.lineTo(tailX, tailY);
      ctx.lineTo(x + width * 0.2, y + height);
      
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const lines = text.split('\n');
      const lineHeight = 18;
      const startY = y + height / 2 - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, x + width / 2, startY + i * lineHeight);
      });
    };

    const drawText = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
      const { data, text, fontFamily = 'Arial', fontSize = 16, fontStyle = 'normal' } = annotation;
      ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = annotation.color;
      ctx.textBaseline = 'top';
      
      const lines = (text || '').split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, data.x, data.y + i * (fontSize * 1.2));
      });
    };

    const drawMeasurement = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, distance: number, unit: string = 'px') => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const perpAngle = angle + Math.PI / 2;
      const offset = 20;

      // Offset line
      const ox1 = x1 + offset * Math.cos(perpAngle);
      const oy1 = y1 + offset * Math.sin(perpAngle);
      const ox2 = x2 + offset * Math.cos(perpAngle);
      const oy2 = y2 + offset * Math.sin(perpAngle);

      // Extension lines
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(ox1 + 5 * Math.cos(perpAngle), oy1 + 5 * Math.sin(perpAngle));
      ctx.moveTo(x2, y2);
      ctx.lineTo(ox2 + 5 * Math.cos(perpAngle), oy2 + 5 * Math.sin(perpAngle));
      ctx.stroke();

      // Dimension line with arrows
      drawArrow(ctx, ox1, oy1, ox2, oy2, true);

      // Text
      const midX = (ox1 + ox2) / 2;
      const midY = (oy1 + oy2) / 2;
      
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-30, -12, 60, 20);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${distance.toFixed(2)} ${unit}`, 0, 0);
      ctx.restore();
    };

    const drawAreaMeasurement = (ctx: CanvasRenderingContext2D, points: Point[], area: number, unit: string = 'px²') => {
      if (points.length < 3) return;

      // Draw polygon
      ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw area text at centroid
      const centroid = points.reduce((acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }), { x: 0, y: 0 });
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centroid.x - 40, centroid.y - 12, 80, 24);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${area.toFixed(2)} ${unit}`, centroid.x, centroid.y);
    };

    const drawAngleMeasurement = (ctx: CanvasRenderingContext2D, p1: Point, vertex: Point, p2: Point, angle: number) => {
      // Draw lines
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(vertex.x, vertex.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Draw arc
      const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
      const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
      const radius = 30;

      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, radius, angle1, angle2);
      ctx.stroke();

      // Draw angle text
      const midAngle = (angle1 + angle2) / 2;
      const textX = vertex.x + (radius + 15) * Math.cos(midAngle);
      const textY = vertex.y + (radius + 15) * Math.sin(midAngle);

      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${angle.toFixed(1)}°`, textX, textY);
    };

    const drawDimension = (ctx: CanvasRenderingContext2D, data: any) => {
      const { x1, y1, x2, y2, text, offset = 30 } = data;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const perpAngle = angle + Math.PI / 2;

      // Calculate offset points
      const ox1 = x1 + offset * Math.cos(perpAngle);
      const oy1 = y1 + offset * Math.sin(perpAngle);
      const ox2 = x2 + offset * Math.cos(perpAngle);
      const oy2 = y2 + offset * Math.sin(perpAngle);

      // Extension lines
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(ox1, oy1);
      ctx.moveTo(x2, y2);
      ctx.lineTo(ox2, oy2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dimension line
      ctx.beginPath();
      ctx.moveTo(ox1, oy1);
      ctx.lineTo(ox2, oy2);
      ctx.stroke();

      // Tick marks
      const tickSize = 6;
      [{ x: ox1, y: oy1 }, { x: ox2, y: oy2 }].forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x - tickSize * Math.cos(angle + Math.PI / 4), p.y - tickSize * Math.sin(angle + Math.PI / 4));
        ctx.lineTo(p.x + tickSize * Math.cos(angle + Math.PI / 4), p.y + tickSize * Math.sin(angle + Math.PI / 4));
        ctx.stroke();
      });

      // Text
      const midX = (ox1 + ox2) / 2;
      const midY = (oy1 + oy2) / 2;
      ctx.save();
      ctx.translate(midX, midY);
      let textAngle = angle;
      if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) textAngle += Math.PI;
      ctx.rotate(textAngle);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-25, -10, 50, 20);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text || '', 0, 0);
      ctx.restore();
    };

    const drawLeader = (ctx: CanvasRenderingContext2D, data: any, text: string) => {
      const { points, landingLength = 20 } = data;
      if (points.length < 2) return;

      // Draw leader line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      // Landing line
      const last = points[points.length - 1];
      const prev = points[points.length - 2] || points[0];
      const direction = last.x > prev.x ? 1 : -1;
      ctx.lineTo(last.x + landingLength * direction, last.y);
      ctx.stroke();

      // Arrowhead at start
      const arrowAngle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
      const headLength = 10;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[0].x + headLength * Math.cos(arrowAngle - Math.PI / 6), points[0].y + headLength * Math.sin(arrowAngle - Math.PI / 6));
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[0].x + headLength * Math.cos(arrowAngle + Math.PI / 6), points[0].y + headLength * Math.sin(arrowAngle + Math.PI / 6));
      ctx.stroke();

      // Text
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '12px Arial';
      ctx.textAlign = direction > 0 ? 'left' : 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, last.x + landingLength * direction + 5 * direction, last.y - 2);
    };

    const drawBezierCurve = (ctx: CanvasRenderingContext2D, points: Point[]) => {
      if (points.length < 4) return;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length - 2; i += 3) {
        ctx.bezierCurveTo(
          points[i].x, points[i].y,
          points[i + 1].x, points[i + 1].y,
          points[i + 2].x, points[i + 2].y
        );
      }
      
      ctx.stroke();
    };

    const drawSpline = (ctx: CanvasRenderingContext2D, points: Point[]) => {
      if (points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        for (let t = 0; t <= 1; t += 0.1) {
          const t2 = t * t;
          const t3 = t2 * t;
          
          const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
          const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
          
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    };

    const drawCrosshatch = (ctx: CanvasRenderingContext2D, data: any) => {
      const { x, y, width, height, angle = 45, spacing = 10 } = data;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      
      const rad = (angle * Math.PI) / 180;
      const diagLength = Math.sqrt(width * width + height * height);
      
      for (let d = -diagLength; d < diagLength * 2; d += spacing) {
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x + d + diagLength * Math.cos(rad), y + diagLength * Math.sin(rad));
        ctx.stroke();
      }
      
      ctx.restore();
      ctx.strokeRect(x, y, width, height);
    };

    const drawStamp = (ctx: CanvasRenderingContext2D, data: any) => {
      const { x, y, type, size = 50 } = data;
      
      ctx.save();
      ctx.translate(x, y);
      
      switch (type) {
        case 'approved':
          ctx.strokeStyle = '#22c55e';
          ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#22c55e';
          ctx.font = `bold ${size / 3}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('APPROVED', 0, 0);
          break;
        case 'rejected':
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ef4444';
          ctx.font = `bold ${size / 3}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('REJECTED', 0, 0);
          break;
        case 'revised':
          ctx.strokeStyle = '#f59e0b';
          ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
          ctx.lineWidth = 3;
          ctx.strokeRect(-size, -size / 2, size * 2, size);
          ctx.fillRect(-size, -size / 2, size * 2, size);
          ctx.fillStyle = '#f59e0b';
          ctx.font = `bold ${size / 3}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('REVISED', 0, 0);
          break;
        case 'draft':
          ctx.strokeStyle = '#6b7280';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.strokeRect(-size, -size / 2, size * 2, size);
          ctx.setLineDash([]);
          ctx.fillStyle = '#6b7280';
          ctx.font = `bold ${size / 3}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('DRAFT', 0, 0);
          break;
        case 'forReview':
          ctx.strokeStyle = '#3b82f6';
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-size, 0);
          ctx.lineTo(0, -size / 2);
          ctx.lineTo(size, 0);
          ctx.lineTo(0, size / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#3b82f6';
          ctx.font = `bold ${size / 4}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('FOR REVIEW', 0, 0);
          break;
      }
      
      ctx.restore();
    };

    const drawCurrentPath = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = opacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (selectedTool === "pen" || selectedTool === "brush" || selectedTool === "marker") {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length - 1; i++) {
          const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
          const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
          ctx.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
        }
        if (currentPath.length > 1) {
          ctx.lineTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
        }
        ctx.stroke();
      } else if (selectedTool === "highlighter") {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = strokeWidth * 3;
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      } else if (startPoint && currentPath.length > 0) {
        const endPoint = currentPath[currentPath.length - 1];
        drawCurrentShape(ctx, startPoint, endPoint);
      }

      ctx.globalAlpha = 1;
    };

    const drawCurrentShape = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
      const width = end.x - start.x;
      const height = end.y - start.y;

      switch (selectedTool) {
        case "line":
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;
        case "arrow":
          drawArrow(ctx, start.x, start.y, end.x, end.y, false);
          break;
        case "doubleArrow":
          drawArrow(ctx, start.x, start.y, end.x, end.y, true);
          break;
        case "rectangle":
          ctx.strokeRect(start.x, start.y, width, height);
          break;
        case "filledRectangle":
          ctx.fillRect(start.x, start.y, width, height);
          ctx.strokeRect(start.x, start.y, width, height);
          break;
        case "roundedRectangle":
          drawRoundedRect(ctx, start.x, start.y, width, height, 10, false);
          break;
        case "circle":
        case "filledCircle":
          const radius = Math.sqrt(width * width + height * height);
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
          if (selectedTool === "filledCircle") ctx.fill();
          ctx.stroke();
          break;
        case "ellipse":
          drawEllipse(ctx, start.x + width / 2, start.y + height / 2, Math.abs(width / 2), Math.abs(height / 2), false);
          break;
        case "triangle":
          ctx.beginPath();
          ctx.moveTo(start.x + width / 2, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(start.x, end.y);
          ctx.closePath();
          ctx.stroke();
          break;
        case "cloud":
          drawCloud(ctx, start.x, start.y, width, height);
          break;
        case "measurement":
          const dist = Math.sqrt(width * width + height * height);
          drawMeasurement(ctx, start.x, start.y, end.x, end.y, dist, 'px');
          break;
        case "crosshatch":
          drawCrosshatch(ctx, { x: start.x, y: start.y, width, height });
          break;
      }
    };

    const drawPolygonInProgress = (ctx: CanvasRenderingContext2D) => {
      if (polygonPoints.length === 0) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      ctx.stroke();

      // Draw points
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      polygonPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawSelectionHandles = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
      const bounds = getAnnotationBounds(annotation);
      const screenBounds = {
        x: canvasToScreen(bounds.x, bounds.y).x,
        y: canvasToScreen(bounds.x, bounds.y).y,
        width: bounds.width * (zoom / 100),
        height: bounds.height * (zoom / 100),
      };

      const handleSize = 8;
      const handles = [
        { x: screenBounds.x - 5, y: screenBounds.y - 5, cursor: 'nw-resize' },
        { x: screenBounds.x + screenBounds.width / 2, y: screenBounds.y - 5, cursor: 'n-resize' },
        { x: screenBounds.x + screenBounds.width + 5, y: screenBounds.y - 5, cursor: 'ne-resize' },
        { x: screenBounds.x + screenBounds.width + 5, y: screenBounds.y + screenBounds.height / 2, cursor: 'e-resize' },
        { x: screenBounds.x + screenBounds.width + 5, y: screenBounds.y + screenBounds.height + 5, cursor: 'se-resize' },
        { x: screenBounds.x + screenBounds.width / 2, y: screenBounds.y + screenBounds.height + 5, cursor: 's-resize' },
        { x: screenBounds.x - 5, y: screenBounds.y + screenBounds.height + 5, cursor: 'sw-resize' },
        { x: screenBounds.x - 5, y: screenBounds.y + screenBounds.height / 2, cursor: 'w-resize' },
      ];

      handles.forEach(handle => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });

      // Rotation handle
      ctx.beginPath();
      ctx.arc(screenBounds.x + screenBounds.width / 2, screenBounds.y - 25, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screenBounds.x + screenBounds.width / 2, screenBounds.y - 19);
      ctx.lineTo(screenBounds.x + screenBounds.width / 2, screenBounds.y - 5);
      ctx.stroke();
    };

    const drawCollaboratorCursor = (ctx: CanvasRenderingContext2D, x: number, y: number, name: string, cursorColor: string) => {
      // Cursor arrow
      ctx.fillStyle = cursorColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 18);
      ctx.lineTo(x + 5, y + 14);
      ctx.lineTo(x + 10, y + 20);
      ctx.lineTo(x + 12, y + 18);
      ctx.lineTo(x + 7, y + 12);
      ctx.lineTo(x + 12, y + 10);
      ctx.closePath();
      ctx.fill();

      // Name tag
      ctx.font = '11px Arial';
      const textWidth = ctx.measureText(name).width;
      ctx.fillStyle = cursorColor;
      ctx.fillRect(x + 14, y + 10, textWidth + 8, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, x + 18, y + 22);
    };

    const getAnnotationBounds = (annotation: Annotation): { x: number; y: number; width: number; height: number } => {
      const { type, data } = annotation;

      switch (type) {
        case "pen":
        case "brush":
        case "highlighter":
        case "marker":
        case "spray":
          if (!data.points || data.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
          const xs = data.points.map((p: Point) => p.x);
          const ys = data.points.map((p: Point) => p.y);
          return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          };
        case "line":
        case "arrow":
        case "doubleArrow":
        case "measurement":
          return {
            x: Math.min(data.x1, data.x2),
            y: Math.min(data.y1, data.y2),
            width: Math.abs(data.x2 - data.x1),
            height: Math.abs(data.y2 - data.y1),
          };
        case "rectangle":
        case "filledRectangle":
        case "roundedRectangle":
        case "cloud":
        case "crosshatch":
          return { x: data.x, y: data.y, width: data.width, height: data.height };
        case "circle":
        case "filledCircle":
          return {
            x: data.x - data.radius,
            y: data.y - data.radius,
            width: data.radius * 2,
            height: data.radius * 2,
          };
        case "ellipse":
          return {
            x: data.x - data.rx,
            y: data.y - data.ry,
            width: data.rx * 2,
            height: data.ry * 2,
          };
        case "text":
          return { x: data.x, y: data.y, width: 100, height: 30 };
        case "polygon":
        case "areaMeasurement":
        case "cloudRevision":
          if (!data.points || data.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
          const pxs = data.points.map((p: Point) => p.x);
          const pys = data.points.map((p: Point) => p.y);
          return {
            x: Math.min(...pxs),
            y: Math.min(...pys),
            width: Math.max(...pxs) - Math.min(...pxs),
            height: Math.max(...pys) - Math.min(...pys),
          };
        case "stamp":
          const size = data.size || 50;
          return { x: data.x - size, y: data.y - size, width: size * 2, height: size * 2 };
        default:
          return { x: 0, y: 0, width: 0, height: 0 };
      }
    };

    // Coordinate transformations
    const screenToCanvas = (screenX: number, screenY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = screenX - rect.left;
      const y = screenY - rect.top;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = zoom / 100;

      const transformedX = (x - centerX - panOffset.x) / scale;
      const transformedY = (y - centerY - panOffset.y) / scale;

      const angle = (-rotation * Math.PI) / 180;
      const rotatedX = transformedX * Math.cos(angle) - transformedY * Math.sin(angle);
      const rotatedY = transformedX * Math.sin(angle) + transformedY * Math.cos(angle);

      return snapToGrid ? snapPoint({ x: rotatedX, y: rotatedY }) : { x: rotatedX, y: rotatedY };
    };

    const canvasToScreen = (canvasX: number, canvasY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const scale = zoom / 100;
      const angle = (rotation * Math.PI) / 180;

      const rotatedX = canvasX * Math.cos(angle) - canvasY * Math.sin(angle);
      const rotatedY = canvasX * Math.sin(angle) + canvasY * Math.cos(angle);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      return {
        x: rotatedX * scale + centerX + panOffset.x,
        y: rotatedY * scale + centerY + panOffset.y,
      };
    };

    const snapPoint = (point: Point): Point => {
      if (!snapToGrid) return point;
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      };
    };

    // Event handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);

      if (selectedTool === "pan" || e.button === 1) {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (selectedTool === "select") {
        // Check if clicking on an annotation
        const clickedAnnotation = findAnnotationAtPoint(pos);
        if (clickedAnnotation) {
          onAnnotationSelect(clickedAnnotation.id);
          if (!clickedAnnotation.locked) {
            setIsDragging(true);
            const bounds = getAnnotationBounds(clickedAnnotation);
            setDragOffset({ x: pos.x - bounds.x, y: pos.y - bounds.y });
          }
        } else {
          onAnnotationSelect(null);
        }
        return;
      }

      if (selectedTool === "eyedropper") {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
            onColorPick(hex);
          }
        }
        return;
      }

      if (selectedTool === "polygon" || selectedTool === "areaMeasurement" || selectedTool === "cloudRevision") {
        setPolygonPoints(prev => [...prev, pos]);
        return;
      }

      if (selectedTool === "stamp") {
        onAnnotationComplete({
          type: "stamp",
          data: { x: pos.x, y: pos.y, type: 'approved', size: 50 },
        });
        return;
      }

      setIsDrawing(true);
      setStartPoint(pos);
      setCurrentPath([pos]);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);
      onCursorMove(pos);

      if (isPanning) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (isDragging && selectedAnnotationId) {
        const bounds = getAnnotationBounds(annotations.find(a => a.id === selectedAnnotationId)!);
        onAnnotationMove(selectedAnnotationId, { x: pos.x - dragOffset.x - bounds.x, y: pos.y - dragOffset.y - bounds.y });
        return;
      }

      if (!isDrawing) {
        // Hover detection
        const hoveredAnnotation = findAnnotationAtPoint(pos);
        setHoverAnnotationId(hoveredAnnotation?.id || null);
        return;
      }

      if (selectedTool === "spray") {
        // Generate spray dots
        const dots: Point[] = [];
        for (let i = 0; i < brushSettings.size; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * brushSettings.size;
          dots.push({
            x: pos.x + radius * Math.cos(angle),
            y: pos.y + radius * Math.sin(angle),
          });
        }
        setCurrentPath(prev => [...prev, { x: pos.x, y: pos.y, dots }]);
      } else {
        setCurrentPath(prev => [...prev, pos]);
      }

      render();
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (isDragging) {
        setIsDragging(false);
        return;
      }

      if (!isDrawing) return;

      setIsDrawing(false);
      const endPoint = screenToCanvas(e.clientX, e.clientY);

      if (currentPath.length < 2 && !["stamp", "text"].includes(selectedTool)) {
        setCurrentPath([]);
        setStartPoint(null);
        return;
      }

      // Create annotation data based on tool
      let annotationData: any = null;

      switch (selectedTool) {
        case "pen":
        case "brush":
        case "marker":
        case "highlighter":
          annotationData = { points: currentPath };
          break;
        case "spray":
          annotationData = { sprays: currentPath };
          break;
        case "line":
          annotationData = { x1: startPoint!.x, y1: startPoint!.y, x2: endPoint.x, y2: endPoint.y };
          break;
        case "arrow":
        case "doubleArrow":
          annotationData = { x1: startPoint!.x, y1: startPoint!.y, x2: endPoint.x, y2: endPoint.y };
          break;
        case "rectangle":
        case "filledRectangle":
        case "roundedRectangle":
          annotationData = {
            x: Math.min(startPoint!.x, endPoint.x),
            y: Math.min(startPoint!.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint!.x),
            height: Math.abs(endPoint.y - startPoint!.y),
            radius: 10,
          };
          break;
        case "circle":
        case "filledCircle":
          const radius = Math.sqrt(
            Math.pow(endPoint.x - startPoint!.x, 2) + Math.pow(endPoint.y - startPoint!.y, 2)
          );
          annotationData = { x: startPoint!.x, y: startPoint!.y, radius };
          break;
        case "ellipse":
          annotationData = {
            x: (startPoint!.x + endPoint.x) / 2,
            y: (startPoint!.y + endPoint.y) / 2,
            rx: Math.abs(endPoint.x - startPoint!.x) / 2,
            ry: Math.abs(endPoint.y - startPoint!.y) / 2,
          };
          break;
        case "triangle":
          annotationData = {
            x1: (startPoint!.x + endPoint.x) / 2,
            y1: startPoint!.y,
            x2: endPoint.x,
            y2: endPoint.y,
            x3: startPoint!.x,
            y3: endPoint.y,
          };
          break;
        case "cloud":
          annotationData = {
            x: Math.min(startPoint!.x, endPoint.x),
            y: Math.min(startPoint!.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint!.x),
            height: Math.abs(endPoint.y - startPoint!.y),
          };
          break;
        case "measurement":
          const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint!.x, 2) + Math.pow(endPoint.y - startPoint!.y, 2)
          );
          annotationData = {
            x1: startPoint!.x,
            y1: startPoint!.y,
            x2: endPoint.x,
            y2: endPoint.y,
            distance,
            unit: 'px',
          };
          break;
        case "crosshatch":
          annotationData = {
            x: Math.min(startPoint!.x, endPoint.x),
            y: Math.min(startPoint!.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint!.x),
            height: Math.abs(endPoint.y - startPoint!.y),
          };
          break;
      }

      if (annotationData) {
        onAnnotationComplete(annotationData);
      }

      setCurrentPath([]);
      setStartPoint(null);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);

      if (selectedTool === "polygon" || selectedTool === "cloudRevision") {
        if (polygonPoints.length >= 3) {
          onAnnotationComplete({
            points: polygonPoints,
          });
        }
        setPolygonPoints([]);
        return;
      }

      if (selectedTool === "areaMeasurement") {
        if (polygonPoints.length >= 3) {
          // Calculate area using shoelace formula
          let area = 0;
          for (let i = 0; i < polygonPoints.length; i++) {
            const j = (i + 1) % polygonPoints.length;
            area += polygonPoints[i].x * polygonPoints[j].y;
            area -= polygonPoints[j].x * polygonPoints[i].y;
          }
          area = Math.abs(area) / 2;

          onAnnotationComplete({
            points: polygonPoints,
            area,
            unit: 'px²',
          });
        }
        setPolygonPoints([]);
        return;
      }

      if (selectedTool === "text") {
        onAnnotationComplete({
          x: pos.x,
          y: pos.y,
          needsTextInput: true,
        });
      }
    };

    const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        const _newZoom = Math.max(25, Math.min(400, zoom + delta));
        // Zoom toward cursor position (not implemented yet)
      } else {
        setPanOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setPolygonPoints([]);
        setCurrentPath([]);
        setIsDrawing(false);
        onAnnotationSelect(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAnnotationId) {
          // Parent will handle deletion
        }
      }
    };

    const findAnnotationAtPoint = (point: Point): Annotation | null => {
      // Search in reverse order (top to bottom)
      for (let i = annotations.length - 1; i >= 0; i--) {
        const _annotation = annotations[i];
        if (!annotation.visible) continue;
        const bounds = getAnnotationBounds(annotation);
        if (
          point.x >= bounds.x - 5 &&
          point.x <= bounds.x + bounds.width + 5 &&
          point.y >= bounds.y - 5 &&
          point.y <= bounds.y + bounds.height + 5
        ) {
          return annotation;
        }
      }
      return null;
    };

    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-200 dark:bg-slate-800"
        style={{ cursor: getCursor(selectedTool, isDrawing, isPanning, isDragging, hoverAnnotationId) }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    );
  }
);

AnnotationCanvas.displayName = "AnnotationCanvas";

function getCursor(
  tool: ToolType,
  isDrawing: boolean,
  isPanning: boolean,
  isDragging: boolean,
  hoverAnnotationId: string | null
): string {
  if (isPanning) return "grabbing";
  if (isDragging) return "move";
  if (hoverAnnotationId && tool === "select") return "pointer";

  switch (tool) {
    case "select":
      return "default";
    case "pan":
      return "grab";
    case "pen":
    case "brush":
    case "marker":
      return "crosshair";
    case "highlighter":
      return "crosshair";
    case "spray":
      return "crosshair";
    case "eraser":
      return "crosshair";
    case "text":
      return "text";
    case "eyedropper":
      return "crosshair";
    default:
      return "crosshair";
  }
}
