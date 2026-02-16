package com.privod.platform.modules.design.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateDesignVersionRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        UUID documentId,

        @NotBlank(message = "Номер версии обязателен")
        @Size(max = 50, message = "Номер версии не должен превышать 50 символов")
        String versionNumber,

        @NotBlank(message = "Заголовок обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @Size(max = 100, message = "Дисциплина не должна превышать 100 символов")
        String discipline,

        @Size(max = 255, message = "Автор не должен превышать 255 символов")
        String author,

        LocalDate reviewDeadline,
        String fileUrl,
        Long fileSize,
        String changeDescription
) {
}
