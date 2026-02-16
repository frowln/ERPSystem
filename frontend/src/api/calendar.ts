import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type CalendarEventType =
  | 'MEETING'
  | 'DEADLINE'
  | 'MILESTONE'
  | 'INSPECTION'
  | 'DELIVERY'
  | 'HOLIDAY'
  | 'OTHER';

export type CalendarEventStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export type EventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';

interface BackendCalendarEventResponse {
  id: string;
  title: string;
  description?: string | null;
  eventType: CalendarEventType;
  eventTypeDisplayName?: string | null;
  startDate: string;
  startTime?: string | null;
  endDate: string;
  endTime?: string | null;
  isAllDay: boolean;
  projectId?: string | null;
  taskId?: string | null;
  organizerId?: string | null;
  organizerName: string;
  location?: string | null;
  isOnline: boolean;
  meetingUrl?: string | null;
  recurrenceRule: RecurrenceType;
  recurrenceRuleDisplayName?: string | null;
  recurrenceEndDate?: string | null;
  color?: string | null;
  priority?: EventPriority | null;
  priorityDisplayName?: string | null;
  reminderMinutesBefore?: number | null;
  status: CalendarEventStatus;
  statusDisplayName?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

interface BackendConstructionScheduleResponse {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED';
  statusDisplayName?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  docVersion?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  eventTypeDisplayName?: string;
  status: CalendarEventStatus;
  statusDisplayName?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  projectId?: string;
  taskId?: string;
  organizerId?: string;
  organizerName: string;
  location?: string;
  isOnline: boolean;
  meetingUrl?: string;
  recurrenceRule: RecurrenceType;
  recurrenceRuleDisplayName?: string;
  recurrenceEndDate?: string;
  color?: string;
  priority?: EventPriority;
  priorityDisplayName?: string;
  reminderMinutesBefore?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateCalendarEventPayload {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  projectId?: string;
  taskId?: string;
  organizerId: string;
  organizerName: string;
  location?: string;
  isOnline: boolean;
  meetingUrl?: string;
  recurrenceRule?: RecurrenceType;
  recurrenceEndDate?: string;
  color?: string;
  priority?: EventPriority;
  reminderMinutesBefore?: number;
}

export interface UpdateCalendarEventPayload
  extends Partial<Omit<CreateCalendarEventPayload, 'organizerId' | 'organizerName'>> {
  status?: CalendarEventStatus;
}

export interface CalendarSchedule {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED';
  statusDisplayName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  docVersion?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateCalendarSchedulePayload {
  projectId: string;
  name: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface UpdateCalendarSchedulePayload {
  name?: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface CalendarEventFilters extends PaginationParams {
  dateFrom?: string;
  dateTo?: string;
  type?: CalendarEventType;
  status?: CalendarEventStatus;
  projectId?: string;
  scheduleId?: string;
  search?: string;
}

export interface CalendarScheduleFilters extends PaginationParams {
  projectId?: string;
  search?: string;
}

export interface Attendee {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  email?: string;
  responseStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  responseStatusDisplayName?: string;
  isRequired: boolean;
  createdAt: string;
}

function normalizeTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 5);
}

function mapEvent(event: BackendCalendarEventResponse): CalendarEvent {
  return {
    id: String(event.id),
    title: event.title,
    description: event.description ?? undefined,
    eventType: event.eventType,
    eventTypeDisplayName: event.eventTypeDisplayName ?? undefined,
    status: event.status,
    statusDisplayName: event.statusDisplayName ?? undefined,
    startDate: event.startDate,
    startTime: normalizeTime(event.startTime),
    endDate: event.endDate,
    endTime: normalizeTime(event.endTime),
    isAllDay: event.isAllDay,
    projectId: event.projectId ?? undefined,
    taskId: event.taskId ?? undefined,
    organizerId: event.organizerId ?? undefined,
    organizerName: event.organizerName,
    location: event.location ?? undefined,
    isOnline: event.isOnline,
    meetingUrl: event.meetingUrl ?? undefined,
    recurrenceRule: event.recurrenceRule,
    recurrenceRuleDisplayName: event.recurrenceRuleDisplayName ?? undefined,
    recurrenceEndDate: event.recurrenceEndDate ?? undefined,
    color: event.color ?? undefined,
    priority: event.priority ?? undefined,
    priorityDisplayName: event.priorityDisplayName ?? undefined,
    reminderMinutesBefore: event.reminderMinutesBefore ?? undefined,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    createdBy: event.createdBy ?? undefined,
  };
}

function mapSchedule(schedule: BackendConstructionScheduleResponse): CalendarSchedule {
  return {
    id: String(schedule.id),
    projectId: String(schedule.projectId),
    name: schedule.name,
    description: schedule.description ?? undefined,
    status: schedule.status,
    statusDisplayName: schedule.statusDisplayName ?? undefined,
    plannedStartDate: schedule.plannedStartDate ?? undefined,
    plannedEndDate: schedule.plannedEndDate ?? undefined,
    actualStartDate: schedule.actualStartDate ?? undefined,
    actualEndDate: schedule.actualEndDate ?? undefined,
    docVersion: schedule.docVersion ?? undefined,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    createdBy: schedule.createdBy ?? undefined,
  };
}

function mapAttendee(attendee: Attendee): Attendee {
  return {
    ...attendee,
    id: String(attendee.id),
    eventId: String(attendee.eventId),
    userId: String(attendee.userId),
  };
}

export const calendarApi = {
  getEvents: async (params?: CalendarEventFilters): Promise<PaginatedResponse<CalendarEvent>> => {
    const response = await apiClient.get<PaginatedResponse<BackendCalendarEventResponse>>('/calendar/events', { params });
    return {
      ...response.data,
      content: response.data.content.map(mapEvent),
    };
  },

  getEvent: async (id: string): Promise<CalendarEvent> => {
    const response = await apiClient.get<BackendCalendarEventResponse>(`/calendar/events/${id}`);
    return mapEvent(response.data);
  },

  createEvent: async (data: CreateCalendarEventPayload): Promise<CalendarEvent> => {
    const response = await apiClient.post<BackendCalendarEventResponse>('/calendar/events', data);
    return mapEvent(response.data);
  },

  updateEvent: async (id: string, data: UpdateCalendarEventPayload): Promise<CalendarEvent> => {
    const response = await apiClient.put<BackendCalendarEventResponse>(`/calendar/events/${id}`, data);
    return mapEvent(response.data);
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/calendar/events/${id}`);
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<BackendCalendarEventResponse[]>('/calendar/events/date-range', {
      params: { startDate, endDate },
    });
    return response.data.map(mapEvent);
  },

  getByProject: async (
    projectId: string,
    params?: CalendarEventFilters,
  ): Promise<PaginatedResponse<CalendarEvent>> => {
    const response = await apiClient.get<PaginatedResponse<BackendCalendarEventResponse>>(
      `/calendar/events/project/${projectId}`,
      { params },
    );
    return {
      ...response.data,
      content: response.data.content.map(mapEvent),
    };
  },

  getMyEvents: async (
    userId?: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CalendarEvent>> => {
    const response = await apiClient.get<PaginatedResponse<BackendCalendarEventResponse>>(
      '/calendar/events/my-events',
      { params: { userId, ...params } },
    );
    return {
      ...response.data,
      content: response.data.content.map(mapEvent),
    };
  },

  getUpcoming: async (userId?: string): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<BackendCalendarEventResponse[]>('/calendar/events/upcoming', {
      params: { userId },
    });
    return response.data.map(mapEvent);
  },

  getRecurrences: async (
    id: string,
    startDate: string,
    endDate: string,
  ): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<BackendCalendarEventResponse[]>(
      `/calendar/events/${id}/recurrences`,
      { params: { startDate, endDate } },
    );
    return response.data.map(mapEvent);
  },

  getAttendees: async (eventId: string): Promise<Attendee[]> => {
    const response = await apiClient.get<Attendee[]>(`/calendar/events/${eventId}/attendees`);
    return response.data.map(mapAttendee);
  },

  addAttendee: async (
    eventId: string,
    data: { userId: string; userName: string; email?: string; isRequired?: boolean },
  ): Promise<Attendee> => {
    const response = await apiClient.post<Attendee>(`/calendar/events/${eventId}/attendees`, data);
    return mapAttendee(response.data);
  },

  removeAttendee: async (eventId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/calendar/events/${eventId}/attendees/${userId}`);
  },

  updateAttendeeResponse: async (
    eventId: string,
    userId: string,
    data: { responseStatus: Attendee['responseStatus'] },
  ): Promise<Attendee> => {
    const response = await apiClient.patch<Attendee>(
      `/calendar/events/${eventId}/attendees/${userId}/response`,
      data,
    );
    return mapAttendee(response.data);
  },

  getSchedules: async (params?: CalendarScheduleFilters): Promise<PaginatedResponse<CalendarSchedule>> => {
    const response = await apiClient.get<PaginatedResponse<BackendConstructionScheduleResponse>>(
      '/calendar/schedules',
      { params },
    );
    return {
      ...response.data,
      content: response.data.content.map(mapSchedule),
    };
  },

  getSchedule: async (id: string): Promise<CalendarSchedule> => {
    const response = await apiClient.get<BackendConstructionScheduleResponse>(`/calendar/schedules/${id}`);
    return mapSchedule(response.data);
  },

  createSchedule: async (data: CreateCalendarSchedulePayload): Promise<CalendarSchedule> => {
    const response = await apiClient.post<BackendConstructionScheduleResponse>('/calendar/schedules', data);
    return mapSchedule(response.data);
  },

  updateSchedule: async (id: string, data: UpdateCalendarSchedulePayload): Promise<CalendarSchedule> => {
    const response = await apiClient.put<BackendConstructionScheduleResponse>(`/calendar/schedules/${id}`, data);
    return mapSchedule(response.data);
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await apiClient.delete(`/calendar/schedules/${id}`);
  },

  getScheduleEvents: async (
    scheduleId: string,
    params?: CalendarEventFilters,
  ): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<BackendCalendarEventResponse[]>(
      `/calendar/schedules/${scheduleId}/events`,
      { params },
    );
    return response.data.map(mapEvent);
  },
};
