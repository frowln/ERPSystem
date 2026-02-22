package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClaimAuthorType;
import jakarta.validation.constraints.NotBlank;

public record AddClaimCommentRequest(
        @NotBlank(message = "Текст комментария обязателен")
        String content,

        ClaimAuthorType authorType
) {
}
