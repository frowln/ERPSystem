package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    EMAIL("Электронная почта"),
    PUSH("Push-уведомление"),
    TELEGRAM("Telegram"),
    IN_APP("В приложении");

    private final String displayName;
}
