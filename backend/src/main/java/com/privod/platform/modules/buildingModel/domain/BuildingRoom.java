package com.privod.platform.modules.buildingModel.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "building_rooms", indexes = {
        @Index(name = "idx_building_rooms_floor", columnList = "floor_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingRoom extends BaseEntity {

    @Column(name = "floor_id", nullable = false)
    private UUID floorId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "room_type", length = 50)
    private String roomType;

    @Column(name = "area", precision = 10, scale = 2)
    private BigDecimal area;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "organization_id")
    private UUID organizationId;
}
