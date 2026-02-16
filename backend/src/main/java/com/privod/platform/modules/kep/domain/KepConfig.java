package com.privod.platform.modules.kep.domain;

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

@Entity
@Table(name = "kep_configs", indexes = {
        @Index(name = "idx_kep_config_provider", columnList = "provider_type"),
        @Index(name = "idx_kep_config_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KepConfig extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false, length = 30)
    private KepProviderType providerType;

    @Column(name = "api_endpoint", length = 500)
    private String apiEndpoint;

    @Column(name = "api_key", length = 500)
    private String apiKey;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "settings", columnDefinition = "TEXT")
    private String settings;
}
