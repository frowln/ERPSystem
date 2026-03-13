package com.privod.platform.modules.warehouse.domain;

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

/**
 * ОКЕИ — Общероссийский классификатор единиц измерения (ОК 015-94).
 * System-level reference catalog: shared across all tenants (no organizationId).
 */
@Entity
@Table(name = "units_of_measure", indexes = {
        @Index(name = "idx_uom_okei_code", columnList = "okei_code", unique = true),
        @Index(name = "idx_uom_symbol", columnList = "symbol"),
        @Index(name = "idx_uom_group", columnList = "quantity_group")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitOfMeasure extends BaseEntity {

    /** ОКЕИ numeric code, up to 3 digits (e.g. "796" = штука, "166" = кг). */
    @Column(name = "okei_code", nullable = false, length = 3, unique = true)
    private String okeiCode;

    /** Short designation used in documents (шт, м, кг, м2, м3, т …). */
    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    /** Full Russian name of the unit. */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /**
     * Grouping by physical quantity:
     * Масса / Объём / Длина / Площадь / Штучный / Мощность / Прочее / …
     */
    @Column(name = "quantity_group", length = 50)
    private String quantityGroup;

    /**
     * ОКЕИ code of the base (SI) unit for this quantity group.
     * NULL means this unit IS the base unit.
     */
    @Column(name = "base_unit_code", length = 3)
    private String baseUnitCode;

    /**
     * How many base units equal 1 of this unit.
     * E.g. 1 тонна = 1 000 кг → conversionFactor = 1000 (base = кг).
     * NULL when no conversion is defined or this is the base unit.
     */
    @Column(name = "conversion_factor", precision = 18, scale = 6)
    private BigDecimal conversionFactor;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
