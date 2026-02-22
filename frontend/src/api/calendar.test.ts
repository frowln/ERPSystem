// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calendarApi } from './calendar';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

describe('calendarApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('events', () => {
    it('getEvents calls GET /calendar/events and maps content', async () => {
      const backendEvent = {
        id: 'e1',
        title: 'Meeting',
        eventType: 'MEETING',
        status: 'SCHEDULED',
        startDate: '2026-02-20',
        startTime: '09:00:00',
        endDate: '2026-02-20',
        endTime: '10:30:00',
        isAllDay: false,
        organizerName: 'John',
        isOnline: true,
        recurrenceRule: 'NONE',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: { content: [backendEvent], totalElements: 1 } } as never);

      const result = await calendarApi.getEvents();
      expect(mockGet).toHaveBeenCalledWith('/calendar/events', { params: undefined });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].startTime).toBe('09:00');
      expect(result.content[0].endTime).toBe('10:30');
    });

    it('getEvent calls GET /calendar/events/:id and normalizes time', async () => {
      const backendEvent = {
        id: 'e1',
        title: 'Review',
        eventType: 'MEETING',
        status: 'SCHEDULED',
        startDate: '2026-02-20',
        startTime: '14:00:00',
        endDate: '2026-02-20',
        endTime: null,
        isAllDay: false,
        organizerName: 'Jane',
        isOnline: false,
        recurrenceRule: 'WEEKLY',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: backendEvent } as never);

      const result = await calendarApi.getEvent('e1');
      expect(mockGet).toHaveBeenCalledWith('/calendar/events/e1');
      expect(result.startTime).toBe('14:00');
      expect(result.endTime).toBeUndefined();
    });

    it('createEvent calls POST /calendar/events', async () => {
      const data = {
        title: 'New Event',
        eventType: 'DEADLINE' as const,
        startDate: '2026-03-01',
        endDate: '2026-03-01',
        isAllDay: true,
        organizerId: 'u1',
        organizerName: 'Admin',
        isOnline: false,
      };
      const backendResp = {
        id: 'e2',
        ...data,
        status: 'SCHEDULED',
        recurrenceRule: 'NONE',
        createdAt: '2026-02-21T00:00:00Z',
        updatedAt: '2026-02-21T00:00:00Z',
      };
      mockPost.mockResolvedValue({ data: backendResp } as never);

      const result = await calendarApi.createEvent(data);
      expect(mockPost).toHaveBeenCalledWith('/calendar/events', data);
      expect(result.id).toBe('e2');
    });

    it('deleteEvent calls DELETE /calendar/events/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await calendarApi.deleteEvent('e1');
      expect(mockDelete).toHaveBeenCalledWith('/calendar/events/e1');
    });

    it('getByDateRange calls GET /calendar/events/date-range', async () => {
      const events = [
        { id: 'e1', title: 'A', eventType: 'MEETING', status: 'SCHEDULED', startDate: '2026-02-01', endDate: '2026-02-01', isAllDay: true, organizerName: 'X', isOnline: false, recurrenceRule: 'NONE', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
      ];
      mockGet.mockResolvedValue({ data: events } as never);

      const result = await calendarApi.getByDateRange('2026-02-01', '2026-02-28');
      expect(mockGet).toHaveBeenCalledWith('/calendar/events/date-range', {
        params: { startDate: '2026-02-01', endDate: '2026-02-28' },
      });
      expect(result).toHaveLength(1);
    });

    it('getUpcoming calls GET /calendar/events/upcoming with userId', async () => {
      mockGet.mockResolvedValue({ data: [] } as never);

      await calendarApi.getUpcoming('u1');
      expect(mockGet).toHaveBeenCalledWith('/calendar/events/upcoming', { params: { userId: 'u1' } });
    });
  });

  describe('attendees', () => {
    it('getAttendees calls GET /calendar/events/:id/attendees', async () => {
      const attendees = [{ id: 'a1', eventId: 'e1', userId: 'u1', userName: 'John', responseStatus: 'ACCEPTED', isRequired: true, createdAt: '2026-02-01T00:00:00Z' }];
      mockGet.mockResolvedValue({ data: attendees } as never);

      const result = await calendarApi.getAttendees('e1');
      expect(mockGet).toHaveBeenCalledWith('/calendar/events/e1/attendees');
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('u1');
    });

    it('addAttendee calls POST /calendar/events/:id/attendees', async () => {
      const data = { userId: 'u2', userName: 'Jane', isRequired: true };
      const attendee = { id: 'a2', eventId: 'e1', ...data, responseStatus: 'PENDING', createdAt: '2026-02-01T00:00:00Z' };
      mockPost.mockResolvedValue({ data: attendee } as never);

      const result = await calendarApi.addAttendee('e1', data);
      expect(mockPost).toHaveBeenCalledWith('/calendar/events/e1/attendees', data);
      expect(result.userName).toBe('Jane');
    });

    it('removeAttendee calls DELETE /calendar/events/:id/attendees/:userId', async () => {
      mockDelete.mockResolvedValue({} as never);

      await calendarApi.removeAttendee('e1', 'u1');
      expect(mockDelete).toHaveBeenCalledWith('/calendar/events/e1/attendees/u1');
    });

    it('updateAttendeeResponse calls PATCH', async () => {
      const updated = { id: 'a1', eventId: 'e1', userId: 'u1', userName: 'John', responseStatus: 'DECLINED', isRequired: true, createdAt: '2026-02-01T00:00:00Z' };
      mockPatch.mockResolvedValue({ data: updated } as never);

      const result = await calendarApi.updateAttendeeResponse('e1', 'u1', { responseStatus: 'DECLINED' });
      expect(mockPatch).toHaveBeenCalledWith('/calendar/events/e1/attendees/u1/response', { responseStatus: 'DECLINED' });
      expect(result.responseStatus).toBe('DECLINED');
    });
  });

  describe('schedules', () => {
    it('getSchedules calls GET /calendar/schedules', async () => {
      const backendSchedule = {
        id: 's1',
        projectId: 'p1',
        name: 'Main Schedule',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      mockGet.mockResolvedValue({ data: { content: [backendSchedule], totalElements: 1 } } as never);

      const result = await calendarApi.getSchedules();
      expect(mockGet).toHaveBeenCalledWith('/calendar/schedules', { params: undefined });
      expect(result.content[0].name).toBe('Main Schedule');
    });

    it('createSchedule calls POST /calendar/schedules', async () => {
      const data = { projectId: 'p1', name: 'New Schedule' };
      const resp = { id: 's2', ...data, status: 'DRAFT', createdAt: '2026-02-21T00:00:00Z', updatedAt: '2026-02-21T00:00:00Z' };
      mockPost.mockResolvedValue({ data: resp } as never);

      const result = await calendarApi.createSchedule(data);
      expect(mockPost).toHaveBeenCalledWith('/calendar/schedules', data);
      expect(result.id).toBe('s2');
    });

    it('deleteSchedule calls DELETE /calendar/schedules/:id', async () => {
      mockDelete.mockResolvedValue({} as never);

      await calendarApi.deleteSchedule('s1');
      expect(mockDelete).toHaveBeenCalledWith('/calendar/schedules/s1');
    });
  });

  describe('error propagation', () => {
    it('propagates API errors', async () => {
      const error = new Error('Network Error');
      mockGet.mockRejectedValue(error);

      await expect(calendarApi.getEvents()).rejects.toThrow('Network Error');
    });
  });
});
