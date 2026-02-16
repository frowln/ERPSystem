// Calendar module types
// Events, scheduling, and calendar views

export type CalendarEventType = 'MEETING' | 'DEADLINE' | 'INSPECTION' | 'DELIVERY';
export type ViewMode = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  projectId?: string;
  projectName?: string;
  participants?: string[];
  description?: string;
  isAllDay?: boolean;
  recurrenceRule?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  projectId?: string;
  participants?: string[];
  description?: string;
  isAllDay?: boolean;
}

export interface UpdateCalendarEventRequest extends Partial<CreateCalendarEventRequest> {
  id: string;
}

export interface CalendarDay {
  day: number;
  current: boolean;
  date: Date;
}

export interface CalendarFilters {
  projectId?: string;
  type?: CalendarEventType;
  dateFrom?: string;
  dateTo?: string;
}
