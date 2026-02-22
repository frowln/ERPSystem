package com.privod.platform.modules.finance.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.util.UUID;

@Entity
@Table(name = "project_sections", indexes = {
        @Index(name = "idx_project_section_project", columnList = "project_id"),
        @Index(name = "idx_project_section_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjectSection extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private boolean custom = false;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 0;
}
