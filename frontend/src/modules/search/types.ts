export interface SearchResult {
  id: string;
  entityType: 'PROJECT' | 'CONTRACT' | 'RFI' | 'ISSUE' | 'DOCUMENT' | 'employee' | 'MATERIAL' | 'TASK';
  title: string;
  subtitle: string;
  snippet: string;
  projectName?: string;
  status?: string;
  updatedAt: string;
  url: string;
}

export interface SearchFilters {
  query: string;
  entityTypes: string[];
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}
