package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DeadlineStatus {

    UPCOMING("Предстоящий"),
    DUE("К сдаче"),
    SUBMITTED("Сдан"),
    OVERDUE("Просрочен"),
    SKIPPED("Пропущен");

    private final String displayName;
}
