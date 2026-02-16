package com.privod.platform.modules.closing.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClosingDocumentStatus {

    DRAFT("Черновик"),
    SUBMITTED("На рассмотрении"),
    SIGNED("Подписан"),
    CLOSED("Закрыт");

    private final String displayName;

    public boolean canTransitionTo(ClosingDocumentStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == SIGNED || target == DRAFT;
            case SIGNED -> target == CLOSED;
            case CLOSED -> false;
        };
    }
}
