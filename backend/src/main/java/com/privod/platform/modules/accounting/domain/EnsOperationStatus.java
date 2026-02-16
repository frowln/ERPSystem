package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnsOperationStatus {

    PENDING("Ожидает"),
    PROCESSED("Обработан"),
    CANCELLED("Отменён");

    private final String displayName;

    public boolean canTransitionTo(EnsOperationStatus target) {
        return switch (this) {
            case PENDING -> target == PROCESSED || target == CANCELLED;
            case PROCESSED, CANCELLED -> false;
        };
    }
}
