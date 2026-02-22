// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationsApi } from './notifications';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

describe('notificationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotifications calls GET /notifications with params', async () => {
    const mockData = { content: [], totalElements: 0 };
    mockGet.mockResolvedValue({ data: mockData });

    const result = await notificationsApi.getNotifications({ page: 0, size: 20 });
    expect(mockGet).toHaveBeenCalledWith('/notifications', { params: { page: 0, size: 20 } });
    expect(result).toEqual(mockData);
  });

  it('getUnreadCount calls GET /notifications/unread-count with userId', async () => {
    mockGet.mockResolvedValue({ data: { unreadCount: 3 } });

    const result = await notificationsApi.getUnreadCount('user-1');
    expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count', {
      params: { userId: 'user-1' },
    });
    expect(result).toEqual({ count: 3 });
  });

  it('getUnreadCount calls GET /notifications/unread-count without userId', async () => {
    mockGet.mockResolvedValue({ data: { unreadCount: 5 } });

    const result = await notificationsApi.getUnreadCount();
    expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count', {
      params: undefined,
    });
    expect(result).toEqual({ count: 5 });
  });

  it('getUnreadCount normalizes count field from backend', async () => {
    mockGet.mockResolvedValue({ data: { count: 7 } });

    const result = await notificationsApi.getUnreadCount();
    expect(result).toEqual({ count: 7 });
  });

  it('getStats calls GET /notifications/stats', async () => {
    const stats = { total: 10, unread: 3, byType: {} };
    mockGet.mockResolvedValue({ data: stats });

    const result = await notificationsApi.getStats();
    expect(mockGet).toHaveBeenCalledWith('/notifications/stats');
    expect(result).toEqual(stats);
  });

  it('markAsRead calls PATCH /notifications/:id/read', async () => {
    mockPatch.mockResolvedValue({ data: {} });

    await notificationsApi.markAsRead('n1');
    expect(mockPatch).toHaveBeenCalledWith('/notifications/n1/read');
  });

  it('markAllAsRead calls PATCH /notifications/mark-all-read with userId', async () => {
    mockPatch.mockResolvedValue({ data: {} });

    await notificationsApi.markAllAsRead('user-1');
    expect(mockPatch).toHaveBeenCalledWith('/notifications/mark-all-read', null, {
      params: { userId: 'user-1' },
    });
  });

  it('markAllAsRead calls PATCH /notifications/mark-all-read without userId', async () => {
    mockPatch.mockResolvedValue({ data: {} });

    await notificationsApi.markAllAsRead();
    expect(mockPatch).toHaveBeenCalledWith('/notifications/mark-all-read', null, {
      params: undefined,
    });
  });

  it('deleteNotification calls DELETE /notifications/:id', async () => {
    mockDelete.mockResolvedValue({} as never);

    await notificationsApi.deleteNotification('n1');
    expect(mockDelete).toHaveBeenCalledWith('/notifications/n1');
  });
});
