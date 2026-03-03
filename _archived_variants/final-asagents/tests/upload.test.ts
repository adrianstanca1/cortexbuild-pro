import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import uploadService from '../services/uploadService';
import fileProcessingService from '../services/fileProcessingService';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock file for testing
const createMockFile = (name: string, type: string, size: number = 1024): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('File Upload', () => {
    test('should upload single file successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          filename: 'test.pdf',
          originalName: 'test-document.pdf',
          size: 1024,
          mimetype: 'application/pdf',
          category: 'documents',
          url: '/uploads/file-123'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const file = createMockFile('test-document.pdf', 'application/pdf');
      const options = {
        companyId: 'company-1',
        userId: 'user-1',
        type: 'contract' as const
      };

      const result = await uploadService.uploadSingle(file, options);

      expect(result).toEqual(mockResponse.data);
    });

    test('should handle upload error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'File too large' })
      });

      const file = createMockFile('large-file.pdf', 'application/pdf');
      const options = {
        companyId: 'company-1',
        userId: 'user-1'
      };

      await expect(uploadService.uploadSingle(file, options)).rejects.toThrow('File too large');
    });

    test('should upload multiple files', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'file-1',
            filename: 'doc1.pdf',
            originalName: 'document1.pdf',
            size: 1024,
            mimetype: 'application/pdf',
            category: 'documents',
            url: '/uploads/file-1'
          },
          {
            id: 'file-2',
            filename: 'img1.jpg',
            originalName: 'image1.jpg',
            size: 2048,
            mimetype: 'image/jpeg',
            category: 'images',
            url: '/uploads/file-2'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const files = [
        createMockFile('document1.pdf', 'application/pdf'),
        createMockFile('image1.jpg', 'image/jpeg', 2048)
      ];

      const options = {
        companyId: 'company-1',
        userId: 'user-1'
      };

      const result = await uploadService.uploadMultiple(files, options);

      expect(result).toEqual(mockResponse.data);
      expect(result).toHaveLength(2);
    });
  });

  describe('File Management', () => {
    test('should list files with filters', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'file-1',
            filename: 'contract.pdf',
            originalName: 'project-contract.pdf',
            size: 1024,
            mimetype: 'application/pdf',
            category: 'documents'
          }
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const filters = {
        projectId: 'project-1',
        companyId: 'company-1',
        type: 'contract',
        page: 1,
        limit: 20
      };

      const result = await uploadService.listFiles(filters);

      expect(result.files).toEqual(mockResponse.data);
      expect(result.meta).toEqual(mockResponse.meta);
    });

    test('should delete file', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(uploadService.deleteFile('file-123', 'user-1')).resolves.toBeUndefined();
    });

    test('should get file metadata', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'file-123',
          filename: 'contract.pdf',
          size: 1024,
          mimetype: 'application/pdf',
          uploadedAt: '2023-12-01T00:00:00.000Z',
          uploadedBy: 'user-1'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await uploadService.getFileMetadata('file-123');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('File Validation', () => {
    test('should validate supported file types', () => {
      const supportedTypes = {
        documents: [
          {
            name: 'PDF',
            mimeTypes: ['application/pdf'],
            extensions: ['.pdf'],
            maxSize: 50 * 1024 * 1024
          }
        ],
        images: [
          {
            name: 'JPEG',
            mimeTypes: ['image/jpeg'],
            extensions: ['.jpg', '.jpeg'],
            maxSize: 10 * 1024 * 1024
          }
        ],
        drawings: []
      };

      const validFile = createMockFile('document.pdf', 'application/pdf');
      const validation = uploadService.validateFile(validFile, supportedTypes);

      expect(validation.isValid).toBe(true);
    });

    test('should reject unsupported file types', () => {
      const supportedTypes = {
        documents: [],
        images: [],
        drawings: []
      };

      const invalidFile = createMockFile('virus.exe', 'application/exe');
      const validation = uploadService.validateFile(invalidFile, supportedTypes);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('File type not supported');
    });

    test('should reject oversized files', () => {
      const supportedTypes = {
        documents: [],
        images: [],
        drawings: []
      };

      const largeFile = createMockFile('huge.pdf', 'application/pdf', 200 * 1024 * 1024);
      const validation = uploadService.validateFile(largeFile, supportedTypes);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('File size exceeds limit');
    });
  });

  describe('File Processing Service', () => {
    test('should process uploaded file', async () => {
      const mockFile = {
        id: 'file-123',
        filename: 'test.pdf',
        originalName: 'test-document.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        category: 'documents',
        url: '/uploads/file-123'
      };

      const result = await fileProcessingService.processUploadedFile(mockFile);

      expect(result.fileId).toBe('file-123');
      expect(['completed', 'failed', 'processing']).toContain(result.status);
    });

    test('should extract text from document', async () => {
      const mockFile = {
        id: 'file-123',
        filename: 'text.pdf',
        originalName: 'text-document.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        category: 'documents',
        url: '/uploads/file-123'
      };

      const extractedText = await fileProcessingService.extractText(mockFile);

      expect(typeof extractedText).toBe('string');
    });

    test('should analyze construction image', async () => {
      const mockFile = {
        id: 'file-123',
        filename: 'construction.jpg',
        originalName: 'construction-site.jpg',
        size: 2048,
        mimetype: 'image/jpeg',
        category: 'images',
        url: '/uploads/file-123'
      };

      const analysis = await fileProcessingService.analyzeConstructionImage(mockFile);

      expect(analysis).toHaveProperty('objects');
      expect(analysis).toHaveProperty('safety_issues');
      expect(analysis).toHaveProperty('progress_indicators');
      expect(analysis).toHaveProperty('equipment');
      expect(Array.isArray(analysis.objects)).toBe(true);
    });

    test('should generate project insights', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          filename: 'contract.pdf',
          originalName: 'project-contract.pdf',
          size: 1024,
          mimetype: 'application/pdf',
          category: 'documents',
          url: '/uploads/file-1'
        },
        {
          id: 'file-2',
          filename: 'progress.jpg',
          originalName: 'progress-photo.jpg',
          size: 2048,
          mimetype: 'image/jpeg',
          category: 'images',
          url: '/uploads/file-2'
        }
      ];

      const insights = await fileProcessingService.generateProjectInsights(mockFiles);

      expect(insights).toHaveProperty('summary');
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('risks');
      expect(insights).toHaveProperty('opportunities');
      expect(typeof insights.summary).toBe('string');
      expect(Array.isArray(insights.recommendations)).toBe(true);
      expect(Array.isArray(insights.risks)).toBe(true);
      expect(Array.isArray(insights.opportunities)).toBe(true);
    });

    test('should search within files', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          filename: 'contract.pdf',
          originalName: 'project-contract.pdf',
          size: 1024,
          mimetype: 'application/pdf',
          category: 'documents',
          url: '/uploads/file-1'
        }
      ];

      const searchResults = await fileProcessingService.searchFiles('contract', mockFiles);

      expect(searchResults).toHaveProperty('results');
      expect(Array.isArray(searchResults.results)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('should format file size correctly', () => {
      expect(uploadService.constructor.formatFileSize(1024)).toBe('1 KB');
      expect(uploadService.constructor.formatFileSize(1048576)).toBe('1 MB');
      expect(uploadService.constructor.formatFileSize(0)).toBe('0 Bytes');
      expect(uploadService.constructor.formatFileSize(1500)).toBe('1.46 KB');
    });

    test('should generate correct file URL', () => {
      const fileId = 'file-123';
      const url = uploadService.getFileUrl(fileId);
      
      expect(url).toContain(fileId);
      expect(url).toContain('/uploads/file/');
    });
  });
});

describe('Error Handling', () => {
  test('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const file = createMockFile('test.pdf', 'application/pdf');
    const options = {
      companyId: 'company-1',
      userId: 'user-1'
    };

    await expect(uploadService.uploadSingle(file, options)).rejects.toThrow();
  });

  test('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON'))
    });

    const file = createMockFile('test.pdf', 'application/pdf');
    const options = {
      companyId: 'company-1',
      userId: 'user-1'
    };

    await expect(uploadService.uploadSingle(file, options)).rejects.toThrow();
  });
});

describe('Integration Tests', () => {
  test('should handle complete file upload and processing workflow', async () => {
    // Mock successful upload
    const mockUploadResponse = {
      success: true,
      data: {
        id: 'file-123',
        filename: 'contract.pdf',
        originalName: 'project-contract.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        category: 'documents',
        url: '/uploads/file-123'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUploadResponse)
    });

    const file = createMockFile('project-contract.pdf', 'application/pdf');
    const options = {
      companyId: 'company-1',
      userId: 'user-1',
      type: 'contract' as const
    };

    // Upload file
    const uploadedFile = await uploadService.uploadSingle(file, options);
    expect(uploadedFile).toEqual(mockUploadResponse.data);

    // Process file
    const processingResult = await fileProcessingService.processUploadedFile(uploadedFile);
    expect(processingResult.fileId).toBe(uploadedFile.id);

    // Extract text
    const extractedText = await fileProcessingService.extractText(uploadedFile);
    expect(typeof extractedText).toBe('string');
  });
});