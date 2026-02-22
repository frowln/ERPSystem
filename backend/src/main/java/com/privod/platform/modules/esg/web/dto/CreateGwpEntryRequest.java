package com.privod.platform.modules.esg.web.dto;

import com.privod.platform.modules.esg.domain.EsgMaterialCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateGwpEntryRequest(
        @NotNull EsgMaterialCategory materialCategory,
        String materialSubcategory,
        @NotBlank String name,
        @NotNull BigDecimal gwpPerUnit,
        @NotBlank String unit,
        String source,
        String country,
        Integer dataYear,
        String notes
) {}
