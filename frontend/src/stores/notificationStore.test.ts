import { describe, expect, it, beforeEach } from 'vitest';
import { useNotificationStore } from './notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
  });

  it('starts with zero unread and empty notifications', () => {
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.recentNotifications).toHaveLength(0);
  });

  it('pushNotification increments unread and adds to list', () => {
    useNotificationStore.getState().pushNotification({ type: 'TASK_ASSIGNED', payload: { id: '1' } } as never);
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.recentNotifications).toHaveLength(1);
  });

  it('markAllRead resets unread count but keeps notifications', () => {
    useNotificationStore.getState().pushNotification({ type: 'TASK_ASSIGNED', payload: {} } as never);
    useNotificationStore.getState().pushNotification({ type: 'COMMENT', payload: {} } as never);
    useNotificationStore.getState().markAllRead();
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.recentNotifications).toHaveLength(2);
  });

  it('reset clears everything', () => {
    useNotificationStore.getState().pushNotification({ type: 'TEST', payload: {} } as never);
    useNotificationStore.getState().reset();
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.recentNotifications).toHaveLength(0);
  });
});
