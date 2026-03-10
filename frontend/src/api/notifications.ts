import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type NotificationType =
  | 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'TASK' | 'DOCUMENT' | 'PAYMENT' | 'PROJECT'
  | 'APPROVAL' | 'SYSTEM' | 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'COMMENT_ADDED'
  | 'DOCUMENT_UPLOADED' | 'APPROVAL_REQUIRED' | 'BUDGET_THRESHOLD' | 'SAFETY_ALERT';

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

export interface NotificationPreference {
  id: string;
  type?: string;
  label?: string;
  channel: string;
  category: string;
  enabled: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
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

  getNotificationPreferences: async (): Promise<NotificationPreference[]> => {
    const response = await apiClient.get<NotificationPreference[]>('/notification-preferences');
    return response.data;
  },

  updateNotificationPreference: async (channel: string, category: string, enabled: boolean): Promise<NotificationPreference> => {
    const response = await apiClient.put<NotificationPreference>('/notification-preferences', { channel, category, enabled });
    return response.data;
  },

  /** Alias for getUnreadCount — returns just the numeric count. */
  fetchUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    const data = response.data;
    return (data as { unreadCount?: number; count?: number }).unreadCount
      ?? (data as { count?: number }).count
      ?? 0;
  },

  /** Alias for markAllAsRead. */
  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/mark-all-read');
  },
};
