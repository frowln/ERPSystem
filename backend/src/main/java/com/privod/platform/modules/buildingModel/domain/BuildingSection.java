package com.privod.platform.modules.buildingModel.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "building_sections", indexes = {
        @Index(name = "idx_building_sections_project", columnList = "project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingSection extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "section_order")
    @Builder.Default
    private Integer sectionOrder = 0;

    @Column(name = "floor_count")
    private Integer floorCount;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "organization_id")
    private UUID organizationId;
}
