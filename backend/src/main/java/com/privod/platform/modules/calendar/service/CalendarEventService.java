package com.privod.platform.modules.calendar.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.AttendeeResponseStatus;
import com.privod.platform.modules.calendar.domain.CalendarEvent;
import com.privod.platform.modules.calendar.domain.CalendarEventAttendee;
import com.privod.platform.modules.calendar.domain.EventPriority;
import com.privod.platform.modules.calendar.domain.EventStatus;
import com.privod.platform.modules.calendar.domain.RecurrenceRule;
import com.privod.platform.modules.calendar.repository.CalendarEventAttendeeRepository;
import com.privod.platform.modules.calendar.repository.CalendarEventRepository;
import com.privod.platform.modules.calendar.web.dto.AddAttendeeRequest;
import com.privod.platform.modules.calendar.web.dto.AttendeeResponse;
import com.privod.platform.modules.calendar.web.dto.CalendarEventResponse;
import com.privod.platform.modules.calendar.web.dto.CreateCalendarEventRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateAttendeeResponseRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateCalendarEventRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarEventService {

    private final CalendarEventRepository eventRepository;
    private final CalendarEventAttendeeRepository attendeeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<CalendarEventResponse> listEvents(Pageable pageable) {
        return eventRepository.findByDeletedFalse(pageable)
                .map(CalendarEventResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CalendarEventResponse getEvent(UUID id) {
        CalendarEvent event = getEventOrThrow(id);
        return CalendarEventResponse.fromEntity(event);
    }

    @Transactional
    public CalendarEventResponse createEvent(CreateCalendarEventRequest request) {
        CalendarEvent event = CalendarEvent.builder()
                .title(request.title())
                .description(request.description())
                .eventType(request.eventType())
                .startDate(request.startDate())
                .startTime(request.startTime())
                .endDate(request.endDate())
                .endTime(request.endTime())
                .isAllDay(request.isAllDay())
                .projectId(request.projectId())
                .taskId(request.taskId())
                .organizerId(request.organizerId())
                .organizerName(request.organizerName())
                .location(request.location())
                .isOnline(request.isOnline())
                .meetingUrl(request.meetingUrl())
                .recurrenceRule(request.recurrenceRule() != null ? request.recurrenceRule() : RecurrenceRule.NONE)
                .recurrenceEndDate(request.recurrenceEndDate())
                .color(request.color())
                .priority(request.priority() != null ? request.priority() : EventPriority.NORMAL)
                .reminderMinutesBefore(request.reminderMinutesBefore())
                .status(EventStatus.SCHEDULED)
                .build();

        event = eventRepository.save(event);
        auditService.logCreate("CalendarEvent", event.getId());

        log.info("Calendar event created: {} ({})", event.getTitle(), event.getId());
        return CalendarEventResponse.fromEntity(event);
    }

    @Transactional
    public CalendarEventResponse updateEvent(UUID id, UpdateCalendarEventRequest request) {
        CalendarEvent event = getEventOrThrow(id);

        if (request.title() != null) {
            event.setTitle(request.title());
        }
        if (request.description() != null) {
            event.setDescription(request.description());
        }
        if (request.eventType() != null) {
            event.setEventType(request.eventType());
        }
        if (request.startDate() != null) {
            event.setStartDate(request.startDate());
        }
        if (request.startTime() != null) {
            event.setStartTime(request.startTime());
        }
        if (request.endDate() != null) {
            event.setEndDate(request.endDate());
        }
        if (request.endTime() != null) {
            event.setEndTime(request.endTime());
        }
        event.setAllDay(request.isAllDay());
        if (request.projectId() != null) {
            event.setProjectId(request.projectId());
        }
        if (request.taskId() != null) {
            event.setTaskId(request.taskId());
        }
        if (request.location() != null) {
            event.setLocation(request.location());
        }
        event.setOnline(request.isOnline());
        if (request.meetingUrl() != null) {
            event.setMeetingUrl(request.meetingUrl());
        }
        if (request.recurrenceRule() != null) {
            event.setRecurrenceRule(request.recurrenceRule());
        }
        if (request.recurrenceEndDate() != null) {
            event.setRecurrenceEndDate(request.recurrenceEndDate());
        }
        if (request.color() != null) {
            event.setColor(request.color());
        }
        if (request.priority() != null) {
            event.setPriority(request.priority());
        }
        if (request.reminderMinutesBefore() != null) {
            event.setReminderMinutesBefore(request.reminderMinutesBefore());
        }
        if (request.status() != null) {
            event.setStatus(request.status());
        }

        event = eventRepository.save(event);
        auditService.logUpdate("CalendarEvent", event.getId(), "multiple", null, null);

        log.info("Calendar event updated: {} ({})", event.getTitle(), event.getId());
        return CalendarEventResponse.fromEntity(event);
    }

    @Transactional
    public void deleteEvent(UUID id) {
        CalendarEvent event = getEventOrThrow(id);
        event.softDelete();
        eventRepository.save(event);
        auditService.logDelete("CalendarEvent", id);
        log.info("Calendar event deleted: {} ({})", event.getTitle(), id);
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getByDateRange(LocalDate startDate, LocalDate endDate) {
        return eventRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(CalendarEventResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<CalendarEventResponse> getByProject(UUID projectId, Pageable pageable) {
        return eventRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(CalendarEventResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getProjectEvents(UUID projectId, LocalDate startDate, LocalDate endDate) {
        return eventRepository.findByProjectAndDateRange(projectId, startDate, endDate)
                .stream()
                .map(CalendarEventResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<CalendarEventResponse> getMyEvents(UUID userId, Pageable pageable) {
        return eventRepository.findByOrganizerId(userId, pageable)
                .map(CalendarEventResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getUpcomingEvents(UUID userId) {
        List<EventStatus> activeStatuses = List.of(EventStatus.SCHEDULED, EventStatus.IN_PROGRESS);
        List<CalendarEvent> events;
        if (userId != null) {
            events = eventRepository.findUpcomingByOrganizer(userId, LocalDate.now(), activeStatuses);
        } else {
            events = eventRepository.findUpcoming(LocalDate.now(), activeStatuses);
        }
        return events.stream().map(CalendarEventResponse::fromEntity).toList();
    }

    // --- Attendees ---

    @Transactional
    public AttendeeResponse addAttendee(UUID eventId, AddAttendeeRequest request) {
        getEventOrThrow(eventId);

        attendeeRepository.findByEventIdAndUserIdAndDeletedFalse(eventId, request.userId())
                .ifPresent(existing -> {
                    throw new IllegalStateException("Участник уже добавлен к этому событию");
                });

        CalendarEventAttendee attendee = CalendarEventAttendee.builder()
                .eventId(eventId)
                .userId(request.userId())
                .userName(request.userName())
                .email(request.email())
                .responseStatus(AttendeeResponseStatus.PENDING)
                .isRequired(request.isRequired())
                .build();

        attendee = attendeeRepository.save(attendee);
        log.info("Attendee added to event {}: {} ({})", eventId, request.userName(), attendee.getId());
        return AttendeeResponse.fromEntity(attendee);
    }

    @Transactional
    public void removeAttendee(UUID eventId, UUID userId) {
        getEventOrThrow(eventId);

        CalendarEventAttendee attendee = attendeeRepository
                .findByEventIdAndUserIdAndDeletedFalse(eventId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Участник не найден в событии: " + userId));

        attendee.softDelete();
        attendeeRepository.save(attendee);
        log.info("Attendee removed from event {}: {}", eventId, userId);
    }

    @Transactional
    public AttendeeResponse updateAttendeeResponse(UUID eventId, UUID userId,
                                                    UpdateAttendeeResponseRequest request) {
        getEventOrThrow(eventId);

        CalendarEventAttendee attendee = attendeeRepository
                .findByEventIdAndUserIdAndDeletedFalse(eventId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Участник не найден в событии: " + userId));

        attendee.setResponseStatus(request.responseStatus());
        attendee = attendeeRepository.save(attendee);

        log.info("Attendee response updated for event {}: {} -> {}",
                eventId, userId, request.responseStatus());
        return AttendeeResponse.fromEntity(attendee);
    }

    @Transactional(readOnly = true)
    public List<AttendeeResponse> getEventAttendees(UUID eventId) {
        getEventOrThrow(eventId);
        return attendeeRepository.findByEventIdAndDeletedFalse(eventId)
                .stream()
                .map(AttendeeResponse::fromEntity)
                .toList();
    }

    // --- Recurrence ---

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> generateRecurrences(UUID eventId,
                                                            LocalDate rangeStart,
                                                            LocalDate rangeEnd) {
        CalendarEvent event = getEventOrThrow(eventId);

        if (event.getRecurrenceRule() == RecurrenceRule.NONE) {
            return List.of(CalendarEventResponse.fromEntity(event));
        }

        List<CalendarEventResponse> occurrences = new ArrayList<>();
        LocalDate currentStart = event.getStartDate();
        long daysBetween = event.getEndDate().toEpochDay() - event.getStartDate().toEpochDay();
        LocalDate recurrenceEnd = event.getRecurrenceEndDate() != null
                ? event.getRecurrenceEndDate()
                : rangeEnd;

        while (!currentStart.isAfter(recurrenceEnd) && !currentStart.isAfter(rangeEnd)) {
            LocalDate currentEnd = currentStart.plusDays(daysBetween);

            if (!currentEnd.isBefore(rangeStart) && !currentStart.isAfter(rangeEnd)) {
                CalendarEvent occurrence = CalendarEvent.builder()
                        .title(event.getTitle())
                        .description(event.getDescription())
                        .eventType(event.getEventType())
                        .startDate(currentStart)
                        .startTime(event.getStartTime())
                        .endDate(currentEnd)
                        .endTime(event.getEndTime())
                        .isAllDay(event.isAllDay())
                        .projectId(event.getProjectId())
                        .taskId(event.getTaskId())
                        .organizerId(event.getOrganizerId())
                        .organizerName(event.getOrganizerName())
                        .location(event.getLocation())
                        .isOnline(event.isOnline())
                        .meetingUrl(event.getMeetingUrl())
                        .recurrenceRule(event.getRecurrenceRule())
                        .color(event.getColor())
                        .priority(event.getPriority())
                        .reminderMinutesBefore(event.getReminderMinutesBefore())
                        .status(event.getStatus())
                        .build();
                occurrence.setId(event.getId());
                occurrence.setCreatedAt(event.getCreatedAt());
                occurrence.setUpdatedAt(event.getUpdatedAt());
                occurrence.setCreatedBy(event.getCreatedBy());

                occurrences.add(CalendarEventResponse.fromEntity(occurrence));
            }

            currentStart = advanceDate(currentStart, event.getRecurrenceRule());
        }

        return occurrences;
    }

    private LocalDate advanceDate(LocalDate date, RecurrenceRule rule) {
        return switch (rule) {
            case DAILY -> date.plusDays(1);
            case WEEKLY -> date.plusWeeks(1);
            case BIWEEKLY -> date.plusWeeks(2);
            case MONTHLY -> date.plusMonths(1);
            case YEARLY -> date.plusYears(1);
            case NONE -> date.plusYears(100); // effectively stop
        };
    }

    private CalendarEvent getEventOrThrow(UUID id) {
        return eventRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Событие не найдено: " + id));
    }
}
