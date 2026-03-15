import { apiClient } from './client';

// Types
export interface CustomFieldDefinition {
  id: string;
  entityType: string;
  fieldKey: string;
  fieldName: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN' | 'URL' | 'EMAIL';
  description?: string;
  required: boolean;
  searchable: boolean;
  sortOrder: number;
  options?: string[];
  defaultValue?: string;
  validationRegex?: string;
  createdAt: string;
}

export interface CustomFieldValue {
  definitionId: string;
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  value: unknown;
  entityType: string;
}

export interface CreateCustomFieldRequest {
  entityType: string;
  fieldName: string;
  fieldType: string;
  description?: string;
  required?: boolean;
  searchable?: boolean;
  options?: string[];
  defaultValue?: string;
  validationRegex?: string;
}

export interface UpdateCustomFieldRequest {
  fieldName?: string;
  description?: string;
  required?: boolean;
  searchable?: boolean;
  sortOrder?: number;
  options?: string[];
  defaultValue?: string;
  validationRegex?: string;
}

export interface CustomFieldValuePayload {
  definitionId: string;
  value: unknown;
}

// API functions
export async function getFieldDefinitions(entityType?: string): Promise<CustomFieldDefinition[]> {
  const url = entityType
    ? `/custom-fields/definitions?entityType=${entityType}`
    : '/custom-fields/definitions/all';
  const response = await apiClient.get(url);
  return response.data ?? [];
}

export async function createFieldDefinition(data: CreateCustomFieldRequest): Promise<CustomFieldDefinition> {
  const response = await apiClient.post('/custom-fields/definitions', data);
  return response.data;
}

export async function updateFieldDefinition(id: string, data: UpdateCustomFieldRequest): Promise<CustomFieldDefinition> {
  const response = await apiClient.put(`/custom-fields/definitions/${id}`, data);
  return response.data;
}

export async function deleteFieldDefinition(id: string): Promise<void> {
  await apiClient.delete(`/custom-fields/definitions/${id}`);
}

export async function getFieldValues(entityType: string, entityId: string): Promise<CustomFieldValue[]> {
  const response = await apiClient.get(`/custom-fields/values/${entityType}/${entityId}`);
  return response.data ?? [];
}

export async function saveFieldValues(entityType: string, entityId: string, values: CustomFieldValuePayload[]): Promise<CustomFieldValue[]> {
  const response = await apiClient.put(`/custom-fields/values/${entityType}/${entityId}`, values);
  return response.data ?? [];
}
