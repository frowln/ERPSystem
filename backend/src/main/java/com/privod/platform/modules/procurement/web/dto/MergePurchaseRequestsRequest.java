package com.privod.platform.modules.procurement.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record MergePurchaseRequestsRequest(
        @NotEmpty(message = "Список идентификаторов заявок обязателен")
        List<UUID> requestIds,

        @NotNull(message = "Название объединённой заявки обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String title,

        @Size(max = 5000, message = "Комментарий не должен превышать 5000 символов")
        String comment
) {
}
