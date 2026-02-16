package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ViolationStatus {

    DETECTED("Обнаружено"),
    NOTIFIED("Уведомлено"),
    ACKNOWLEDGED("Подтверждено"),
    RESOLVED("Урегулировано");

    private final String displayName;
}
