package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DeclarationStatus {

    DRAFT("Черновик"),
    CALCULATED("Рассчитана"),
    SUBMITTED("Подана"),
    ACCEPTED("Принята");

    private final String displayName;

    public boolean canTransitionTo(DeclarationStatus target) {
        return switch (this) {
            case DRAFT -> target == CALCULATED;
            case CALCULATED -> target == SUBMITTED || target == DRAFT;
            case SUBMITTED -> target == ACCEPTED;
            case ACCEPTED -> false;
        };
    }
}
