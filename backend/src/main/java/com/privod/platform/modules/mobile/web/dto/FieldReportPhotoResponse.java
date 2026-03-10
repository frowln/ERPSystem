package com.privod.platform.modules.mobile.web.dto;

import com.privod.platform.modules.mobile.domain.PhotoCapture;

import java.time.Instant;
import java.util.UUID;

/**
 * Photo response shaped to match the frontend {@code PhotoCapture} interface
 * used by the mobile module.
 */
public record FieldReportPhotoResponse(
        UUID id,
        UUID fieldReportId,
        String fileName,
        String fileUrl,
        String thumbnailUrl,
        String caption,
        Double gpsLatitude,
        Double gpsLongitude,
        UUID takenById,
        String takenByName,
        Instant takenAt,
        String syncStatus
) {
    public static FieldReportPhotoResponse fromEntity(PhotoCapture photo) {
        return fromEntity(photo, null);
    }

    public static FieldReportPhotoResponse fromEntity(PhotoCapture photo, String takenByName) {
        // Extract file name from URL
        String url = photo.getPhotoUrl();
        String fileName = url != null && url.contains("/")
                ? url.substring(url.lastIndexOf('/') + 1)
                : url;

        return new FieldReportPhotoResponse(
                photo.getId(),
                photo.getEntityId(), // entityId = fieldReportId when entityType is FieldReport
                fileName,
                photo.getPhotoUrl(),
                photo.getThumbnailUrl(),
                photo.getDescription(),
                photo.getLatitude(),
                photo.getLongitude(),
                photo.getUserId(),
                takenByName,
                photo.getTakenAt(),
                "SYNCED"
        );
    }
}
