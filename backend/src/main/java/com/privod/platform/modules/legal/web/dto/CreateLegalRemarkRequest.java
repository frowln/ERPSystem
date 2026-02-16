package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.RemarkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateLegalRemarkRequest(
        @NotNull(message = "Идентификатор дела обязателен")
        UUID caseId,

        @NotNull(message = "Автор обязателен")
        UUID authorId,

        LocalDate remarkDate,

        @NotBlank(message = "Содержание замечания обязательно")
        String content,

        @NotNull(message = "Тип замечания обязателен")
        RemarkType remarkType,

        Boolean confidential
) {
}
