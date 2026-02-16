package com.privod.platform.modules.calendar.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "calendar_event_attendees",
        uniqueConstraints = @UniqueConstraint(name = "uq_event_attendee", columnNames = {"event_id", "user_id"}),
        indexes = {
                @Index(name = "idx_attendee_event", columnList = "event_id"),
                @Index(name = "idx_attendee_user", columnList = "user_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventAttendee extends BaseEntity {

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", nullable = false, length = 255)
    private String userName;

    @Column(name = "email", length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_status", nullable = false, length = 20)
    @Builder.Default
    private AttendeeResponseStatus responseStatus = AttendeeResponseStatus.PENDING;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean isRequired = true;
}
