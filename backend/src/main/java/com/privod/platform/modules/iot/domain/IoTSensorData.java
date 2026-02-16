package com.privod.platform.modules.iot.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "iot_sensor_data", indexes = {
        @Index(name = "idx_iot_sensor_device", columnList = "device_id"),
        @Index(name = "idx_iot_sensor_timestamp", columnList = "timestamp"),
        @Index(name = "idx_iot_sensor_metric", columnList = "metric_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTSensorData extends BaseEntity {

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "timestamp", nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(name = "metric_name", nullable = false, length = 100)
    private String metricName;

    @Column(name = "metric_value", nullable = false)
    private Double metricValue;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "is_anomaly", nullable = false)
    @Builder.Default
    private Boolean isAnomaly = false;
}
