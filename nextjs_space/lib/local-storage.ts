import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

/**
 * Local file storage adapter
 * 
 * This provides a fallback file storage mechanism when AWS S3 is not configured.
 * Files are stored in the local filesystem under the `uploads` directory.
 * 
 * WARNING: This is NOT suitable for production use in distributed systems!
 * Use AWS S3 or another cloud storage solution for production.
 */

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await stat(UPLOAD_DIR);
  } catch {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save a file to local storage
 */
export async function saveLocalFile(
  fileName: string,
  content: Buffer | string,
  isPublic: boolean = false
): Promise<{ filePath: string; publicUrl: string }> {
  await ensureUploadDir();
  
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const relativePath = isPublic
    ? `public/${timestamp}-${safeName}`
    : `private/${timestamp}-${safeName}`;
  
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  const dir = path.dirname(fullPath);
  
  // Ensure subdirectory exists
  try {
    await stat(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
  
  await writeFile(fullPath, content);
  
  const publicUrl = `/uploads/${relativePath}`;
  
  return { filePath: relativePath, publicUrl };
}

/**
 * Get a file from local storage
 */
export async function getLocalFile(filePath: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  return await readFile(fullPath);
}

/**
 * Delete a file from local storage
 */
export async function deleteLocalFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await unlink(fullPath);
  } catch (error) {
    console.error('Error deleting local file:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Get file URL (for local storage, returns a path)
 */
export function getLocalFileUrl(filePath: string): string {
  return `/uploads/${filePath}`;
}

/**
 * Check if a file exists
 */
export async function localFileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    await stat(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size
 */
export async function getLocalFileSize(filePath: string): Promise<number> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  const stats = await stat(fullPath);
  return stats.size;
}
