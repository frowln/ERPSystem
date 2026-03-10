package com.privod.platform.modules.notification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationChannel {

    EMAIL("Email"),
    PUSH("Push-уведомление"),
    IN_APP("В приложении");

    private final String displayName;
}
