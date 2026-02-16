package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WebhookDeliveryStatus {

    PENDING("Ожидает"),
    DELIVERED("Доставлено"),
    FAILED("Ошибка"),
    RETRYING("Повторная попытка");

    private final String displayName;
}
