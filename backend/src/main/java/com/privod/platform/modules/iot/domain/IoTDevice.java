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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "iot_devices", indexes = {
        @Index(name = "idx_iot_device_code", columnList = "code"),
        @Index(name = "idx_iot_device_project", columnList = "project_id"),
        @Index(name = "idx_iot_device_type", columnList = "device_type"),
        @Index(name = "idx_iot_device_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IoTDevice extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    private DeviceType deviceType;

    @Column(name = "serial_number", nullable = false, length = 200)
    private String serialNumber;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DeviceStatus status = DeviceStatus.OFFLINE;

    @Column(name = "last_data_at")
    private Instant lastDataAt;

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(name = "firmware_version", length = 100)
    private String firmwareVersion;
}
