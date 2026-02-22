package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.ConnectorInstallation;
import com.privod.platform.modules.apiManagement.domain.ConnectorInstallationStatus;

import java.time.Instant;
import java.util.UUID;

public record ConnectorInstallationResponse(
        UUID id,
        UUID organizationId,
        UUID connectorId,
        String configJson,
        ConnectorInstallationStatus status,
        String statusDisplayName,
        Instant lastSyncAt,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {
    public static ConnectorInstallationResponse fromEntity(ConnectorInstallation entity) {
        return new ConnectorInstallationResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getConnectorId(),
                entity.getConfigJson(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getLastSyncAt(),
                entity.getErrorMessage(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
