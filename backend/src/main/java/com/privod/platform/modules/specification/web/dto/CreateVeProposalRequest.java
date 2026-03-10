package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for creating a VE (Value Engineering) proposal from the frontend modal.
 * Accepts name-based fields instead of UUIDs, since materials are entered as free text.
 * requestedById is auto-filled from the authenticated user in the controller.
 */
public record CreateVeProposalRequest(
        // Project context (optional — page may not have project context)
        UUID projectId,

        // Specification item link (optional — used when proposing replacement from spec detail page)
        UUID specItemId,

        // Original material
        @NotBlank(message = "Наименование исходного материала обязательно")
        @Size(max = 500)
        String originalMaterialName,

        @Size(max = 255)
        String originalMaterialCode,

        @NotNull(message = "Цена за единицу исходного материала обязательна")
        @Positive(message = "Цена должна быть больше нуля")
        BigDecimal originalPrice,

        // Analog material
        @NotBlank(message = "Наименование аналога обязательно")
        @Size(max = 500)
        String analogMaterialName,

        @Size(max = 255)
        String analogBrand,

        @Size(max = 255)
        String analogManufacturer,

        @NotNull(message = "Цена за единицу аналога обязательна")
        @Positive(message = "Цена должна быть больше нуля")
        BigDecimal analogPrice,

        @NotNull(message = "Количество обязательно")
        @Positive(message = "Количество должно быть больше нуля")
        BigDecimal quantity,

        // Quality impact: NO_IMPACT, IMPROVEMENT, ACCEPTABLE_REDUCTION
        @NotBlank(message = "Влияние на качество обязательно")
        String qualityImpact,

        // Justification / reason for the substitution
        @NotBlank(message = "Обоснование замены обязательно")
        String reason
) {
}
