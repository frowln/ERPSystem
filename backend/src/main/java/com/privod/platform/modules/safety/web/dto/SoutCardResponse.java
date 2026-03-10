package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SoutCard;
import com.privod.platform.modules.safety.domain.SoutHazardClass;
import com.privod.platform.modules.safety.domain.SoutStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SoutCardResponse(
        UUID id,
        String cardNumber,
        UUID projectId,
        String workplaceName,
        String workplaceNumber,
        String department,
        String positionName,
        Integer employeeCount,
        SoutHazardClass hazardClass,
        String hazardClassDisplayName,
        String hazardClassCode,
        SoutStatus status,
        String statusDisplayName,
        LocalDate assessmentDate,
        LocalDate nextAssessmentDate,
        String assessorOrganization,
        String harmfulFactors,
        String compensations,
        String ppeRecommendations,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static SoutCardResponse fromEntity(SoutCard entity) {
        return new SoutCardResponse(
                entity.getId(),
                entity.getCardNumber(),
                entity.getProjectId(),
                entity.getWorkplaceName(),
                entity.getWorkplaceNumber(),
                entity.getDepartment(),
                entity.getPositionName(),
                entity.getEmployeeCount(),
                entity.getHazardClass(),
                entity.getHazardClass() != null ? entity.getHazardClass().getDisplayName() : null,
                entity.getHazardClass() != null ? entity.getHazardClass().getCode() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getAssessmentDate(),
                entity.getNextAssessmentDate(),
                entity.getAssessorOrganization(),
                entity.getHarmfulFactors(),
                entity.getCompensations(),
                entity.getPpeRecommendations(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
