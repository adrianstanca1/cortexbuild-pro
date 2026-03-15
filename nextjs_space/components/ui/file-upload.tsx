"use client";

import { useState, useRef } from "react";
import { Upload, FileIcon, Loader2, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileItem {
  id?: string;
  name: string;
  cloud_storage_path?: string;
  fileSize?: number;
  mimeType?: string;
  isUploading?: boolean;
}

interface FileUploadProps {
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  onUploadComplete?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  maxFiles?: number;
  maxSize?: number; // MB
  accept?: string;
  disabled?: boolean;
  isPublic?: boolean;
}

export function FileUpload({
  files,
  onFilesChange,
  onUploadComplete,
  onDelete,
  maxFiles = 5,
  maxSize = 50,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt",
  disabled = false,
  isPublic = false,
}: FileUploadProps) {
  const [_uploading, setUploading] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }

      await uploadFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    const tempId = `temp-${Date.now()}-${file.name}`;
    const newFile: FileItem = {
      id: tempId,
      name: file.name,
      fileSize: file.size,
      mimeType: file.type,
      isUploading: true,
    };

    onFilesChange([...files, newFile]);
    setUploading((prev) => [...prev, tempId]);

    try {
      // Get presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic,
        }),
      });

      if (!presignedRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Check if content-disposition header is needed
      const urlParams = new URL(uploadUrl).searchParams;
      const signedHeaders = urlParams.get("X-Amz-SignedHeaders") || "";
      const headers: Record<string, string> = { "Content-Type": file.type };
      if (signedHeaders.includes("content-disposition")) {
        headers["Content-Disposition"] = "attachment";
      }

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const completedFile: FileItem = {
        ...newFile,
        cloud_storage_path,
        isUploading: false,
      };

      onFilesChange(files.filter((f) => f.id !== tempId).concat(completedFile));
      onUploadComplete?.(completedFile);
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${file.name}`);
      onFilesChange(files.filter((f) => f.id !== tempId));
    } finally {
      setUploading((prev) => prev.filter((id) => id !== tempId));
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (!file.cloud_storage_path) return;

    try {
      const res = await fetch("/api/upload/file-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloud_storage_path: file.cloud_storage_path,
          isPublic,
        }),
      });

      if (!res.ok) throw new Error("Failed to get download URL");
      const { url } = await res.json();

      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDelete = (file: FileItem) => {
    onFilesChange(
      files.filter((f) => f.id !== file.id && f.name !== file.name),
    );
    onDelete?.(file);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled}
      />

      {files.length < maxFiles && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full h-20 border-dashed flex flex-col gap-1"
        >
          <Upload className="w-5 h-5" />
          <span className="text-sm">Click to upload files</span>
          <span className="text-xs text-muted-foreground">
            Max {maxSize}MB per file
          </span>
        </Button>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={file.id || idx}
              className="flex items-center gap-3 p-2 bg-muted rounded-lg"
            >
              <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                {file.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </p>
                )}
              </div>
              {file.isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex gap-1">
                  {file.cloud_storage_path && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(file)}
                    disabled={disabled}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
