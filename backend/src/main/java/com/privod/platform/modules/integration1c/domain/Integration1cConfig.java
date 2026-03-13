package com.privod.platform.modules.integration1c.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "integration_1c_configs", indexes = {
        @Index(name = "idx_i1c_config_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Integration1cConfig extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "encrypted_password", length = 500)
    private String encryptedPassword;

    @Column(name = "database_name", length = 255)
    private String databaseName;

    @Column(name = "sync_enabled", nullable = false)
    @Builder.Default
    private boolean syncEnabled = false;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "sync_interval_minutes", nullable = false)
    @Builder.Default
    private int syncIntervalMinutes = 60;
}
