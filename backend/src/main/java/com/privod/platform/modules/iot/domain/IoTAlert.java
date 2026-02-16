package com.privod.platform.modules.iot.domain;

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
import java.util.UUID;

@Entity
@Table(name = "iot_alerts", indexes = {
        @Index(name = "idx_iot_alert_device", columnList = "device_id"),
        @Index(name = "idx_iot_alert_type", columnList = "alert_type"),
        @Index(name = "idx_iot_alert_severity", columnList = "severity"),
        @Index(name = "idx_iot_alert_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTAlert extends BaseEntity {

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 30)
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private AlertSeverity severity = AlertSeverity.MEDIUM;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "threshold_value")
    private Double thresholdValue;

    @Column(name = "actual_value")
    private Double actualValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(name = "acknowledged_by_id")
    private UUID acknowledgedById;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
