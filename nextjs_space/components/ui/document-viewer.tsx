"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    mimeType?: string;
    documentType?: string;
  } | null;
}

export function DocumentViewer({ isOpen, onClose, document }: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const fetchFileUrl = async () => {
    if (!document?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/download`);
      if (res.ok) {
        const data = await res.json();
        setFileUrl(data.url);
      } else {
        setError("Failed to load document");
      }
    } catch (e) {
      setError("Error loading document");
    } finally {
      setLoading(false);
    }
  };

  // Fetch URL when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      fetchFileUrl();
    }
    // Reset state when closed
    if (!isOpen) {
      setFileUrl(null);
      setError(null);
      setZoom(100);
      setRotation(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document?.id]);

  const isPDF = document?.mimeType?.includes("pdf") || document?.name?.toLowerCase().endsWith(".pdf");
  const isImage = document?.mimeType?.startsWith("image/") || 
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].some(ext => 
      document?.name?.toLowerCase().endsWith(`.${ext}`)
    );

  const handleDownload = () => {
    if (fileUrl) {
      const link = window.document.createElement("a");
      link.href = fileUrl;
      link.download = document?.name || "document";
      link.click();
    }
  };

  const handleOpenExternal = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const handleClose = () => {
    setFileUrl(null);
    setError(null);
    setZoom(100);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            {isPDF ? (
              <FileText className="h-5 w-5 text-red-500" />
            ) : isImage ? (
              <ImageIcon className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-medium text-gray-900 truncate max-w-md" title={document?.name}>
              {document?.name || "Document"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(25, z - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 w-12 text-center">{zoom}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRotation(r => (r + 90) % 360)}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleOpenExternal} disabled={!fileUrl}>
              <ExternalLink className="h-4 w-4 mr-1" /> Open
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!fileUrl}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#5f46e5]" />
              <p className="text-gray-600">Loading document...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchFileUrl}>Try Again</Button>
            </div>
          ) : !fileUrl ? (
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a document to preview</p>
            </div>
          ) : isPDF ? (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-lg border shadow-lg bg-white"
              title={document?.name}
            />
          ) : isImage ? (
            <div 
              className="flex items-center justify-center w-full h-full"
              style={{ overflow: 'auto' }}
            >
              <Image
                src={fileUrl}
                alt={document?.name || "Document"}
                className="max-w-none shadow-lg rounded-lg"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
          ) : (
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
              <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h3>
              <p className="text-gray-500 mb-4">This file type cannot be previewed in the browser.</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
