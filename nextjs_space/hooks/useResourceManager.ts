/**
 * Custom Hook for Resource Management
 * 
 * Provides common state and operations for managing resources in client components.
 * Reduces duplication across equipment, materials, permits, and other resource pages.
 * 
 * @example
 * ```typescript
 * const {
 *   items, loading, error,
 *   searchTerm, setSearchTerm,
 *   filteredItems,
 *   createItem, updateItem, deleteItem,
 *   refresh
 * } = useResourceManager({
 *   apiEndpoint: '/api/equipment',
 *   resourceName: 'equipment',
 *   filterFn: (item, search) => item.name.toLowerCase().includes(search)
 * });
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface UseResourceManagerOptions<T> {
  /** API endpoint for CRUD operations (e.g., '/api/equipment') */
  apiEndpoint: string;
  
  /** Resource name for user-facing messages (e.g., 'equipment', 'material') */
  resourceName: string;
  
  /** Initial items (for server-side rendering) */
  initialItems?: T[];
  
  /** Custom filter function for search */
  filterFn?: (item: T, searchTerm: string) => boolean;
  
  /** Whether to fetch items on mount */
  autoFetch?: boolean;
}

export interface UseResourceManagerReturn<T> {
  // Data state
  items: T[];
  loading: boolean;
  error: string | null;
  
  // Search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredItems: T[];
  
  // CRUD operations
  createItem: (data: Partial<T>) => Promise<T | null>;
  updateItem: (id: string, data: Partial<T>) => Promise<T | null>;
  deleteItem: (id: string) => Promise<boolean>;
  
  // Utilities
  refresh: () => Promise<void>;
  setItems: (items: T[]) => void;
}

/**
 * Hook for managing resource CRUD operations with common patterns
 */
export function useResourceManager<T extends { id: string }>(
  options: UseResourceManagerOptions<T>
): UseResourceManagerReturn<T> {
  const {
    apiEndpoint,
    resourceName,
    initialItems = [],
    filterFn,
    autoFetch = true,
  } = options;
  
  const router = useRouter();
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(!initialItems.length);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error(`Failed to fetch ${resourceName}`);
      const data = await res.json();
      
      // Handle different response formats
      const itemsArray = Array.isArray(data) ? data : data[resourceName] || data.data || [];
      setItems(itemsArray);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(`Failed to load ${resourceName}`, {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, resourceName]);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !initialItems.length) {
      fetchItems();
    }
  }, [autoFetch, initialItems.length, fetchItems]);
  
  // Create item
  const createItem = useCallback(async (data: Partial<T>): Promise<T | null> => {
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to create ${resourceName}`);
      }
      
      const newItem = await res.json();
      setItems(prev => [newItem, ...prev]);
      
      toast.success(`${resourceName} created successfully`);
      router.refresh();
      
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to create ${resourceName}`, {
        description: message,
      });
      return null;
    }
  }, [apiEndpoint, resourceName, router]);
  
  // Update item
  const updateItem = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    try {
      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to update ${resourceName}`);
      }
      
      const updatedItem = await res.json();
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      
      toast.success(`${resourceName} updated successfully`);
      router.refresh();
      
      return updatedItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to update ${resourceName}`, {
        description: message,
      });
      return null;
    }
  }, [apiEndpoint, resourceName, router]);
  
  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to delete ${resourceName}`);
      }
      
      setItems(prev => prev.filter(item => item.id !== id));
      
      toast.success(`${resourceName} deleted successfully`);
      router.refresh();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to delete ${resourceName}`, {
        description: message,
      });
      return false;
    }
  }, [apiEndpoint, resourceName, router]);
  
  // Filtered items
  const filteredItems = searchTerm && filterFn
    ? items.filter(item => filterFn(item, searchTerm.toLowerCase()))
    : items;
  
  return {
    items,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filteredItems,
    createItem,
    updateItem,
    deleteItem,
    refresh: fetchItems,
    setItems,
  };
}
