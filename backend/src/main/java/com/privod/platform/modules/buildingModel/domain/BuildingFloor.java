package com.privod.platform.modules.buildingModel.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "building_floors", indexes = {
        @Index(name = "idx_building_floors_section", columnList = "section_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingFloor extends BaseEntity {

    @Column(name = "section_id", nullable = false)
    private UUID sectionId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "floor_number")
    private Integer floorNumber;

    @Column(name = "elevation", precision = 10, scale = 3)
    private BigDecimal elevation;

    @Column(name = "area", precision = 12, scale = 2)
    private BigDecimal area;

    @Column(name = "organization_id")
    private UUID organizationId;
}
