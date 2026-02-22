package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AiContextType {
    PROJECT("Проект"),
    DOCUMENT("Документ"),
    ESTIMATE("Смета"),
    SAFETY("Охрана труда"),
    FINANCE("Финансы"),
    GENERAL("Общий");

    private final String displayName;
}
