package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MessageType {

    TEXT("Текст"),
    SYSTEM("Системное"),
    FILE("Файл"),
    IMAGE("Изображение"),
    VOICE("Голосовое");

    private final String displayName;
}
