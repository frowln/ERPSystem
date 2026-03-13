package com.privod.platform.modules.contractExt.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contract_milestones", indexes = {
        @Index(name = "idx_milestone_contract", columnList = "contract_id"),
        @Index(name = "idx_milestone_status", columnList = "status"),
        @Index(name = "idx_milestone_due_date", columnList = "due_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractMilestone extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "completion_criteria", columnDefinition = "TEXT")
    private String completionCriteria;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "evidence_url", length = 1000)
    private String evidenceUrl;
}
