package com.privod.platform.modules.esg.domain;

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
@Table(name = "material_gwp_entries", indexes = {
        @Index(name = "idx_mgwp_category", columnList = "material_category"),
        @Index(name = "idx_mgwp_name", columnList = "name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialGwpEntry extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "material_category", nullable = false, length = 100)
    private EsgMaterialCategory materialCategory;

    @Column(name = "material_subcategory", length = 200)
    private String materialSubcategory;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "gwp_per_unit", nullable = false, precision = 15, scale = 4)
    private BigDecimal gwpPerUnit;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "country", length = 10)
    @Builder.Default
    private String country = "RU";

    @Column(name = "data_year")
    private Integer dataYear;

    @Column(name = "is_verified")
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
