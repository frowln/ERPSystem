package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.FieldReport;
import com.privod.platform.modules.mobile.domain.FieldReportStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record FieldReportResponse(
        UUID id,
        String number,
        String title,
        String description,
        FieldReportStatus status,
        UUID projectId,
        String projectName,
        UUID authorId,
        String authorName,
        String location,
        String weatherCondition,
        Double temperature,
        Integer workersOnSite,
        List<FieldReportPhotoResponse> photos,
        String syncStatus,
        LocalDate reportDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static FieldReportResponse fromEntity(FieldReport entity) {
        return fromEntity(entity, null, Collections.emptyList());
    }

    public static FieldReportResponse fromEntity(FieldReport entity, String projectName,
                                                   List<FieldReportPhotoResponse> photos) {
        return new FieldReportResponse(
                entity.getId(),
                entity.getNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getProjectId(),
                projectName,
                entity.getAuthorId(),
                entity.getAuthorName(),
                entity.getLocation(),
                entity.getWeatherCondition(),
                entity.getTemperature(),
                entity.getWorkersOnSite(),
                photos != null ? photos : Collections.emptyList(),
                "SYNCED",
                entity.getReportDate(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
