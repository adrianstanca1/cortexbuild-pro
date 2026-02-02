"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Loader2 } from "lucide-react";

interface Annotation {
  id: string;
  type: string;
  data: any;
  color: string;
  strokeWidth: number;
  text?: string;
  visible: boolean;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  selectedTool: string;
  color: string;
  strokeWidth: number;
  zoom: number;
  rotation: number;
  showGrid: boolean;
  onAnnotationComplete: (data: any) => void;
  onAnnotationSelect: (id: string | null) => void;
}

export const AnnotationCanvas = forwardRef<any, AnnotationCanvasProps>(
  (
    {
      imageUrl,
      annotations,
      selectedTool,
      color,
      strokeWidth,
      zoom,
      rotation,
      showGrid,
      onAnnotationComplete,
      onAnnotationSelect,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<any[]>([]);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const animationFrameRef = useRef<number>();

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
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
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Set canvas size to match container
      const resizeCanvas = () => {
        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
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
    }, [image, annotations, zoom, rotation, showGrid, panOffset]);

    // Render function - optimized for performance
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

      // Apply transformations
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom / 100, zoom / 100);

      // Draw grid if enabled
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height);
      }

      // Draw image
      if (image) {
        const imgWidth = image.width;
        const imgHeight = image.height;
        ctx.drawImage(image, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      }

      // Draw annotations
      annotations.forEach((annotation) => {
        if (!annotation.visible) return;
        drawAnnotation(ctx, annotation);
      });

      // Draw current path while drawing
      if (isDrawing && currentPath.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (selectedTool === "pen" || selectedTool === "highlighter") {
          ctx.globalAlpha = selectedTool === "highlighter" ? 0.4 : 1;
          ctx.beginPath();
          ctx.moveTo(currentPath[0].x, currentPath[0].y);
          for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (startPoint && currentPath.length > 0) {
          const endPoint = currentPath[currentPath.length - 1];
          drawShape(ctx, selectedTool, startPoint, endPoint, color, strokeWidth);
        }
      }

      // Restore context
      ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gridSize = 50 * (zoom / 100);
      ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const { type, data } = annotation;

      if (type === "pen" || type === "highlighter") {
        ctx.globalAlpha = type === "highlighter" ? 0.4 : 1;
        if (data.points && data.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(data.points[0].x, data.points[0].y);
          for (let i = 1; i < data.points.length; i++) {
            ctx.lineTo(data.points[i].x, data.points[i].y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (type === "line") {
        ctx.beginPath();
        ctx.moveTo(data.x1, data.y1);
        ctx.lineTo(data.x2, data.y2);
        ctx.stroke();
      } else if (type === "arrow") {
        drawArrow(ctx, data.x1, data.y1, data.x2, data.y2);
      } else if (type === "rectangle") {
        ctx.strokeRect(data.x, data.y, data.width, data.height);
      } else if (type === "circle") {
        ctx.beginPath();
        ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (type === "cloud") {
        drawCloud(ctx, data.x, data.y, data.width, data.height);
      } else if (type === "text") {
        ctx.font = `${annotation.strokeWidth * 6}px Arial`;
        ctx.fillText(annotation.text || "", data.x, data.y);
      } else if (type === "measurement") {
        drawMeasurement(ctx, data.x1, data.y1, data.x2, data.y2, data.distance);
      }
    };

    const drawShape = (
      ctx: CanvasRenderingContext2D,
      tool: string,
      start: { x: number; y: number },
      end: { x: number; y: number },
      color: string,
      width: number
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (tool === "arrow") {
        drawArrow(ctx, start.x, start.y, end.x, end.y);
      } else if (tool === "rectangle") {
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "cloud") {
        const width = end.x - start.x;
        const height = end.y - start.y;
        drawCloud(ctx, start.x, start.y, width, height);
      } else if (tool === "measurement") {
        const distance = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        drawMeasurement(ctx, start.x, start.y, end.x, end.y, distance);
      }
    };

    const drawArrow = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) => {
      const headLength = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    };

    const drawCloud = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const bumps = 8;
      const bumpSize = Math.min(Math.abs(width), Math.abs(height)) / 4;

      ctx.beginPath();
      for (let i = 0; i <= bumps; i++) {
        const angle = (i / bumps) * 2 * Math.PI;
        const bx = x + width / 2 + (width / 2) * Math.cos(angle);
        const by = y + height / 2 + (height / 2) * Math.sin(angle);
        const cx = bx + bumpSize * Math.cos(angle + Math.PI / 2);
        const cy = by + bumpSize * Math.sin(angle + Math.PI / 2);

        if (i === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.arc(cx, cy, bumpSize, angle - Math.PI / 2, angle + Math.PI / 2);
        }
      }
      ctx.stroke();
    };

    const drawMeasurement = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      distance: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw measurement text
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = "14px Arial";
      ctx.fillText(`${distance.toFixed(2)}`, midX, midY - 5);

      // Draw end marks
      const markLength = 10;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const perpAngle = angle + Math.PI / 2;

      [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((point) => {
        ctx.beginPath();
        ctx.moveTo(
          point.x + markLength * Math.cos(perpAngle),
          point.y + markLength * Math.sin(perpAngle)
        );
        ctx.lineTo(
          point.x - markLength * Math.cos(perpAngle),
          point.y - markLength * Math.sin(perpAngle)
        );
        ctx.stroke();
      });
    };

    // Transform screen coordinates to canvas coordinates
    const screenToCanvas = (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = screenX - rect.left;
      const y = screenY - rect.top;

      // Inverse transform
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = zoom / 100;

      const transformedX = (x - centerX - panOffset.x) / scale;
      const transformedY = (y - centerY - panOffset.y) / scale;

      // Apply inverse rotation
      const angle = (-rotation * Math.PI) / 180;
      const rotatedX =
        transformedX * Math.cos(angle) - transformedY * Math.sin(angle);
      const rotatedY =
        transformedX * Math.sin(angle) + transformedY * Math.cos(angle);

      return { x: rotatedX, y: rotatedY };
    };

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);

      if (selectedTool === "pan") {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (selectedTool === "select") {
        // Handle selection
        return;
      }

      setIsDrawing(true);
      setStartPoint(pos);

      if (selectedTool === "pen" || selectedTool === "highlighter") {
        setCurrentPath([pos]);
      } else {
        setCurrentPath([pos, pos]);
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (!isDrawing) return;

      const pos = screenToCanvas(e.clientX, e.clientY);

      if (selectedTool === "pen" || selectedTool === "highlighter") {
        setCurrentPath((prev) => [...prev, pos]);
        // Render immediately for smooth drawing
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        setCurrentPath([startPoint!, pos]);
        render();
      }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (!isDrawing) return;

      setIsDrawing(false);

      if (currentPath.length < 2) {
        setCurrentPath([]);
        return;
      }

      const pos = screenToCanvas(e.clientX, e.clientY);

      // Prepare annotation data based on tool
      let annotationData: any = {};

      if (selectedTool === "pen" || selectedTool === "highlighter") {
        annotationData = { points: currentPath };
      } else if (selectedTool === "line") {
        annotationData = { x1: startPoint!.x, y1: startPoint!.y, x2: pos.x, y2: pos.y };
      } else if (selectedTool === "arrow") {
        annotationData = { x1: startPoint!.x, y1: startPoint!.y, x2: pos.x, y2: pos.y };
      } else if (selectedTool === "rectangle") {
        annotationData = {
          x: startPoint!.x,
          y: startPoint!.y,
          width: pos.x - startPoint!.x,
          height: pos.y - startPoint!.y,
        };
      } else if (selectedTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPoint!.x, 2) + Math.pow(pos.y - startPoint!.y, 2)
        );
        annotationData = { x: startPoint!.x, y: startPoint!.y, radius };
      } else if (selectedTool === "cloud") {
        annotationData = {
          x: startPoint!.x,
          y: startPoint!.y,
          width: pos.x - startPoint!.x,
          height: pos.y - startPoint!.y,
        };
      } else if (selectedTool === "measurement") {
        const distance = Math.sqrt(
          Math.pow(pos.x - startPoint!.x, 2) + Math.pow(pos.y - startPoint!.y, 2)
        );
        annotationData = {
          x1: startPoint!.x,
          y1: startPoint!.y,
          x2: pos.x,
          y2: pos.y,
          distance,
        };
      } else if (selectedTool === "text") {
        annotationData = { x: pos.x, y: pos.y };
      }

      // Save annotation
      onAnnotationComplete(annotationData);

      // Clear current path
      setCurrentPath([]);
      setStartPoint(null);
    };

    const handleMouseLeave = () => {
      if (isPanning) {
        setIsPanning(false);
      }
    };

    // Touch support
    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleMouseDown({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as any);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as any);
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        handleMouseUp({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as any);
      }
    };

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative"
        style={{ cursor: selectedTool === "pan" ? "grab" : "crosshair" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading drawing...</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AnnotationCanvas.displayName = "AnnotationCanvas";
