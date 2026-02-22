package com.privod.platform.modules.apiManagement.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "connector_installations", indexes = {
        @Index(name = "idx_ci_org", columnList = "organization_id"),
        @Index(name = "idx_ci_connector", columnList = "connector_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectorInstallation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "connector_id", nullable = false)
    private UUID connectorId;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ConnectorInstallationStatus status = ConnectorInstallationStatus.INSTALLED;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
