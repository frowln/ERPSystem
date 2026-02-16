package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.LabTestConclusion;
import com.privod.platform.modules.pto.domain.LabTestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateLabTestRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название материала обязательно")
        String materialName,

        @NotNull(message = "Тип испытания обязателен")
        LabTestType testType,

        String sampleNumber,

        @NotNull(message = "Дата испытания обязательна")
        LocalDate testDate,

        String result,

        @NotNull(message = "Заключение обязательно")
        LabTestConclusion conclusion,

        String protocolUrl,

        String labName,

        UUID performedById
) {
}
