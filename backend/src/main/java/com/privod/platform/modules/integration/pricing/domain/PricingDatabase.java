package com.privod.platform.modules.integration.pricing.domain;

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

@Entity
@Table(name = "pricing_databases", indexes = {
        @Index(name = "idx_pdb_name", columnList = "name"),
        @Index(name = "idx_pdb_type", columnList = "type"),
        @Index(name = "idx_pdb_region", columnList = "region"),
        @Index(name = "idx_pdb_active", columnList = "active"),
        @Index(name = "idx_pdb_base_year", columnList = "base_year")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingDatabase extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private PricingDatabaseType type;

    @Column(name = "region", length = 255)
    private String region;

    @Column(name = "base_year", nullable = false)
    private Integer baseYear;

    @Column(name = "coefficient_to_current_prices", precision = 10, scale = 4)
    private BigDecimal coefficientToCurrentPrices;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
