import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type CalendarEventType = 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'INSPECTION' | 'DELIVERY' | 'HOLIDAY' | 'OTHER';
export type CalendarEventStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  startDate: string;
  endDate: string;
  allDay: boolean;
  projectId?: string;
  projectName?: string;
  location?: string;
  organizerName: string;
  attendees: string[];
  recurrence: RecurrenceType;
  color?: string;
  createdAt: string;
}

export interface Attendee {
  id: string;
  userId: string;
  userName: string;
  responseStatus: string;
}

export interface CalendarEventFilters extends PaginationParams {
  dateFrom?: string;
  dateTo?: string;
  type?: CalendarEventType;
  status?: CalendarEventStatus;
  projectId?: string;
  search?: string;
}

export const calendarApi = {
  getAll: async (params?: CalendarEventFilters): Promise<PaginatedResponse<CalendarEvent>> => {
    const response = await apiClient.get<PaginatedResponse<CalendarEvent>>('/calendar/events', { params });
    return response.data;
  },

  getById: async (id: string): Promise<CalendarEvent> => {
    const response = await apiClient.get<CalendarEvent>(`/calendar/events/${id}`);
    return response.data;
  },

  create: async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await apiClient.post<CalendarEvent>('/calendar/events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await apiClient.put<CalendarEvent>(`/calendar/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/calendar/events/${id}`);
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>('/calendar/events/date-range', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getByProject: async (projectId: string, params?: CalendarEventFilters): Promise<PaginatedResponse<CalendarEvent>> => {
    const response = await apiClient.get<PaginatedResponse<CalendarEvent>>(`/calendar/events/project/${projectId}`, { params });
    return response.data;
  },

  getMyEvents: async (userId: string, params?: PaginationParams): Promise<PaginatedResponse<CalendarEvent>> => {
    const response = await apiClient.get<PaginatedResponse<CalendarEvent>>('/calendar/events/my-events', {
      params: { userId, ...params },
    });
    return response.data;
  },

  getUpcoming: async (userId?: string): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>('/calendar/events/upcoming', {
      params: userId ? { userId } : undefined,
    });
    return response.data;
  },

  getRecurrences: async (id: string, startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>(`/calendar/events/${id}/recurrences`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getAttendees: async (eventId: string): Promise<Attendee[]> => {
    const response = await apiClient.get<Attendee[]>(`/calendar/events/${eventId}/attendees`);
    return response.data;
  },

  addAttendee: async (eventId: string, data: { userId: string }): Promise<Attendee> => {
    const response = await apiClient.post<Attendee>(`/calendar/events/${eventId}/attendees`, data);
    return response.data;
  },

  removeAttendee: async (eventId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/calendar/events/${eventId}/attendees/${userId}`);
  },

  updateAttendeeResponse: async (eventId: string, userId: string, data: { responseStatus: string }): Promise<Attendee> => {
    const response = await apiClient.patch<Attendee>(`/calendar/events/${eventId}/attendees/${userId}/response`, data);
    return response.data;
  },
};
