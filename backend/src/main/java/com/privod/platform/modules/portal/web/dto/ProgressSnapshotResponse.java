package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClientProgressSnapshot;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProgressSnapshotResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        LocalDate snapshotDate,
        BigDecimal overallPercent,
        String description,
        String milestoneSummaryJson,
        String photoReportJson,
        String weatherNotes,
        UUID createdByUserId,
        boolean published,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProgressSnapshotResponse fromEntity(ClientProgressSnapshot s) {
        return new ProgressSnapshotResponse(
                s.getId(),
                s.getOrganizationId(),
                s.getProjectId(),
                s.getSnapshotDate(),
                s.getOverallPercent(),
                s.getDescription(),
                s.getMilestoneSummaryJson(),
                s.getPhotoReportJson(),
                s.getWeatherNotes(),
                s.getCreatedByUserId(),
                s.isPublished(),
                s.getPublishedAt(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
