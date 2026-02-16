package com.privod.platform.modules.legal.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "legal_cases", indexes = {
        @Index(name = "idx_legal_case_number", columnList = "case_number"),
        @Index(name = "idx_legal_case_project", columnList = "project_id"),
        @Index(name = "idx_legal_case_contract", columnList = "contract_id"),
        @Index(name = "idx_legal_case_status", columnList = "status"),
        @Index(name = "idx_legal_case_type", columnList = "case_type"),
        @Index(name = "idx_legal_case_responsible", columnList = "responsible_id"),
        @Index(name = "idx_legal_case_lawyer", columnList = "lawyer_id"),
        @Index(name = "idx_legal_case_hearing", columnList = "hearing_date"),
        @Index(name = "idx_legal_case_filing", columnList = "filing_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalCase extends BaseEntity {

    @Column(name = "case_number", length = 100)
    private String caseNumber;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "case_type", nullable = false, length = 30)
    private CaseType caseType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CaseStatus status = CaseStatus.OPEN;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "RUB";

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "lawyer_id")
    private UUID lawyerId;

    @Column(name = "court_name", length = 500)
    private String courtName;

    @Column(name = "filing_date")
    private LocalDate filingDate;

    @Column(name = "hearing_date")
    private LocalDate hearingDate;

    @Column(name = "resolution_date")
    private LocalDate resolutionDate;

    @Column(name = "outcome", columnDefinition = "TEXT")
    private String outcome;

    public boolean isClosed() {
        return status == CaseStatus.CLOSED || status == CaseStatus.WON || status == CaseStatus.LOST;
    }
}
