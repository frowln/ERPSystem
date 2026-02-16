package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum JournalEntryStatus {

    DRAFT("Черновик"),
    POSTED("Проведена"),
    CANCELLED("Отменена");

    private final String displayName;

    public boolean canTransitionTo(JournalEntryStatus target) {
        return switch (this) {
            case DRAFT -> target == POSTED || target == CANCELLED;
            case POSTED -> target == CANCELLED;
            case CANCELLED -> false;
        };
    }
}
