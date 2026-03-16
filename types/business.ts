// UK Construction Business Types

export interface Daywork {
  id: string;
  project_id: string;
  date: string;
  weather: string;
  crew_size: string;
  work_description: string;
  progress_percentage: string;
  materials: MaterialItem[];
  equipment: EquipmentItem[];
  created_at: string;
}

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface EquipmentItem {
  name: string;
  hours: number;
}

export interface Variation {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  approved_at?: string;
}

export interface PayrollItem {
  id: string;
  employee_id: string;
  period: string;
  base_salary: number;
  overtime: number;
  cis_deduction: number;
  ni_contribution: number;
  pension: number;
  net_pay: number;
  status: 'draft' | 'processed' | 'paid';
  created_at: string;
}

export interface RAMSDocument {
  id: string;
  project_id: string;
  name: string;
  location: string;
  description: string;
  date: string;
  tasks: string[];
  html_content: string;
  created_at: string;
}
