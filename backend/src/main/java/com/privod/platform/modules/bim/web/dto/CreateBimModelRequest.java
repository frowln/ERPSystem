package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimModelFormat;
import com.privod.platform.modules.bim.domain.BimModelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateBimModelRequest(
        @NotBlank(message = "Название модели обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Тип модели обязателен")
        BimModelType modelType,

        @NotNull(message = "Формат файла обязателен")
        BimModelFormat format,

        String fileUrl,
        Long fileSize,
        String description,
        UUID uploadedById
) {
}
