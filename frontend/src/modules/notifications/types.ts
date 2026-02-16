export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'ERROR'
  | 'SUCCESS'
  | 'TASK'
  | 'DOCUMENT'
  | 'PAYMENT'
  | 'PROJECT';

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
}

export interface NotificationPreference {
  id: string;
  type: string;
  label: string;
  description: string;
  channels: NotificationChannels;
}

export interface NotificationChannels {
  email: boolean;
  push: boolean;
  telegram: boolean;
  inApp: boolean;
}

export interface NotificationSummary {
  totalCount: number;
  unreadCount: number;
  byType: Record<NotificationType, number>;
}

export interface MarkAsReadRequest {
  notificationIds: string[];
}

export interface NotificationFilter {
  type?: NotificationType;
  isRead?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
