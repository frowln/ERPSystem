package com.privod.platform.modules.mobile.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PushNotificationStatus {
    PENDING("Ожидание"),
    SENT("Отправлено"),
    DELIVERED("Доставлено"),
    FAILED("Ошибка");

    private final String displayName;
}
