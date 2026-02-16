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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "iot_alert_rules", indexes = {
        @Index(name = "idx_iot_rule_device_type", columnList = "device_type"),
        @Index(name = "idx_iot_rule_metric", columnList = "metric_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTAlertRule extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    private DeviceType deviceType;

    @Column(name = "metric_name", nullable = false, length = 100)
    private String metricName;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 10)
    private RuleCondition condition;

    @Column(name = "threshold_value", nullable = false)
    private Double thresholdValue;

    @Column(name = "threshold_value2")
    private Double thresholdValue2;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private AlertSeverity severity = AlertSeverity.MEDIUM;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notify_user_ids", columnDefinition = "jsonb")
    private List<UUID> notifyUserIds;
}
