package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.MaterialInspectionResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateMaterialInspectionRequest(
        @NotBlank(message = "Наименование материала обязательно")
        String materialName,

        String supplier,

        String batchNumber,

        String inspectorName,

        @NotNull(message = "Дата входного контроля обязательна")
        LocalDate inspectionDate,

        List<Object> testResults,

        @NotNull(message = "Результат контроля обязателен")
        MaterialInspectionResult result,

        String testProtocolNumber,

        String notes,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        // P1-SAF-6: При result=accepted и наличии этих полей → авто StockMovement(RECEIPT)
        UUID materialId,
        BigDecimal quantity,
        UUID destinationLocationId
) {
}
