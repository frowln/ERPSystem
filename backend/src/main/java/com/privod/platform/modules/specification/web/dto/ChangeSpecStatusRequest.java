package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.SpecificationStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeSpecStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        SpecificationStatus status
) {
}
