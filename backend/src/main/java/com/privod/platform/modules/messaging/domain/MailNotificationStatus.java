package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MailNotificationStatus {

    READY("Готово"),
    SENT("Отправлено"),
    BOUNCE("Отклонено"),
    EXCEPTION("Ошибка"),
    CANCELLED("Отменено");

    private final String displayName;
}
