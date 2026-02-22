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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "iot_telemetry_points", indexes = {
        @Index(name = "idx_iot_telemetry_org", columnList = "organization_id"),
        @Index(name = "idx_iot_telemetry_device", columnList = "device_id"),
        @Index(name = "idx_iot_telemetry_device_time", columnList = "device_id, recorded_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IotTelemetryPoint extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "altitude")
    private Double altitude;

    @Column(name = "speed")
    private Double speed;

    @Column(name = "heading")
    private Double heading;

    @Column(name = "engine_hours")
    private Double engineHours;

    @Column(name = "fuel_level_percent")
    private Double fuelLevelPercent;

    @Column(name = "fuel_consumed_liters")
    private Double fuelConsumedLiters;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "battery_level")
    private Double batteryLevel;

    @Column(name = "raw_payload_json", columnDefinition = "TEXT")
    private String rawPayloadJson;
}
