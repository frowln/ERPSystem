package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCustomSectionRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 200) String name
) {}
