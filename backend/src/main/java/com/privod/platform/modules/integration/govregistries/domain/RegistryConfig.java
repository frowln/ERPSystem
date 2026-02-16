package com.privod.platform.modules.integration.govregistries.domain;

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
@Table(name = "registry_configs", indexes = {
        @Index(name = "idx_rc_registry_type", columnList = "registry_type", unique = true),
        @Index(name = "idx_rc_enabled", columnList = "enabled")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistryConfig extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "registry_type", nullable = false, unique = true, length = 20)
    private RegistryType registryType;

    @Column(name = "api_url", length = 1000)
    private String apiUrl;

    @Column(name = "api_key", columnDefinition = "TEXT")
    private String apiKey;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;
}
