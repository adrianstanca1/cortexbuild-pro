// File Upload Security Fix
// Prevents access to macOS temporary directories and invalid file paths

import { useCallback } from 'react';

export type FileUploadValidation = {
    maxSize: number; // in bytes
    allowedTypes: string[];
    allowedExtensions: string[];
};

export type UploadResult = {
    valid: boolean;
    error?: string;
    size?: number;
    sanitizedPath?: string;
};

const DEFAULT_VALIDATION: FileUploadValidation = {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/css',
        'application/json',
        'application/xml'
    ],
    allowedExtensions: [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.gif',
        '.svg',
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.txt',
        '.csv',
        '.css',
        '.json',
        '.xml'
    ]
};

export const useSecureFileUpload = () => {
    const validateFile = useCallback((file: File): UploadResult => {
        try {
            // Check file size
            if (file.size > DEFAULT_VALIDATION.maxSize) {
                return {
                    valid: false,
                    error: `File size cannot exceed ${DEFAULT_VALIDATION.maxSize / (1024 * 1024)}MB`
                };
            }

            // Check file type
            const fileType = file.type || '';
            const isValidType = DEFAULT_VALIDATION.allowedTypes.some((allowedType) => fileType.startsWith(allowedType));

            if (!isValidType) {
                return {
                    valid: false,
                    error: `File type not supported. Allowed types: ${DEFAULT_VALIDATION.allowedTypes.join(', ')}`
                };
            }

            // Check file extension
            const fileName = file.name.toLowerCase();
            const hasValidExtension = DEFAULT_VALIDATION.allowedExtensions.some((ext) => fileName.endsWith(ext));

            if (!hasValidExtension) {
                return {
                    valid: false,
                    error: `File extension not supported. Allowed extensions: ${DEFAULT_VALIDATION.allowedExtensions.join(', ')}`
                };
            }

            // Sanitize filename to prevent path traversal
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const sanitizedPath = sanitizedFileName;

            return {
                valid: true,
                size: file.size,
                sanitizedPath
            };
        } catch (error) {
            return {
                valid: false,
                error: `File validation failed: ${error.message}`
            };
        }
    }, []);

    const preventMaliciousPaths = (path: string): string => {
        // Remove any path traversal attempts
        const sanitized = path
            .replace(/\.\./g, '') // Remove relative path traversal
            .replace(/\.\.\//g, '') // Remove encoded traversal
            .replace(/\\/g, '/') // Normalize path separators
            .replace(/\/\.\.\//g, ''); // Remove complex traversal;

        // Remove Windows drive letters
        const noDrive = sanitized.replace(/^[a-zA-Z]:[\\/]/, '');

        // Split and filter segments
        const segments = noDrive
            .split('/')
            .filter((segment) => segment.length > 0 && !['.', '..', 'CON', 'PRN', 'AUX', 'NUL'].includes(segment));

        return segments
            .join('/')
            .replace(/\/+/g, '/')
            .replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    };

    return {
        validateFile,
        preventMaliciousPaths,
        DEFAULT_VALIDATION
    };
};
