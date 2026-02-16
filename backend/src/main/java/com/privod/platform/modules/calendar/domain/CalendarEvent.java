package com.privod.platform.modules.calendar.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "calendar_events", indexes = {
        @Index(name = "idx_event_start_date", columnList = "start_date"),
        @Index(name = "idx_event_end_date", columnList = "end_date"),
        @Index(name = "idx_event_project", columnList = "project_id"),
        @Index(name = "idx_event_organizer", columnList = "organizer_id"),
        @Index(name = "idx_event_status", columnList = "status"),
        @Index(name = "idx_event_type", columnList = "event_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent extends BaseEntity {

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private EventType eventType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "is_all_day", nullable = false)
    @Builder.Default
    private boolean isAllDay = false;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "organizer_id", nullable = false)
    private UUID organizerId;

    @Column(name = "organizer_name", nullable = false, length = 255)
    private String organizerName;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private boolean isOnline = false;

    @Column(name = "meeting_url", length = 1000)
    private String meetingUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_rule", nullable = false, length = 20)
    @Builder.Default
    private RecurrenceRule recurrenceRule = RecurrenceRule.NONE;

    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate;

    @Column(name = "color", length = 7)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private EventPriority priority = EventPriority.NORMAL;

    @Column(name = "reminder_minutes_before")
    private Integer reminderMinutesBefore;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EventStatus status = EventStatus.SCHEDULED;
}
