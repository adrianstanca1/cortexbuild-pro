// CSV Export Utility
// Enables easy data export from tables and lists

export interface ExportColumn {
    key: string;
    label: string;
    format?: (value: any) => string;
}

export const exportToCSV = (
    data: any[],
    columns: ExportColumn[],
    filename: string
) => {
    // Generate CSV header
    const header = columns.map(col => `"${col.label}"`).join(',');

    // Generate CSV rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];

            // Apply custom formatting if provided
            if (col.format) {
                value = col.format(value);
            }

            // Handle null/undefined
            if (value === null || value === undefined) {
                return '""';
            }

            // Escape quotes and wrap in quotes
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToJSON = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Example usage:
// const columns: ExportColumn[] = [
//   { key: 'name', label: 'Project Name' },
//   { key: 'status', label: 'Status' },
//   { key: 'budget', label: 'Budget', format: (val) => `$${val.toLocaleString()}` },
//   { key: 'createdAt', label: 'Created', format: (val) => new Date(val).toLocaleDateString() }
// ];
// exportToCSV(projects, columns, 'projects-export');
