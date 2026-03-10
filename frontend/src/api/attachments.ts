import { apiClient } from './client';

export interface FileAttachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  storagePath?: string;
  description?: string;
  uploadedBy?: string;
  createdAt: string;
  downloadUrl?: string;
}

export const attachmentsApi = {
  getAttachments: async (entityType: string, entityId: string): Promise<FileAttachment[]> => {
    const { data } = await apiClient.get('/attachments', { params: { entityType, entityId } });
    return data.data;
  },
  createAttachment: async (payload: Omit<FileAttachment, 'id' | 'createdAt'>): Promise<FileAttachment> => {
    const { data } = await apiClient.post('/attachments', payload);
    return data.data;
  },
  uploadFile: async (file: File, entityType: string, entityId: string, description?: string): Promise<FileAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    if (description) formData.append('description', description);
    const { data } = await apiClient.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  getDownloadUrl: async (id: string): Promise<string> => {
    const { data } = await apiClient.get(`/attachments/${id}/download-url`);
    return data.data;
  },
  deleteAttachment: async (id: string): Promise<void> => {
    await apiClient.delete(`/attachments/${id}`);
  },
};
