package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.WarehouseLocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateWarehouseLocationRequest(
        @NotBlank(message = "Наименование склада обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        @Size(max = 50, message = "Код не должен превышать 50 символов")
        String code,

        WarehouseLocationType locationType,

        UUID projectId,

        @Size(max = 1000, message = "Адрес не должен превышать 1000 символов")
        String address,

        UUID responsibleId,

        @Size(max = 500)
        String responsibleName,

        UUID parentId
) {
}
