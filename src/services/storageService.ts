import axios from 'axios';

// Get API URL from env or default
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export type StorageBucket = 'documents' | 'images' | 'avatars' | 'videos';

export interface UploadResult {
    path: string;
    publicUrl: string;
    id?: string;
}

export const storageService = {
    /**
     * Upload a file via Backend API
     */
    async upload(file: File, bucket: StorageBucket, folder: string = ''): Promise<UploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', bucket);
            if (folder) formData.append('pathPrefix', folder);

            // Get token from local storage or auth context if possible (axios interceptor usually handles this)
            // But here we rely on the global axios instance or fetch with default headers if configured
            // Assuming standard fetch for now with token from localStorage to be safe if axios isn't globally configured
            const token = localStorage.getItem('token') || '';

            const response = await fetch(`${API_URL}/api/storage/upload/single`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await response.json();

            // Backend returns: { url: string, path: string, ... }
            return {
                path: data.path || data.url, // Fallback if path not separate
                publicUrl: data.url,
                id: data.id || `doc-${Date.now()}`
            };
        } catch (error: any) {
            console.error('API Upload Error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
    },

    /**
     * Delete a file via API
     */
    async delete(path: string, bucket: StorageBucket): Promise<void> {
        // Implement delete endpoint if needed, or leave stub
        console.warn('Delete not fully implemented in API yet');
    },

    /**
     * Get a signed URL (Stub)
     */
    async getSignedUrl(path: string, bucket: StorageBucket, expiresIn = 60): Promise<string | null> {
        // Local uploads are public or served via API proxy
        // Return the public URL if possible, or null
        return `/uploads/${bucket}/${path}`;
    }
};
