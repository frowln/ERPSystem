package com.privod.platform.modules.apiManagement.domain;

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

import java.util.UUID;

@Entity
@Table(name = "api_rate_limits", indexes = {
        @Index(name = "idx_arl_key", columnList = "api_key_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiRateLimit extends BaseEntity {

    @Column(name = "api_key_id", nullable = false)
    private UUID apiKeyId;

    @Column(name = "requests_per_minute", nullable = false)
    @Builder.Default
    private int requestsPerMinute = 60;

    @Column(name = "requests_per_hour", nullable = false)
    @Builder.Default
    private int requestsPerHour = 1000;

    @Column(name = "requests_per_day", nullable = false)
    @Builder.Default
    private int requestsPerDay = 10000;

    @Column(name = "burst_limit", nullable = false)
    @Builder.Default
    private int burstLimit = 10;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
