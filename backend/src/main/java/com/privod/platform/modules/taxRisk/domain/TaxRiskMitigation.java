package com.privod.platform.modules.taxRisk.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tax_risk_mitigations", indexes = {
        @Index(name = "idx_tax_risk_mitig_assessment", columnList = "assessment_id"),
        @Index(name = "idx_tax_risk_mitig_factor", columnList = "factor_id"),
        @Index(name = "idx_tax_risk_mitig_status", columnList = "status"),
        @Index(name = "idx_tax_risk_mitig_deadline", columnList = "deadline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRiskMitigation extends BaseEntity {

    @Column(name = "assessment_id", nullable = false)
    private UUID assessmentId;

    @Column(name = "factor_id")
    private UUID factorId;

    @Column(name = "action", nullable = false, length = 1000)
    private String action;

    @Column(name = "responsible", length = 255)
    private String responsible;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MitigationStatus status = MitigationStatus.PLANNED;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;
}
