package com.privod.platform.modules.admin.web.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateSettingRequest(
    @NotNull(message = "Значение обязательно")
    String value,
    String updatedBy
) {}
