package com.privod.platform.modules.specification.domain;

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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_analogs", indexes = {
        @Index(name = "idx_ma_original_material", columnList = "original_material_id"),
        @Index(name = "idx_ma_analog_material", columnList = "analog_material_id"),
        @Index(name = "idx_ma_substitution_type", columnList = "substitution_type"),
        @Index(name = "idx_ma_quality_rating", columnList = "quality_rating"),
        @Index(name = "idx_ma_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialAnalog extends BaseEntity {

    @Column(name = "original_material_id", nullable = false)
    private UUID originalMaterialId;

    @Column(name = "original_material_name", length = 500)
    private String originalMaterialName;

    @Column(name = "analog_material_id", nullable = false)
    private UUID analogMaterialId;

    @Column(name = "analog_material_name", length = 500)
    private String analogMaterialName;

    @Enumerated(EnumType.STRING)
    @Column(name = "substitution_type", nullable = false, length = 30)
    private SubstitutionType substitutionType;

    @Column(name = "price_ratio", precision = 10, scale = 4)
    private BigDecimal priceRatio;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_rating", nullable = false, length = 30)
    private QualityRating qualityRating;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "conditions", columnDefinition = "TEXT")
    private String conditions;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
