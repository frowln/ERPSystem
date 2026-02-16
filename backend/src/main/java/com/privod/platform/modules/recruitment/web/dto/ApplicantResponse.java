package com.privod.platform.modules.recruitment.web.dto;

import com.privod.platform.modules.recruitment.domain.Applicant;
import com.privod.platform.modules.recruitment.domain.ApplicantPriority;
import com.privod.platform.modules.recruitment.domain.ApplicantStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ApplicantResponse(
        UUID id,
        String partnerName,
        String email,
        String phone,
        UUID jobPositionId,
        UUID stageId,
        String source,
        String medium,
        ApplicantPriority priority,
        String priorityDisplayName,
        BigDecimal salary,
        String salaryCurrency,
        LocalDate availability,
        String description,
        String interviewNotes,
        ApplicantStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ApplicantResponse fromEntity(Applicant applicant) {
        return new ApplicantResponse(
                applicant.getId(),
                applicant.getPartnerName(),
                applicant.getEmail(),
                applicant.getPhone(),
                applicant.getJobPositionId(),
                applicant.getStageId(),
                applicant.getSource(),
                applicant.getMedium(),
                applicant.getPriority(),
                applicant.getPriority().getDisplayName(),
                applicant.getSalary(),
                applicant.getSalaryCurrency(),
                applicant.getAvailability(),
                applicant.getDescription(),
                applicant.getInterviewNotes(),
                applicant.getStatus(),
                applicant.getStatus().getDisplayName(),
                applicant.getCreatedAt(),
                applicant.getUpdatedAt(),
                applicant.getCreatedBy()
        );
    }
}
