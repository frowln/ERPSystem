package com.privod.platform.modules.accounting.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "cost_centers", indexes = {
        @Index(name = "idx_cost_center_code", columnList = "code"),
        @Index(name = "idx_cost_center_project", columnList = "project_id"),
        @Index(name = "idx_cost_center_parent", columnList = "parent_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCenter extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
