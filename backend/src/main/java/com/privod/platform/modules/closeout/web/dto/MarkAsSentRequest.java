package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;

public record MarkAsSentRequest(
        @NotBlank String sentTo
) {
}
