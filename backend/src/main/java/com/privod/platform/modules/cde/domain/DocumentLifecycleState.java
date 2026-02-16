package com.privod.platform.modules.cde.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentLifecycleState {

    WIP("В работе"),
    SHARED("Общий доступ"),
    PUBLISHED("Опубликован"),
    ARCHIVED("Архив");

    private final String displayName;

    /**
     * ISO 19650 lifecycle: WIP -> SHARED -> PUBLISHED -> ARCHIVED (no backward moves).
     */
    public boolean canTransitionTo(DocumentLifecycleState target) {
        return switch (this) {
            case WIP -> target == SHARED;
            case SHARED -> target == PUBLISHED;
            case PUBLISHED -> target == ARCHIVED;
            case ARCHIVED -> false;
        };
    }
}
