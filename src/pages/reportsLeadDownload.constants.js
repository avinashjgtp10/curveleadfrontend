import { FileSpreadsheet, FileText } from 'lucide-react';

export const REPORT_LEAD_PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

export const REPORT_LEAD_COLUMNS = [
  { key: 'lead_number', label: 'Lead #' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'stage', label: 'Stage' },
  { key: 'assigned_to_name', label: 'Assigned To' },
  { key: 'created_at', label: 'Created' },
];

export const REPORT_LEAD_SCORE_OPTIONS = [
  { value: '', label: 'All Scores' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

export const REPORT_LEAD_DOWNLOAD_OPTIONS = [
  { format: 'excel', label: 'Excel (.xls)', icon: FileSpreadsheet, iconClassName: 'text-green-600' },
  { format: 'pdf', label: 'PDF', icon: FileText, iconClassName: 'text-red-600' },
  { format: 'csv', label: 'CSV', icon: FileSpreadsheet, iconClassName: 'text-cyan-600' },
];
