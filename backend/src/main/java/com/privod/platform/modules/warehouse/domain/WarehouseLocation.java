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

import java.util.UUID;

@Entity
@Table(name = "warehouse_locations", indexes = {
        @Index(name = "idx_wh_location_org", columnList = "organization_id"),
        @Index(name = "idx_wh_location_org_code", columnList = "organization_id, code", unique = true),
        @Index(name = "idx_wh_location_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_wh_location_type", columnList = "location_type"),
        @Index(name = "idx_wh_location_project", columnList = "project_id"),
        @Index(name = "idx_wh_location_code", columnList = "code"),
        @Index(name = "idx_wh_location_parent", columnList = "parent_id"),
        @Index(name = "idx_wh_location_responsible", columnList = "responsible_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseLocation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "code", length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 30)
    private WarehouseLocationType locationType;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "address", length = 1000)
    private String address;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "responsible_name", length = 500)
    private String responsibleName;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
