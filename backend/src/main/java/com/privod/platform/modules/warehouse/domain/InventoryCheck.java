package com.privod.platform.modules.warehouse.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "inventory_checks", indexes = {
        @Index(name = "idx_ic_date", columnList = "check_date"),
        @Index(name = "idx_ic_location", columnList = "location_id"),
        @Index(name = "idx_ic_project", columnList = "project_id"),
        @Index(name = "idx_ic_status", columnList = "status"),
        @Index(name = "idx_ic_name", columnList = "name", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheck extends BaseEntity {

    @Column(name = "name", unique = true, length = 50)
    private String name;

    @Column(name = "check_date", nullable = false)
    private LocalDate checkDate;

    @Column(name = "location_id", nullable = false)
    private UUID locationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private InventoryCheckStatus status = InventoryCheckStatus.PLANNED;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 500)
    private String responsibleName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
