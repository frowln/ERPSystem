package com.privod.platform.modules.email.web.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ForwardEmailRequest(
        @NotEmpty(message = "Укажите хотя бы одного получателя")
        List<String> to,

        List<String> cc,

        String bodyHtml
) {
}
