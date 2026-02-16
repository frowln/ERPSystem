package com.privod.platform.modules.accounting.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record DeleteAccountEntriesRequest(
        @NotEmpty(message = "Список проводок не должен быть пустым")
        @Size(max = 200, message = "За один запрос можно удалить не более 200 проводок")
        List<@NotNull(message = "ID проводки обязателен") UUID> entryIds
) {
}
