package com.privod.platform.modules.apiManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WebhookDeliveryStatus {

    PENDING("Ожидает"),
    SENT("Отправлено"),
    FAILED("Ошибка"),
    RETRYING("Повтор");

    private final String displayName;
}
