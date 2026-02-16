package com.privod.platform.modules.revenueRecognition.domain;

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
@Table(name = "completion_percentages", indexes = {
        @Index(name = "idx_compl_pct_contract", columnList = "revenue_contract_id"),
        @Index(name = "idx_compl_pct_date", columnList = "calculation_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletionPercentage extends BaseEntity {

    @Column(name = "revenue_contract_id", nullable = false)
    private UUID revenueContractId;

    @Column(name = "calculation_date", nullable = false)
    private LocalDate calculationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", length = 30)
    private RecognitionMethod method;

    @Column(name = "cumulative_cost_incurred", precision = 18, scale = 2)
    private BigDecimal cumulativeCostIncurred;

    @Column(name = "total_estimated_cost", precision = 18, scale = 2)
    private BigDecimal totalEstimatedCost;

    @Column(name = "percent_complete", precision = 7, scale = 4)
    private BigDecimal percentComplete;

    @Column(name = "physical_percent_complete", precision = 7, scale = 4)
    private BigDecimal physicalPercentComplete;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "calculated_by_id")
    private UUID calculatedById;
}
