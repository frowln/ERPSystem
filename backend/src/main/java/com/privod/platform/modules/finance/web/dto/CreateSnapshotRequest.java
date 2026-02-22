package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSnapshotRequest(
        @NotBlank(message = "Название снимка обязательно")
        @Size(max = 200, message = "Название снимка не должно превышать 200 символов")
        String name,

        String notes
) {
}
