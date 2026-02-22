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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "iot_equipment_devices", indexes = {
        @Index(name = "idx_iot_eq_dev_org", columnList = "organization_id"),
        @Index(name = "idx_iot_eq_dev_serial", columnList = "device_serial"),
        @Index(name = "idx_iot_eq_dev_type", columnList = "device_type"),
        @Index(name = "idx_iot_eq_dev_equipment", columnList = "equipment_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IotEquipmentDevice extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "device_serial", nullable = false, length = 100)
    private String deviceSerial;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    private IotDeviceType deviceType;

    @Column(name = "equipment_id")
    private UUID equipmentId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "manufacturer", length = 255)
    private String manufacturer;

    @Column(name = "model", length = 255)
    private String model;

    @Column(name = "firmware_version", length = 100)
    private String firmwareVersion;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;
}
