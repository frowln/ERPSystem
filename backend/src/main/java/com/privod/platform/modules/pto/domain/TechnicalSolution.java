package com.privod.platform.modules.pto.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "technical_solutions", indexes = {
        @Index(name = "idx_tech_solution_project", columnList = "project_id"),
        @Index(name = "idx_tech_solution_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicalSolution extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "problem", nullable = false, columnDefinition = "TEXT")
    private String problem;

    @Column(name = "solution", nullable = false, columnDefinition = "TEXT")
    private String solution;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TechnicalSolutionStatus status = TechnicalSolutionStatus.DRAFT;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "cost", precision = 18, scale = 2)
    private BigDecimal cost;

    @Column(name = "drawing_url", length = 1000)
    private String drawingUrl;

    public boolean canTransitionTo(TechnicalSolutionStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
