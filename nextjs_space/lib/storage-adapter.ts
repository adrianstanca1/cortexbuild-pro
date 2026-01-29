/**
 * Unified Storage Adapter
 * 
 * This module provides a unified interface for file storage that automatically
 * selects between AWS S3 and local storage based on configuration.
 * 
 * - If AWS S3 is configured (AWS_BUCKET_NAME is set), uses S3
 * - Otherwise, falls back to local file storage
 * 
 * Usage:
 *   import { uploadFile, getFileUrl, deleteFile } from '@/lib/storage-adapter';
 */

import * as s3 from './s3';
import * as localStorage from './local-storage';

/**
 * Check if AWS S3 is configured
 */
function isS3Configured(): boolean {
  return !!(process.env.AWS_BUCKET_NAME && process.env.AWS_REGION);
}

/**
 * Upload a file
 * 
 * Returns the storage path and a public URL (if applicable)
 */
export async function uploadFile(
  fileName: string,
  content: Buffer | string,
  contentType: string,
  isPublic: boolean = false
): Promise<{ storagePath: string; url: string }> {
  if (isS3Configured()) {
    // Use S3
    const { uploadUrl, cloud_storage_path } = await s3.generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic
    );
    
    // Upload the content
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: content,
    });
    
    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }
    
    const url = await s3.getFileUrl(cloud_storage_path, isPublic);
    
    return {
      storagePath: cloud_storage_path,
      url
    };
  } else {
    // Use local storage
    const { filePath, publicUrl } = await localStorage.saveLocalFile(
      fileName,
      content,
      isPublic
    );
    
    return {
      storagePath: filePath,
      url: publicUrl
    };
  }
}

/**
 * Get a file URL
 * 
 * For S3: Returns a signed URL (expires in 1 hour)
 * For local storage: Returns a static path
 */
export async function getFileUrl(
  storagePath: string,
  isPublic: boolean = false
): Promise<string> {
  if (isS3Configured()) {
    return await s3.getFileUrl(storagePath, isPublic);
  } else {
    return localStorage.getLocalFileUrl(storagePath);
  }
}

/**
 * Delete a file
 */
export async function deleteFile(storagePath: string): Promise<void> {
  if (isS3Configured()) {
    await s3.deleteFile(storagePath);
  } else {
    await localStorage.deleteLocalFile(storagePath);
  }
}

/**
 * Check if a file exists
 * 
 * Note: For S3, this currently only validates the path exists (not a real S3 check).
 * Consider implementing a proper HEAD request for production use.
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  if (isS3Configured()) {
    // TODO: Implement proper S3 HEAD request to check file existence
    // For now, assume file exists if we have a valid path
    return !!storagePath && storagePath.length > 0;
  } else {
    return await localStorage.localFileExists(storagePath);
  }
}

/**
 * Get the storage type being used
 */
export function getStorageType(): 's3' | 'local' {
  return isS3Configured() ? 's3' : 'local';
}

/**
 * Get storage configuration info
 */
export function getStorageInfo() {
  const type = getStorageType();
  
  if (type === 's3') {
    return {
      type: 's3',
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      configured: true
    };
  } else {
    return {
      type: 'local',
      path: 'uploads/',
      configured: false,
      warning: 'Using local storage. Configure AWS S3 for production use.'
    };
  }
}
