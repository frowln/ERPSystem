package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.AnnotationType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDrawingAnnotationRequest(
        @NotNull(message = "Идентификатор чертежа обязателен")
        UUID drawingId,

        UUID authorId,

        @NotNull(message = "Координата X обязательна")
        Double x,

        @NotNull(message = "Координата Y обязательна")
        Double y,

        Double width,
        Double height,
        String content,

        @NotNull(message = "Тип аннотации обязателен")
        AnnotationType annotationType
) {
}
