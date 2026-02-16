package com.privod.platform.modules.integration.govregistries.domain;

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
@Table(name = "registry_check_results", indexes = {
        @Index(name = "idx_rcr_counterparty_id", columnList = "counterparty_id"),
        @Index(name = "idx_rcr_inn", columnList = "inn"),
        @Index(name = "idx_rcr_ogrn", columnList = "ogrn"),
        @Index(name = "idx_rcr_registry_type", columnList = "registry_type"),
        @Index(name = "idx_rcr_check_date", columnList = "check_date"),
        @Index(name = "idx_rcr_status", columnList = "status"),
        @Index(name = "idx_rcr_risk_level", columnList = "risk_level")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistryCheckResult extends BaseEntity {

    @Column(name = "counterparty_id")
    private UUID counterpartyId;

    @Column(name = "inn", nullable = false, length = 12)
    private String inn;

    @Column(name = "ogrn", length = 15)
    private String ogrn;

    @Enumerated(EnumType.STRING)
    @Column(name = "registry_type", nullable = false, length = 20)
    private RegistryType registryType;

    @Column(name = "check_date", nullable = false)
    private Instant checkDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CheckStatus status;

    @Column(name = "company_name", length = 500)
    private String companyName;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "chief_name", length = 255)
    private String chiefName;

    @Column(name = "authorized_capital", precision = 15, scale = 2)
    private BigDecimal authorizedCapital;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 10)
    private RiskLevel riskLevel;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "warnings", columnDefinition = "TEXT")
    private String warnings;
}
