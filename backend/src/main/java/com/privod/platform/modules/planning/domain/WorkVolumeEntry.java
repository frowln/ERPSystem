package com.privod.platform.modules.planning.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "work_volume_entries", indexes = {
        @Index(name = "idx_wve_project", columnList = "project_id"),
        @Index(name = "idx_wve_wbs_node", columnList = "wbs_node_id"),
        @Index(name = "idx_wve_date", columnList = "record_date"),
        @Index(name = "idx_wve_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkVolumeEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "wbs_node_id", nullable = false)
    private UUID wbsNodeId;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_of_measure", nullable = false, length = 50)
    private String unitOfMeasure;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Transient
    private UUID creatorId;
}
