# useResourceManager Hook

## Purpose
Reduces duplication in client components that manage resources (equipment, materials, permits, etc.)

## Problem
Many client components had repetitive patterns:
- State management (items, loading, error, search)
- CRUD operations (create, update, delete)
- Toast notifications
- Router refresh

This pattern was duplicated across 30+ client components.

## Solution
Created `/hooks/useResourceManager.ts` - a reusable hook that encapsulates common resource management logic.

## Usage Example

```typescript
'use client';

import { useResourceManager } from '@/hooks/useResourceManager';

interface Equipment {
  id: string;
  name: string;
  status: string;
}

export function EquipmentClient({ initialEquipment }: { initialEquipment: Equipment[] }) {
  const {
    filteredItems,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    createItem,
    updateItem,
    deleteItem,
  } = useResourceManager<Equipment>({
    apiEndpoint: '/api/equipment',
    resourceName: 'equipment',
    initialItems: initialEquipment,
    filterFn: (item, search) => 
      item.name.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search),
  });

  // Your component UI using the hook
}
```

## Features
- **Automatic state management**: items, loading, error states
- **Built-in search**: With custom filter function
- **CRUD operations**: create, update, delete with error handling
- **Toast notifications**: Success/error messages
- **Router refresh**: Automatic refresh after mutations
- **Flexible**: Works with any resource type

## Comparison

### Before (Equipment Component)
```typescript
const [equipment, setEquipment] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const router = useRouter();

// Fetch logic
const fetchEquipment = async () => {
  try {
    setLoading(true);
    const res = await fetch('/api/equipment');
    const data = await res.json();
    setEquipment(data);
  } catch (error) {
    toast.error('Failed to fetch equipment');
  } finally {
    setLoading(false);
  }
};

// Create logic
const createEquipment = async (data) => {
  try {
    const res = await fetch('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    toast.success('Equipment created');
    router.refresh();
  } catch {
    toast.error('Failed to create equipment');
  }
};

// ... similar patterns for update and delete
```

### After (With Hook)
```typescript
const {
  filteredItems,
  loading,
  createItem,
  updateItem,
  deleteItem,
} = useResourceManager({
  apiEndpoint: '/api/equipment',
  resourceName: 'equipment',
  filterFn: (item, search) => item.name.includes(search),
});
```

## Benefits
- **90% less boilerplate**: ~100 lines reduced to ~10 lines
- **Consistent behavior**: All resources behave the same
- **Type-safe**: Full TypeScript support
- **Testable**: Hook can be tested independently
- **Maintainable**: One place to fix bugs

## Gradual Adoption
The hook is available for new components. Existing components can be migrated incrementally when refactoring.
