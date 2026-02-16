package com.privod.platform.modules.integration.domain;

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

import java.time.Instant;

@Entity
@Table(name = "onec_configs", indexes = {
        @Index(name = "idx_onec_cfg_name", columnList = "name"),
        @Index(name = "idx_onec_cfg_active", columnList = "is_active"),
        @Index(name = "idx_onec_cfg_direction", columnList = "sync_direction")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneCConfig extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "base_url", nullable = false, length = 1000)
    private String baseUrl;

    @Column(name = "username", nullable = false, length = 255)
    private String username;

    @Column(name = "password", nullable = false, columnDefinition = "TEXT")
    private String password;

    @Column(name = "database_name", nullable = false, length = 255)
    private String databaseName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_direction", nullable = false, length = 20)
    @Builder.Default
    private SyncDirection syncDirection = SyncDirection.BIDIRECTIONAL;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "sync_interval_minutes", nullable = false)
    @Builder.Default
    private int syncIntervalMinutes = 60;
}
