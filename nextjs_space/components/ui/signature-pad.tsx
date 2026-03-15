"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  onSignature?: (signatureData: string) => void;
  onSave?: (signatureData: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export function SignaturePad({
  onSignature,
  onSave,
  onClear,
  width = 400,
  height = 150,
  className,
  disabled = false,
}: SignaturePadProps) {
  // Support both onSignature and onSave props
  const handleSignature = onSignature || onSave;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set up canvas
    context.strokeStyle = "#1a1a2e";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";

    // Fill with white background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    setCtx(context);
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !ctx) return;

    e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx || disabled) return;

    e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onClear?.();
  };

  const saveSignature = () => {
    if (!canvasRef.current || !hasSignature || !handleSignature) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    handleSignature(dataUrl);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={cn(
            "border-2 border-dashed border-border rounded-lg cursor-crosshair touch-none",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature || disabled}
        >
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={saveSignature}
          disabled={!hasSignature || disabled}
        >
          <Check className="h-4 w-4 mr-1" />
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}

// Display a saved signature
export function SignatureDisplay({
  signatureData,
  name,
  timestamp,
  className,
}: {
  signatureData: string;
  name?: string;
  timestamp?: Date | string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="border border-border rounded-lg bg-white p-2">
        <Image
          src={signatureData}
          alt={name ? `Signature of ${name}` : "Signature"}
          className="max-h-20 w-auto"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {name && <span className="font-medium">{name}</span>}
        {timestamp && (
          <span>
            {name && " • "}
            {new Date(timestamp).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
