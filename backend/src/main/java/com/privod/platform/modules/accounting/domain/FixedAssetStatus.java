package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FixedAssetStatus {

    DRAFT("Черновик"),
    ACTIVE("В эксплуатации"),
    DISPOSED("Выбыло");

    private final String displayName;

    public boolean canTransitionTo(FixedAssetStatus target) {
        return switch (this) {
            case DRAFT -> target == ACTIVE;
            case ACTIVE -> target == DISPOSED;
            case DISPOSED -> false;
        };
    }
}
