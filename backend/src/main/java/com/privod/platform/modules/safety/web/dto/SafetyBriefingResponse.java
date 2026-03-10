package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.BriefingAttendee;
import com.privod.platform.modules.safety.domain.BriefingStatus;
import com.privod.platform.modules.safety.domain.BriefingType;
import com.privod.platform.modules.safety.domain.SafetyBriefing;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SafetyBriefingResponse(
        UUID id,
        UUID projectId,
        BriefingType briefingType,
        String briefingTypeDisplayName,
        LocalDate briefingDate,
        UUID instructorId,
        String instructorName,
        String topic,
        String notes,
        BriefingStatus status,
        String statusDisplayName,
        LocalDate nextBriefingDate,
        int attendeeCount,
        int signedCount,
        List<AttendeeResponse> attendees,
        Instant createdAt,
        Instant updatedAt
) {
    public record AttendeeResponse(
            UUID id,
            UUID employeeId,
            String employeeName,
            boolean signed,
            Instant signedAt
    ) {
        public static AttendeeResponse fromEntity(BriefingAttendee a) {
            return new AttendeeResponse(
                    a.getId(),
                    a.getEmployeeId(),
                    a.getEmployeeName(),
                    a.isSigned(),
                    a.getSignedAt()
            );
        }
    }

    public static SafetyBriefingResponse fromEntity(SafetyBriefing b) {
        List<AttendeeResponse> attendeeResponses = b.getAttendees() != null
                ? b.getAttendees().stream()
                .filter(a -> !a.isDeleted())
                .map(AttendeeResponse::fromEntity)
                .toList()
                : List.of();

        int signedCount = (int) attendeeResponses.stream().filter(AttendeeResponse::signed).count();

        return new SafetyBriefingResponse(
                b.getId(),
                b.getProjectId(),
                b.getBriefingType(),
                b.getBriefingType().getDisplayName(),
                b.getBriefingDate(),
                b.getInstructorId(),
                b.getInstructorName(),
                b.getTopic(),
                b.getNotes(),
                b.getStatus(),
                b.getStatus().getDisplayName(),
                b.getNextBriefingDate(),
                attendeeResponses.size(),
                signedCount,
                attendeeResponses,
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
