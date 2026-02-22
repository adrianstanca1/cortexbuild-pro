// Advanced filtering utilities for tables and lists

export type FilterOperator =
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'between'
    | 'in'
    | 'notIn';

export interface Filter {
    field: string;
    operator: FilterOperator;
    value: any;
}

export const applyFilter = <T extends Record<string, any>>(
    item: T,
    filter: Filter
): boolean => {
    const fieldValue = item[filter.field];

    switch (filter.operator) {
        case 'equals':
            return fieldValue === filter.value;

        case 'notEquals':
            return fieldValue !== filter.value;

        case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());

        case 'startsWith':
            return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());

        case 'endsWith':
            return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());

        case 'greaterThan':
            return fieldValue > filter.value;

        case 'lessThan':
            return fieldValue < filter.value;

        case 'between':
            return fieldValue >= filter.value[0] && fieldValue <= filter.value[1];

        case 'in':
            return Array.isArray(filter.value) && filter.value.includes(fieldValue);

        case 'notIn':
            return Array.isArray(filter.value) && !filter.value.includes(fieldValue);

        default:
            return true;
    }
};

export const applyFilters = <T extends Record<string, any>>(
    data: T[],
    filters: Filter[]
): T[] => {
    return data.filter(item =>
        filters.every(filter => applyFilter(item, filter))
    );
};

export const applySort = <T extends Record<string, any>>(
    data: T[],
    field: string,
    direction: 'asc' | 'desc' = 'asc'
): T[] => {
    return [...data].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal === bVal) return 0;

        const comparison = aVal > bVal ? 1 : -1;
        return direction === 'asc' ? comparison : -comparison;
    });
};

export const applyPagination = <T>(
    data: T[],
    page: number,
    pageSize: number
): T[] => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
};

// Combined utility for filter, sort, and paginate
export const processTableData = <T extends Record<string, any>>(
    data: T[],
    options: {
        filters?: Filter[];
        sortField?: string;
        sortDirection?: 'asc' | 'desc';
        page?: number;
        pageSize?: number;
    }
): { data: T[]; total: number } => {
    let processed = data;

    // Apply filters
    if (options.filters && options.filters.length > 0) {
        processed = applyFilters(processed, options.filters);
    }

    // Store total after filtering
    const total = processed.length;

    // Apply sorting
    if (options.sortField) {
        processed = applySort(processed, options.sortField, options.sortDirection);
    }

    // Apply pagination
    if (options.page && options.pageSize) {
        processed = applyPagination(processed, options.page, options.pageSize);
    }

    return { data: processed, total };
};

// Example usage:
// const { data, total } = processTableData(projects, {
//   filters: [
//     { field: 'status', operator: 'equals', value: 'active' },
//     { field: 'budget', operator: 'greaterThan', value: 100000 }
//   ],
//   sortField: 'name',
//   sortDirection: 'asc',
//   page: 1,
//   pageSize: 10
// });
