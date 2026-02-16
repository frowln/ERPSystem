package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkNotificationSettingRequest(
        @NotEmpty(message = "Список настроек не может быть пустым")
        @Valid
        List<UpdateNotificationSettingRequest> settings
) {
}
