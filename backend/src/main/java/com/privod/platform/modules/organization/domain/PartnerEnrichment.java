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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "partner_enrichments", indexes = {
        @Index(name = "idx_partner_enrichment_partner", columnList = "partner_id"),
        @Index(name = "idx_partner_enrichment_inn", columnList = "inn"),
        @Index(name = "idx_partner_enrichment_ogrn", columnList = "ogrn"),
        @Index(name = "idx_partner_enrichment_status", columnList = "status"),
        @Index(name = "idx_partner_enrichment_source", columnList = "source")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerEnrichment extends BaseEntity {

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @Column(name = "inn", length = 12)
    private String inn;

    @Column(name = "ogrn", length = 15)
    private String ogrn;

    @Column(name = "kpp", length = 9)
    private String kpp;

    @Column(name = "legal_name", length = 500)
    private String legalName;

    @Column(name = "trade_name", length = 500)
    private String tradeName;

    @Column(name = "legal_address", length = 1000)
    private String legalAddress;

    @Column(name = "actual_address", length = 1000)
    private String actualAddress;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private PartnerLegalStatus status = PartnerLegalStatus.ACTIVE;

    @Column(name = "authorized_capital", precision = 18, scale = 2)
    private BigDecimal authorizedCapital;

    @Column(name = "ceo_name", length = 500)
    private String ceoName;

    @Column(name = "ceo_inn", length = 12)
    private String ceoInn;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "main_activity", length = 500)
    private String mainActivity;

    @Column(name = "okved_code", length = 20)
    private String okvedCode;

    @Column(name = "enriched_at")
    private Instant enrichedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    @Builder.Default
    private EnrichmentSource source = EnrichmentSource.MANUAL;

    @Column(name = "reliability_score")
    @Builder.Default
    private int reliabilityScore = 0;
}
