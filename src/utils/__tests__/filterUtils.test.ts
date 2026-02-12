import { describe, it, expect } from '@jest/globals';
import { applyFilter, applyFilters, applySort, processTableData } from '../filterUtils';

describe('filterUtils', () => {
    const testData = [
        { id: 1, name: 'Alice', age: 30, status: 'active' },
        { id: 2, name: 'Bob', age: 25, status: 'inactive' },
        { id: 3, name: 'Charlie', age: 35, status: 'active' }
    ];

    describe('applyFilter', () => {
        it('should filter with equals operator', () => {
            const result = applyFilter(testData[0], {
                field: 'status',
                operator: 'equals',
                value: 'active'
            });
            expect(result).toBe(true);
        });

        it('should filter with contains operator', () => {
            const result = applyFilter(testData[0], {
                field: 'name',
                operator: 'contains',
                value: 'ali'
            });
            expect(result).toBe(true);
        });

        it('should filter with greaterThan operator', () => {
            const result = applyFilter(testData[2], {
                field: 'age',
                operator: 'greaterThan',
                value: 30
            });
            expect(result).toBe(true);
        });
    });

    describe('applyFilters', () => {
        it('should apply multiple filters', () => {
            const result = applyFilters(testData, [
                { field: 'status', operator: 'equals', value: 'active' },
                { field: 'age', operator: 'greaterThan', value: 29 }
            ]);
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Alice');
            expect(result[1].name).toBe('Charlie');
        });
    });

    describe('applySort', () => {
        it('should sort ascending', () => {
            const result = applySort(testData, 'age', 'asc');
            expect(result[0].age).toBe(25);
            expect(result[2].age).toBe(35);
        });

        it('should sort descending', () => {
            const result = applySort(testData, 'age', 'desc');
            expect(result[0].age).toBe(35);
            expect(result[2].age).toBe(25);
        });
    });

    describe('processTableData', () => {
        it('should filter, sort, and paginate', () => {
            const result = processTableData(testData, {
                filters: [{ field: 'status', operator: 'equals', value: 'active' }],
                sortField: 'age',
                sortDirection: 'desc',
                page: 1,
                pageSize: 10
            });

            expect(result.total).toBe(2);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].age).toBe(35);
        });
    });
});
