package com.privod.platform.modules.maintenance.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "maintenance_equipment", indexes = {
        @Index(name = "idx_maint_equip_serial", columnList = "serial_number"),
        @Index(name = "idx_maint_equip_status", columnList = "status"),
        @Index(name = "idx_maint_equip_category", columnList = "category"),
        @Index(name = "idx_maint_equip_assigned", columnList = "assigned_to"),
        @Index(name = "idx_maint_equip_next_maint", columnList = "next_maintenance_date"),
        @Index(name = "idx_maint_equip_warranty", columnList = "warranty_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceEquipment extends BaseEntity {

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "model", length = 200)
    private String model;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_date")
    private LocalDate warrantyDate;

    @Column(name = "cost", precision = 18, scale = 2)
    private BigDecimal cost;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EquipmentStatus status = EquipmentStatus.OPERATIONAL;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "last_maintenance_date")
    private LocalDate lastMaintenanceDate;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @Column(name = "maintenance_frequency_days")
    private int maintenanceFrequencyDays;
}
