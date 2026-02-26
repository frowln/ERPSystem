package com.privod.platform.modules.specification.web.dto;

import java.math.BigDecimal;

/**
 * DTO containing a single row extracted from a PDF specification table.
 * All fields except name are optional — the parser fills what it can detect.
 */
public record ParsedSpecItemDto(
        /** Position number from the spec table (e.g. "1", "3.2") */
        String position,

        /** Detected item type: EQUIPMENT or MATERIAL */
        String itemType,

        /** Full name cell text (may include brand/code when columns can't be separated) */
        String name,

        /** Type/brand/model — column 2 in GOST 21.1101 spec table */
        String brand,

        /** Product / catalog code — column 3 */
        String productCode,

        /** Manufacturer — column 4 */
        String manufacturer,

        /** Unit of measure (шт., комп., м, м2, м3, кг, т, пог.м …) */
        String unitOfMeasure,

        /** Quantity */
        BigDecimal quantity,

        /** Mass per unit, kg — column 7 */
        BigDecimal mass,

        /** Remarks — last column */
        String notes,

        /**
         * Section header this item belongs to within the spec PDF.
         * Format: "НАИМЕНОВАНИЕ РАЗДЕЛА (АБВ)" e.g. "СИСТЕМА ОТОПЛЕНИЯ (ОВ)"
         * Null if no section headers were detected.
         */
        String sectionName
) {}
