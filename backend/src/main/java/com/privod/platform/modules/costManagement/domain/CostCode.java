package com.privod.platform.modules.costManagement.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "cost_codes", indexes = {
        @Index(name = "idx_cost_code_project", columnList = "project_id"),
        @Index(name = "idx_cost_code_parent", columnList = "parent_id"),
        @Index(name = "idx_cost_code_level", columnList = "level")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_cost_code_project", columnNames = {"project_id", "code"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostCode extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "parent_id")
    private UUID parentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 20)
    @Builder.Default
    private CostCodeLevel level = CostCodeLevel.LEVEL1;

    @Column(name = "budget_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal budgetAmount = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
