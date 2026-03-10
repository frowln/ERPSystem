package com.privod.platform.modules.admin.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSettingRequest(
    @NotBlank(message = "Ключ обязателен")
    String key,
    String value,
    String type,
    String category,
    String description
) {}
