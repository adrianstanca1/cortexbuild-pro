export interface KPIMetric {
  id: string;
  title: string;
  value: number | string;
  format: 'currency' | 'percentage' | 'duration' | 'number';
  description: string;
  icon: 'FolderOpen' | 'CheckCircle' | 'DollarSign' | 'Shield' | 'Wrench' | 'TrendingUp';
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
}

export interface ReportFilter {
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

export interface ReportData {
  kpis: KPIMetric[];
  charts: {
    projectProgress: ChartData;
    taskCompletion: ChartData;
    expenseBreakdown: ChartData;
    safetyTrends: ChartData;
  };
  tables: {
    topProjects: any[];
    recentExpenses: any[];
    safetyMetrics: any[];
  };
}

const generateMockChartData = (labels: string[], dataSize: number): ChartData => ({
  labels,
  datasets: [{ data: Array.from({ length: dataSize }, () => Math.floor(Math.random() * 100)) }],
});

const mockReportData: ReportData = {
  kpis: [
    { id: '1', title: 'Active Projects', value: 12, format: 'number', description: 'Total number of active projects', icon: 'FolderOpen', color: 'blue', change: 5, changeType: 'increase' },
    { id: '2', title: 'Tasks Completed', value: 85, format: 'percentage', description: 'Of all assigned tasks', icon: 'CheckCircle', color: 'green', change: -2, changeType: 'decrease' },
    { id: '3', title: 'Total Expenses', value: 125430.50, format: 'currency', description: 'For the selected period', icon: 'DollarSign', color: 'red', change: 10, changeType: 'increase' },
    { id: '4', title: 'Safety Score', value: 98, format: 'percentage', description: 'Based on incidents and inspections', icon: 'Shield', color: 'green', change: 0, changeType: 'stable' },
    { id: '5', title: 'Equipment Utilization', value: 76, format: 'percentage', description: 'Across all projects', icon: 'Wrench', color: 'yellow', change: 3, changeType: 'increase' },
    { id: '6', title: 'Revenue Growth', value: 15, format: 'percentage', description: 'Compared to last period', icon: 'TrendingUp', color: 'purple', change: 15, changeType: 'increase' },
  ],
  charts: {
    projectProgress: generateMockChartData(['Not Started', 'In Progress', 'Completed'], 3),
    taskCompletion: generateMockChartData(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 6),
    expenseBreakdown: generateMockChartData(['Materials', 'Labor', 'Permits', 'Subcontractors'], 4),
    safetyTrends: generateMockChartData(['Q1', 'Q2', 'Q3', 'Q4'], 4),
  },
  tables: {
    topProjects: [
      { name: 'Downtown Tower', spent: 1200000, progress: 60, status: 'In Progress' },
      { name: 'North Bridge Retrofit', spent: 800000, progress: 95, status: 'In Progress' },
      { name: 'Eastside Logistics Hub', spent: 2500000, progress: 30, status: 'In Progress' },
    ],
    recentExpenses: [
      { description: 'Concrete Delivery', category: 'Materials', date: '2024-07-20', amount: 5000, status: 'APPROVED' },
      { description: 'Plumbing Subcontractor', category: 'Subcontractors', date: '2024-07-19', amount: 15000, status: 'PENDING' },
      { description: 'Scaffolding Rental', category: 'Equipment', date: '2024-07-18', amount: 2500, status: 'APPROVED' },
    ],
    safetyMetrics: [
        { type: 'Near Miss', count: 5, trend: 'down', severity: 'Low' },
        { type: 'Minor Injury', count: 2, trend: 'stable', severity: 'Medium' },
        { type: 'Major Incident', count: 0, trend: 'stable', severity: 'High' },
    ],
  },
};

export const reportsService = {
  generateReport: async (filter: ReportFilter): Promise<ReportData> => {
    console.log('Generating report with filter:', filter);
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockReportData;
  },

  exportToCSV: async (reportData: ReportData, reportType: string): Promise<string> => {
    console.log('Exporting report:', reportType);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let csv = '';
    if (reportType === 'summary') {
        csv = 'KPI,Value\n';
        reportData.kpis.forEach(kpi => {
            csv += `${kpi.title},${kpi.value}\n`;
        });
    } else if (reportType === 'projects') {
        csv = 'Project Name,Spent,Progress,Status\n';
        reportData.tables.topProjects.forEach(p => {
            csv += `${p.name},${p.spent},${p.progress},${p.status}\n`;
        });
    }
    return csv;
  },

  getDateRangePresets: () => {
    return [
      { label: 'Last 7 Days', range: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
      { label: 'Last 30 Days', range: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
      { label: 'Last 90 Days', range: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
      { label: 'Year to Date', range: { start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
    ];
  },
};
