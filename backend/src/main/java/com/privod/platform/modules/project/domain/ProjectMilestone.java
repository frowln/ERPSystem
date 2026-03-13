package com.privod.platform.modules.project.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_milestones")
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMilestone extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "is_key_milestone")
    @Builder.Default
    private Boolean isKeyMilestone = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
