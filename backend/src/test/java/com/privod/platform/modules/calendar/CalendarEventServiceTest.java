package com.privod.platform.modules.calendar;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.AttendeeResponseStatus;
import com.privod.platform.modules.calendar.domain.CalendarEvent;
import com.privod.platform.modules.calendar.domain.CalendarEventAttendee;
import com.privod.platform.modules.calendar.domain.EventPriority;
import com.privod.platform.modules.calendar.domain.EventStatus;
import com.privod.platform.modules.calendar.domain.EventType;
import com.privod.platform.modules.calendar.domain.RecurrenceRule;
import com.privod.platform.modules.calendar.repository.CalendarEventAttendeeRepository;
import com.privod.platform.modules.calendar.repository.CalendarEventRepository;
import com.privod.platform.modules.calendar.service.CalendarEventService;
import com.privod.platform.modules.calendar.web.dto.AddAttendeeRequest;
import com.privod.platform.modules.calendar.web.dto.AttendeeResponse;
import com.privod.platform.modules.calendar.web.dto.CalendarEventResponse;
import com.privod.platform.modules.calendar.web.dto.CreateCalendarEventRequest;
import com.privod.platform.modules.calendar.web.dto.UpdateAttendeeResponseRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalendarEventServiceTest {

    @Mock
    private CalendarEventRepository eventRepository;

    @Mock
    private CalendarEventAttendeeRepository attendeeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CalendarEventService eventService;

    private UUID eventId;
    private UUID projectId;
    private UUID organizerId;
    private CalendarEvent testEvent;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        organizerId = UUID.randomUUID();

        testEvent = CalendarEvent.builder()
                .title("Совещание по проекту")
                .description("Обсуждение хода строительства")
                .eventType(EventType.MEETING)
                .startDate(LocalDate.of(2025, 6, 15))
                .startTime(LocalTime.of(10, 0))
                .endDate(LocalDate.of(2025, 6, 15))
                .endTime(LocalTime.of(11, 30))
                .isAllDay(false)
                .projectId(projectId)
                .organizerId(organizerId)
                .organizerName("Иванов И.И.")
                .location("Офис, переговорная №3")
                .isOnline(false)
                .recurrenceRule(RecurrenceRule.NONE)
                .priority(EventPriority.NORMAL)
                .status(EventStatus.SCHEDULED)
                .build();
        testEvent.setId(eventId);
        testEvent.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Event")
    class CreateEventTests {

        @Test
        @DisplayName("Should create event with SCHEDULED status")
        void createEvent_SetsDefaultScheduledStatus() {
            CreateCalendarEventRequest request = new CreateCalendarEventRequest(
                    "Инспекция площадки", "Плановая проверка",
                    EventType.INSPECTION,
                    LocalDate.of(2025, 7, 1), LocalTime.of(9, 0),
                    LocalDate.of(2025, 7, 1), LocalTime.of(12, 0),
                    false, projectId, null,
                    organizerId, "Петров П.П.",
                    "Стройплощадка", false, null,
                    RecurrenceRule.NONE, null, "#FF5733",
                    EventPriority.HIGH, 30);

            when(eventRepository.save(any(CalendarEvent.class))).thenAnswer(invocation -> {
                CalendarEvent e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            CalendarEventResponse response = eventService.createEvent(request);

            assertThat(response.status()).isEqualTo(EventStatus.SCHEDULED);
            assertThat(response.eventType()).isEqualTo(EventType.INSPECTION);
            assertThat(response.priority()).isEqualTo(EventPriority.HIGH);
            assertThat(response.organizerName()).isEqualTo("Петров П.П.");
            verify(auditService).logCreate(eq("CalendarEvent"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Event")
    class GetEventTests {

        @Test
        @DisplayName("Should find event by ID")
        void getEvent_Success() {
            when(eventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            CalendarEventResponse response = eventService.getEvent(eventId);

            assertThat(response).isNotNull();
            assertThat(response.title()).isEqualTo("Совещание по проекту");
            assertThat(response.eventTypeDisplayName()).isEqualTo("Совещание");
        }

        @Test
        @DisplayName("Should throw when event not found")
        void getEvent_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(eventRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> eventService.getEvent(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Событие не найдено");
        }
    }

    @Nested
    @DisplayName("Recurrence Generation")
    class RecurrenceTests {

        @Test
        @DisplayName("Should generate weekly recurrences within range")
        void generateRecurrences_WeeklyPattern() {
            CalendarEvent weeklyEvent = CalendarEvent.builder()
                    .title("Еженедельная планёрка")
                    .eventType(EventType.MEETING)
                    .startDate(LocalDate.of(2025, 6, 2))
                    .startTime(LocalTime.of(9, 0))
                    .endDate(LocalDate.of(2025, 6, 2))
                    .endTime(LocalTime.of(10, 0))
                    .organizerId(organizerId)
                    .organizerName("Иванов И.И.")
                    .recurrenceRule(RecurrenceRule.WEEKLY)
                    .recurrenceEndDate(LocalDate.of(2025, 6, 30))
                    .priority(EventPriority.NORMAL)
                    .status(EventStatus.SCHEDULED)
                    .build();
            weeklyEvent.setId(eventId);
            weeklyEvent.setCreatedAt(Instant.now());

            when(eventRepository.findById(eventId)).thenReturn(Optional.of(weeklyEvent));

            List<CalendarEventResponse> recurrences = eventService.generateRecurrences(
                    eventId,
                    LocalDate.of(2025, 6, 1),
                    LocalDate.of(2025, 6, 30));

            // June 2, 9, 16, 23, 30 => 5 occurrences
            assertThat(recurrences).hasSize(5);
            assertThat(recurrences.get(0).startDate()).isEqualTo(LocalDate.of(2025, 6, 2));
            assertThat(recurrences.get(1).startDate()).isEqualTo(LocalDate.of(2025, 6, 9));
            assertThat(recurrences.get(4).startDate()).isEqualTo(LocalDate.of(2025, 6, 30));
        }

        @Test
        @DisplayName("Should return single event for NONE recurrence")
        void generateRecurrences_NoRecurrence() {
            when(eventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));

            List<CalendarEventResponse> recurrences = eventService.generateRecurrences(
                    eventId,
                    LocalDate.of(2025, 6, 1),
                    LocalDate.of(2025, 6, 30));

            assertThat(recurrences).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Attendees")
    class AttendeeTests {

        @Test
        @DisplayName("Should add attendee to event")
        void addAttendee_Success() {
            UUID userId = UUID.randomUUID();
            AddAttendeeRequest request = new AddAttendeeRequest(
                    userId, "Сидоров С.С.", "sidorov@example.com", true);

            when(eventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));
            when(attendeeRepository.findByEventIdAndUserIdAndDeletedFalse(eventId, userId))
                    .thenReturn(Optional.empty());
            when(attendeeRepository.save(any(CalendarEventAttendee.class))).thenAnswer(inv -> {
                CalendarEventAttendee a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            AttendeeResponse response = eventService.addAttendee(eventId, request);

            assertThat(response.userName()).isEqualTo("Сидоров С.С.");
            assertThat(response.responseStatus()).isEqualTo(AttendeeResponseStatus.PENDING);
            assertThat(response.isRequired()).isTrue();
        }

        @Test
        @DisplayName("Should reject duplicate attendee")
        void addAttendee_Duplicate() {
            UUID userId = UUID.randomUUID();
            AddAttendeeRequest request = new AddAttendeeRequest(
                    userId, "Сидоров С.С.", "sidorov@example.com", true);

            CalendarEventAttendee existing = CalendarEventAttendee.builder()
                    .eventId(eventId)
                    .userId(userId)
                    .userName("Сидоров С.С.")
                    .build();

            when(eventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));
            when(attendeeRepository.findByEventIdAndUserIdAndDeletedFalse(eventId, userId))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> eventService.addAttendee(eventId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Участник уже добавлен");
        }

        @Test
        @DisplayName("Should update attendee response status")
        void updateAttendeeResponse_Success() {
            UUID userId = UUID.randomUUID();
            CalendarEventAttendee attendee = CalendarEventAttendee.builder()
                    .eventId(eventId)
                    .userId(userId)
                    .userName("Козлов А.А.")
                    .responseStatus(AttendeeResponseStatus.PENDING)
                    .build();
            attendee.setId(UUID.randomUUID());
            attendee.setCreatedAt(Instant.now());

            when(eventRepository.findById(eventId)).thenReturn(Optional.of(testEvent));
            when(attendeeRepository.findByEventIdAndUserIdAndDeletedFalse(eventId, userId))
                    .thenReturn(Optional.of(attendee));
            when(attendeeRepository.save(any(CalendarEventAttendee.class))).thenAnswer(inv -> inv.getArgument(0));

            AttendeeResponse response = eventService.updateAttendeeResponse(
                    eventId, userId, new UpdateAttendeeResponseRequest(AttendeeResponseStatus.ACCEPTED));

            assertThat(response.responseStatus()).isEqualTo(AttendeeResponseStatus.ACCEPTED);
        }
    }
}
