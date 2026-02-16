package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.CrewTimeSheet;
import com.privod.platform.modules.hr.domain.CrewTimeSheetStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CrewTimeSheetResponse(
        UUID id,
        UUID crewId,
        UUID projectId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal totalHours,
        BigDecimal totalOvertime,
        CrewTimeSheetStatus status,
        String statusDisplayName,
        UUID approvedById,
        LocalDateTime approvedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static CrewTimeSheetResponse fromEntity(CrewTimeSheet ts) {
        return new CrewTimeSheetResponse(
                ts.getId(),
                ts.getCrewId(),
                ts.getProjectId(),
                ts.getPeriodStart(),
                ts.getPeriodEnd(),
                ts.getTotalHours(),
                ts.getTotalOvertime(),
                ts.getStatus(),
                ts.getStatus().getDisplayName(),
                ts.getApprovedById(),
                ts.getApprovedAt(),
                ts.getCreatedAt(),
                ts.getUpdatedAt()
        );
    }
}
