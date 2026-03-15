"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  Grid3X3,
  LayoutGrid,
  Camera,
  FileText,
  Shield,
  CheckSquare,
  ClipboardCheck,
  Calendar,
  Filter,
  Search,
  Loader2,
  ImageOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

type PhotoSource =
  | "daily_report"
  | "safety_incident"
  | "punch_list"
  | "inspection"
  | "document";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  source: PhotoSource;
  sourceId: string;
  sourceTitle: string;
  createdAt: string | Date;
  mimeType?: string;
  fileSize?: number;
}

interface PhotoGalleryProps {
  projectId: string;
  initialPhotos?: GalleryPhoto[];
  onPhotoClick?: (photo: GalleryPhoto) => void;
}

const sourceConfig: Record<
  PhotoSource,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  daily_report: {
    label: "Daily Report",
    icon: Calendar,
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  safety_incident: {
    label: "Safety",
    icon: Shield,
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
  punch_list: {
    label: "Punch List",
    icon: CheckSquare,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  inspection: {
    label: "Inspection",
    icon: ClipboardCheck,
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  document: {
    label: "Document",
    icon: FileText,
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
};

export function PhotoGallery({
  projectId,
  initialPhotos,
  onPhotoClick,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos || []);
  const [loading, setLoading] = useState(!initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid");
  const [sourceFilter, setSourceFilter] = useState<PhotoSource | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const lightboxRef = useRef<HTMLDivElement>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const source = sourceFilter !== "all" ? `&source=${sourceFilter}` : "";
      // Reduced limit from 200 to 50 for better performance
      // Consider implementing pagination or infinite scroll for larger galleries
      const res = await fetch(
        `/api/projects/${projectId}/gallery?limit=50${source}`,
      );
      if (!res.ok) throw new Error("Failed to fetch photos");
      const data = await res.json();
      setPhotos(data.photos || []);
      setCounts(data.counts || {});
    } catch (error) {
      console.error("Error fetching gallery photos:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, sourceFilter]);

  useEffect(() => {
    if (!initialPhotos) {
      fetchPhotos();
    }
  }, [fetchPhotos, initialPhotos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;

      switch (e.key) {
        case "Escape":
          closeViewer();
          break;
        case "ArrowLeft":
          navigatePrev();
          break;
        case "ArrowRight":
          navigateNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "r":
          handleRotate();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoto, currentIndex]);

  const filteredPhotos = photos.filter((photo) => {
    if (sourceFilter !== "all" && photo.source !== sourceFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        photo.sourceTitle.toLowerCase().includes(query) ||
        photo.caption?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openViewer = (photo: GalleryPhoto, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    setZoom(100);
    setRotation(0);
    onPhotoClick?.(photo);
  };

  const closeViewer = () => {
    setSelectedPhoto(null);
    setZoom(100);
    setRotation(0);
    setIsFullscreen(false);
  };

  const navigatePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
      setZoom(100);
      setRotation(0);
    }
  };

  const navigateNext = () => {
    if (currentIndex < filteredPhotos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
      setZoom(100);
      setRotation(0);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = async (photo: GalleryPhoto) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.sourceTitle.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      lightboxRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleImageError = (photoId: string) => {
    setImageErrors((prev) => new Set(prev).add(photoId));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "#6366f1" }}
        />
        <span className="ml-3" style={{ color: "#64748b" }}>
          Loading gallery...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#e0e7ff" }}
          >
            <Camera className="h-5 w-5" style={{ color: "#4f46e5" }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
              Photo Gallery
            </h3>
            <p className="text-sm" style={{ color: "#64748b" }}>
              {counts.total || photos.length} photos from all sources
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "#9ca3af" }}
            />
            <Input
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48"
            />
          </div>

          {/* Source Filter */}
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as PhotoSource | "all")}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Sources ({counts.total || 0})
              </SelectItem>
              <SelectItem value="daily_report">
                Daily Reports ({counts.daily_report || 0})
              </SelectItem>
              <SelectItem value="safety_incident">
                Safety ({counts.safety_incident || 0})
              </SelectItem>
              <SelectItem value="punch_list">
                Punch Lists ({counts.punch_list || 0})
              </SelectItem>
              <SelectItem value="inspection">
                Inspections ({counts.inspection || 0})
              </SelectItem>
              <SelectItem value="document">
                Documents ({counts.document || 0})
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div
            className="flex rounded-lg border"
            style={{ borderColor: "#e2e8f0" }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-gray-100" : ""}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("masonry")}
              className={viewMode === "masonry" ? "bg-gray-100" : ""}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Source Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(sourceConfig).map(([key, config]) => {
          const count = counts[key] || 0;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <Badge
              key={key}
              variant="outline"
              className={`cursor-pointer transition-all ${sourceFilter === key ? "ring-2 ring-offset-1" : ""}`}
              style={{
                backgroundColor:
                  sourceFilter === key ? config.bgColor : "transparent",
                borderColor: config.color,
                color: config.color,
              }}
              onClick={() =>
                setSourceFilter(
                  sourceFilter === key ? "all" : (key as PhotoSource),
                )
              }
            >
              <Icon className="h-3 w-3 mr-1" />
              {config.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageOff
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "#d1d5db" }}
            />
            <p className="text-lg font-medium" style={{ color: "#64748b" }}>
              No photos found
            </p>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              {searchQuery || sourceFilter !== "all"
                ? "Try adjusting your filters"
                : "Upload photos through daily reports, inspections, or documents"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              : "columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4"
          }
        >
          {filteredPhotos.map((photo, index) => {
            const config = sourceConfig[photo.source];
            const Icon = config.icon;
            const hasError = imageErrors.has(photo.id);

            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`group relative ${viewMode === "masonry" ? "break-inside-avoid mb-4" : ""} rounded-xl overflow-hidden cursor-pointer border shadow-sm hover:shadow-lg transition-all`}
                style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
                onClick={() => openViewer(photo, index)}
              >
                <div
                  className={
                    viewMode === "grid"
                      ? "aspect-square"
                      : "aspect-auto min-h-[120px]"
                  }
                >
                  {hasError ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ImageOff
                        className="h-8 w-8"
                        style={{ color: "#d1d5db" }}
                      />
                    </div>
                  ) : (
                    <Image
                      src={photo.url}
                      alt={photo.caption || photo.sourceTitle}
                      fill={viewMode === "grid"}
                      width={viewMode === "masonry" ? 300 : undefined}
                      height={viewMode === "masonry" ? 200 : undefined}
                      className={`object-cover transition-transform group-hover:scale-105 ${viewMode === "masonry" ? "w-full h-auto" : ""}`}
                      onError={() => handleImageError(photo.id)}
                      unoptimized
                    />
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Source Badge */}
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                  }}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                </div>

                {/* Preview Icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="p-1.5 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                  >
                    <Eye className="h-4 w-4" style={{ color: "#374151" }} />
                  </div>
                </div>

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">
                    {photo.sourceTitle}
                  </p>
                  {photo.caption && (
                    <p className="text-white/80 text-xs truncate mt-0.5">
                      {photo.caption}
                    </p>
                  )}
                  <p className="text-white/60 text-xs mt-1">
                    {formatDistanceToNow(new Date(photo.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            ref={lightboxRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
            onClick={closeViewer}
          >
            {/* Close Button */}
            <button
              onClick={closeViewer}
              className="absolute top-4 right-4 p-2 rounded-full z-10 hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}
            {currentIndex < filteredPhotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Image Container */}
            <div
              className="relative max-w-[90vw] max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={selectedPhoto.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || selectedPhoto.sourceTitle}
                className="max-w-full max-h-[80vh] object-contain transition-transform"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="max-w-4xl mx-auto">
                {/* Photo Info */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const config = sourceConfig[selectedPhoto.source];
                        const Icon = config.icon;
                        return (
                          <Badge
                            style={{
                              backgroundColor: config.bgColor,
                              color: config.color,
                            }}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                      <span className="text-white text-sm">
                        {currentIndex + 1} / {filteredPhotos.length}
                      </span>
                    </div>
                    <h4 className="text-white font-medium">
                      {selectedPhoto.sourceTitle}
                    </h4>
                    {selectedPhoto.caption && (
                      <p className="text-white/70 text-sm mt-1">
                        {selectedPhoto.caption}
                      </p>
                    )}
                    <p className="text-white/50 text-xs mt-1">
                      {formatDistanceToNow(new Date(selectedPhoto.createdAt), {
                        addSuffix: true,
                      })}
                      {selectedPhoto.fileSize &&
                        ` • ${formatFileSize(selectedPhoto.fileSize)}`}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-sm min-w-[50px] text-center">
                      {zoom}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedPhoto)}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {filteredPhotos
                    .slice(Math.max(0, currentIndex - 5), currentIndex + 6)
                    .map((photo, idx) => {
                      const actualIndex = Math.max(0, currentIndex - 5) + idx;
                      return (
                        <button
                          key={photo.id}
                          onClick={() => openViewer(photo, actualIndex)}
                          className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            actualIndex === currentIndex
                              ? "border-white"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
