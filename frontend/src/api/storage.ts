import { apiClient } from './client';

export interface UploadResult {
  key: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
}

export const storageApi = {
  /**
   * Upload a single file.
   * @param file - File object to upload
   * @param context - Upload context for server-side validation (e.g. 'document', 'image', 'bim')
   * @param onProgress - Optional progress callback (0-100)
   */
  async uploadFile(
    file: File,
    context: string = 'document',
    onProgress?: (percent: number) => void,
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', context);

    const response = await apiClient.post<UploadResult>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });

    return response.data;
  },

  /**
   * Get a presigned URL for a stored file.
   */
  async getPresignedUrl(key: string): Promise<string> {
    const response = await apiClient.get<{ url: string }>(`/files/${encodeURIComponent(key)}/url`);
    return response.data.url;
  },

  /**
   * Delete a stored file.
   */
  async deleteFile(key: string): Promise<void> {
    await apiClient.delete(`/files/${encodeURIComponent(key)}`);
  },
};
