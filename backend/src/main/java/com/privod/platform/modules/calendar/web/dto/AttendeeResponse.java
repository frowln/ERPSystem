package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.AttendeeResponseStatus;
import com.privod.platform.modules.calendar.domain.CalendarEventAttendee;

import java.time.Instant;
import java.util.UUID;

public record AttendeeResponse(
        UUID id,
        UUID eventId,
        UUID userId,
        String userName,
        String email,
        AttendeeResponseStatus responseStatus,
        String responseStatusDisplayName,
        boolean isRequired,
        Instant createdAt
) {
    public static AttendeeResponse fromEntity(CalendarEventAttendee attendee) {
        return new AttendeeResponse(
                attendee.getId(),
                attendee.getEventId(),
                attendee.getUserId(),
                attendee.getUserName(),
                attendee.getEmail(),
                attendee.getResponseStatus(),
                attendee.getResponseStatus().getDisplayName(),
                attendee.isRequired(),
                attendee.getCreatedAt()
        );
    }
}
