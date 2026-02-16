import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'TASK' | 'DOCUMENT' | 'PAYMENT' | 'PROJECT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  sourceType?: string;
  sourceId?: string;
  sourceUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationFilters extends PaginationParams {
  type?: NotificationType;
  isRead?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export const notificationsApi = {
  getNotifications: async (params?: NotificationFilters): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get<PaginatedResponse<Notification>>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (userId?: string): Promise<{ count: number }> => {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count', {
      params: userId ? { userId } : undefined,
    });
    // Backend returns { unreadCount }, normalize to { count } for the frontend
    const data = response.data;
    return { count: (data as { unreadCount?: number; count?: number }).unreadCount ?? (data as { count?: number }).count ?? 0 };
  },

  getStats: async (): Promise<NotificationStats> => {
    const response = await apiClient.get<NotificationStats>('/notifications/stats');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId?: string): Promise<void> => {
    await apiClient.patch('/notifications/mark-all-read', null, {
      params: userId ? { userId } : undefined,
    });
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
