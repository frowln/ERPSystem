package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MessageRole {
    USER("Пользователь"),
    ASSISTANT("Ассистент"),
    SYSTEM("Системное");

    private final String displayName;
}
