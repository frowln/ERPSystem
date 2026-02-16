package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MailTrackingStatus {

    SENT("Отправлено"),
    DELIVERED("Доставлено"),
    OPENED("Открыто"),
    CLICKED("Нажато"),
    BOUNCED("Отклонено"),
    ERROR("Ошибка");

    private final String displayName;
}
