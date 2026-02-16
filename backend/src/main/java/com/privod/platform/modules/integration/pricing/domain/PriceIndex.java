package com.privod.platform.modules.integration.pricing.domain;

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

@Entity
@Table(name = "price_indices", indexes = {
        @Index(name = "idx_pi_region", columnList = "region"),
        @Index(name = "idx_pi_work_type", columnList = "work_type"),
        @Index(name = "idx_pi_base_quarter", columnList = "base_quarter"),
        @Index(name = "idx_pi_target_quarter", columnList = "target_quarter"),
        @Index(name = "idx_pi_region_work_type", columnList = "region, work_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceIndex extends BaseEntity {

    @Column(name = "region", nullable = false, length = 255)
    private String region;

    @Column(name = "work_type", nullable = false, length = 100)
    private String workType;

    @Column(name = "base_quarter", nullable = false, length = 20)
    private String baseQuarter;

    @Column(name = "target_quarter", nullable = false, length = 20)
    private String targetQuarter;

    @Column(name = "index_value", nullable = false, precision = 10, scale = 4)
    private BigDecimal indexValue;

    @Column(name = "source", length = 500)
    private String source;
}
