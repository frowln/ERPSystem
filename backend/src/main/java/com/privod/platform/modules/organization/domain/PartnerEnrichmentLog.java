package com.privod.platform.modules.organization.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "partner_enrichment_logs", indexes = {
        @Index(name = "idx_enrichment_log_partner", columnList = "partner_id"),
        @Index(name = "idx_enrichment_log_status", columnList = "status"),
        @Index(name = "idx_enrichment_log_requested_at", columnList = "requested_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerEnrichmentLog extends BaseEntity {

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @Column(name = "source", nullable = false, length = 50)
    private String source;

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private Instant requestedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EnrichmentLogStatus status = EnrichmentLogStatus.SUCCESS;

    @Column(name = "response_data", columnDefinition = "JSONB")
    private String responseData;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
