package com.privod.platform.modules.portfolio.domain;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tender_submissions", indexes = {
        @Index(name = "idx_tender_submission_bid", columnList = "bid_package_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenderSubmission extends BaseEntity {

    @Column(name = "bid_package_id", nullable = false)
    private UUID bidPackageId;

    @Column(name = "version", insertable = false, updatable = false)
    private Integer submissionVersion;

    @Column(name = "technical_proposal", columnDefinition = "TEXT")
    private String technicalProposal;

    @Column(name = "commercial_summary", columnDefinition = "TEXT")
    private String commercialSummary;

    @Column(name = "total_price", precision = 18, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "final_price", precision = 18, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "submitted_by_id")
    private UUID submittedById;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;
}
