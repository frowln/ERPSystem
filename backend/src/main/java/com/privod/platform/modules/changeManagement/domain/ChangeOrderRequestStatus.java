package com.privod.platform.modules.changeManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChangeOrderRequestStatus {

    DRAFT("Черновик"),
    SUBMITTED("Подан"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён"),
    REVISED("Пересмотрен");

    private final String displayName;

    public boolean canTransitionTo(ChangeOrderRequestStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == UNDER_REVIEW;
            case UNDER_REVIEW -> target == APPROVED || target == REJECTED;
            case REJECTED -> target == REVISED;
            case REVISED -> target == SUBMITTED;
            case APPROVED -> false;
        };
    }
}
