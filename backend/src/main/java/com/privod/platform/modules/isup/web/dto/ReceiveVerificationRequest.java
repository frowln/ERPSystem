package com.privod.platform.modules.isup.web.dto;

import com.privod.platform.modules.isup.domain.IsupVerificationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ReceiveVerificationRequest(
        @NotNull(message = "ID передачи обязателен")
        UUID transmissionId,

        @NotNull(message = "Тип верификации обязателен")
        IsupVerificationType verificationType,

        @Size(max = 255, message = "Имя проверяющего не должно превышать 255 символов")
        String verifiedByName,

        String comments,

        @Size(max = 255, message = "Внешняя ссылка не должна превышать 255 символов")
        String externalReference
) {
}
