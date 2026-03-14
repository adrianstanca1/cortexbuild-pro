import { describe, it, expect } from 'vitest';
import { exportToCSV, exportToJSON } from '../exportUtils';

describe('exportUtils', () => {
    describe('exportToCSV', () => {
        it('should generate CSV with correct headers', () => {
            const data = [
                { name: 'Project A', status: 'active', budget: 100000 },
                { name: 'Project B', status: 'completed', budget: 50000 }
            ];

            const columns = [
                { key: 'name', label: 'Project Name' },
                { key: 'status', label: 'Status' },
                { key: 'budget', label: 'Budget' }
            ];

            // Mock DOM methods
            const createElementSpy = jest.spyOn(document, 'createElement');
            const appendChildSpy = jest.spyOn(document.body, 'appendChild');
            const removeChildSpy = jest.spyOn(document.body, 'removeChild');

            exportToCSV(data, columns, 'test');

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(appendChildSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();

            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });

        it('should handle custom formatters', () => {
            const data = [{ date: new Date('2024-01-01'), amount: 1000 }];

            const columns = [
                {
                    key: 'date',
                    label: 'Date',
                    format: (val: Date) => val.toLocaleDateString()
                },
                {
                    key: 'amount',
                    label: 'Amount',
                    format: (val: number) => `$${val.toFixed(2)}`
                }
            ];

            const createElementSpy = jest.spyOn(document, 'createElement');
            exportToCSV(data, columns, 'test');
            expect(createElementSpy).toHaveBeenCalled();
            createElementSpy.mockRestore();
        });
    });

    describe('exportToJSON', () => {
        it('should create JSON download', () => {
            const data = [{ id: 1, name: 'Test' }];

            const createElementSpy = jest.spyOn(document, 'createElement');
            const appendChildSpy = jest.spyOn(document.body, 'appendChild');
            const removeChildSpy = jest.spyOn(document.body, 'removeChild');

            exportToJSON(data, 'test');

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(appendChildSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();

            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });
    });
});
