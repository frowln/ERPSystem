package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.WbsNodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateWbsNodeRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        UUID parentId,

        @Size(max = 100, message = "Код не должен превышать 100 символов")
        String code,

        @NotBlank(message = "Наименование обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        WbsNodeType nodeType,

        Integer level,
        Integer sortOrder,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        Integer duration,
        BigDecimal percentComplete,
        BigDecimal plannedVolume,
        String volumeUnitOfMeasure,
        UUID costCodeId,
        UUID responsibleId
) {
}
