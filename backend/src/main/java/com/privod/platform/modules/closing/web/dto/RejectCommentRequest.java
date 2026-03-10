package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectCommentRequest(
        @NotBlank(message = "Комментарий обязателен при отклонении")
        String comment
) {
}
