package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReconciliationActStatus {

    DRAFT("Черновик"),
    SENT("Отправлен"),
    CONFIRMED("Подтверждён"),
    DISPUTED("Оспорен");

    private final String displayName;

    public boolean canTransitionTo(ReconciliationActStatus target) {
        return switch (this) {
            case DRAFT -> target == SENT;
            case SENT -> target == CONFIRMED || target == DISPUTED;
            case CONFIRMED, DISPUTED -> false;
        };
    }
}
