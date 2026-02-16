package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MailNotificationType {

    INBOX("Входящие"),
    EMAIL("Электронная почта"),
    PUSH("Push-уведомление");

    private final String displayName;
}
