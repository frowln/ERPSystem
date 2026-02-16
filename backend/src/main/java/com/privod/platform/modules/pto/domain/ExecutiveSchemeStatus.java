package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ExecutiveSchemeStatus {

    DRAFT("Черновик"),
    VERIFIED("Проверена"),
    APPROVED("Утверждена"),
    REJECTED("Отклонена");

    private final String displayName;

    public boolean canTransitionTo(ExecutiveSchemeStatus target) {
        return switch (this) {
            case DRAFT -> target == VERIFIED;
            case VERIFIED -> target == APPROVED || target == REJECTED;
            case APPROVED -> false;
            case REJECTED -> target == DRAFT;
        };
    }
}
