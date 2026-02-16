package com.privod.platform.modules.quality.domain;

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

@Entity
@Table(name = "tolerance_rules", indexes = {
        @Index(name = "idx_tr_code", columnList = "code", unique = true),
        @Index(name = "idx_tr_category", columnList = "category"),
        @Index(name = "idx_tr_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToleranceRule extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private ToleranceCategory category;

    @Column(name = "parameter_name", nullable = false, length = 500)
    private String parameterName;

    @Column(name = "nominal_value", precision = 16, scale = 4)
    private BigDecimal nominalValue;

    @Column(name = "min_value", precision = 16, scale = 4)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 16, scale = 4)
    private BigDecimal maxValue;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "standard_reference", length = 255)
    private String standardReference;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
