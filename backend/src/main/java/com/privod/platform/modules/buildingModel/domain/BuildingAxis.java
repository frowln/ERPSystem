package com.privod.platform.modules.buildingModel.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "building_axes", indexes = {
        @Index(name = "idx_building_axes_section", columnList = "section_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingAxis extends BaseEntity {

    @Column(name = "section_id", nullable = false)
    private UUID sectionId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "axis_type", nullable = false, length = 10)
    private String axisType;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "position", precision = 10, scale = 3)
    private BigDecimal position;

    @Column(name = "organization_id")
    private UUID organizationId;
}
