package com.privod.platform.modules.recruitment.web.dto;

import com.privod.platform.modules.recruitment.domain.Interview;
import com.privod.platform.modules.recruitment.domain.InterviewResult;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record InterviewResponse(
        UUID id,
        UUID applicantId,
        UUID interviewerId,
        LocalDateTime scheduledAt,
        int duration,
        String location,
        InterviewResult result,
        String resultDisplayName,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static InterviewResponse fromEntity(Interview interview) {
        return new InterviewResponse(
                interview.getId(),
                interview.getApplicantId(),
                interview.getInterviewerId(),
                interview.getScheduledAt(),
                interview.getDuration(),
                interview.getLocation(),
                interview.getResult(),
                interview.getResult() != null ? interview.getResult().getDisplayName() : null,
                interview.getNotes(),
                interview.getCreatedAt(),
                interview.getUpdatedAt(),
                interview.getCreatedBy()
        );
    }
}
