package com.privod.platform.modules.monitoring.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "system_health_checks", indexes = {
        @Index(name = "idx_health_component", columnList = "component"),
        @Index(name = "idx_health_status", columnList = "status"),
        @Index(name = "idx_health_checked_at", columnList = "checked_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthCheck extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "component", nullable = false, length = 50)
    private HealthComponent component;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private HealthStatus status;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "message", length = 1000)
    private String message;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", columnDefinition = "jsonb")
    private Map<String, Object> details;

    @Column(name = "checked_at", nullable = false)
    @Builder.Default
    private Instant checkedAt = Instant.now();
}
