/**
 * Validation Schemas Tests
 */

import {
  signInSchema,
  signUpSchema,
  createProjectSchema,
  createTaskSchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/validation-schemas';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('signInSchema', () => {
    it('should validate valid sign in data', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = await validateRequest(signInSchema, data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
    
    it('should reject invalid email', async () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      const result = await validateRequest(signInSchema, data);
      
      expect(result.success).toBe(false);
    });
    
    it('should reject short password', async () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
      };
      
      const result = await validateRequest(signInSchema, data);
      
      expect(result.success).toBe(false);
    });
  });
  
  describe('signUpSchema', () => {
    it('should validate valid sign up data', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      
      const result = await validateRequest(signUpSchema, data);
      
      expect(result.success).toBe(true);
    });
    
    it('should accept optional organization name', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        organizationName: 'Test Org',
      };
      
      const result = await validateRequest(signUpSchema, data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organizationName).toBe('Test Org');
      }
    });
  });
  
  describe('createProjectSchema', () => {
    it('should validate valid project data', async () => {
      const data = {
        name: 'New Project',
        description: 'A test project',
        status: 'ACTIVE',
        budget: 100000,
      };
      
      const result = await validateRequest(createProjectSchema, data);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject negative budget', async () => {
      const data = {
        name: 'New Project',
        budget: -1000,
      };
      
      const result = await validateRequest(createProjectSchema, data);
      
      expect(result.success).toBe(false);
    });
    
    it('should use default status if not provided', async () => {
      const data = {
        name: 'New Project',
      };
      
      const result = await validateRequest(createProjectSchema, data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PLANNING');
      }
    });
  });
  
  describe('createTaskSchema', () => {
    it('should validate valid task data', async () => {
      const data = {
        title: 'New Task',
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'TODO',
        priority: 'HIGH',
      };
      
      const result = await validateRequest(createTaskSchema, data);
      
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid UUID for projectId', async () => {
      const data = {
        title: 'New Task',
        projectId: 'invalid-uuid',
      };
      
      const result = await validateRequest(createTaskSchema, data);
      
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid priority', async () => {
      const data = {
        title: 'New Task',
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'INVALID',
      };
      
      const result = await validateRequest(createTaskSchema, data);
      
      expect(result.success).toBe(false);
    });
  });
  
  describe('formatValidationErrors', () => {
    it('should format Zod errors correctly', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().positive(),
      });
      
      const result = await validateRequest(schema, {
        email: 'invalid',
        age: -5,
      });
      
      if (!result.success) {
        const formatted = formatValidationErrors(result.errors);
        
        expect(formatted).toHaveProperty('email');
        expect(formatted).toHaveProperty('age');
        expect(Array.isArray(formatted.email)).toBe(true);
        expect(Array.isArray(formatted.age)).toBe(true);
      }
    });
  });
});
