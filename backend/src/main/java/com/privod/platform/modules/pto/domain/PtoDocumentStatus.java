package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PtoDocumentStatus {

    DRAFT("Черновик"),
    IN_REVIEW("На проверке"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён"),
    ARCHIVED("В архиве");

    private final String displayName;

    public boolean canTransitionTo(PtoDocumentStatus target) {
        return switch (this) {
            case DRAFT -> target == IN_REVIEW;
            case IN_REVIEW -> target == APPROVED || target == REJECTED;
            case APPROVED -> target == ARCHIVED;
            case REJECTED -> target == DRAFT;
            case ARCHIVED -> false;
        };
    }
}
