package com.privod.platform.modules.mobile.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FieldReportStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлен"),
    REVIEWED("На проверке"),
    APPROVED("Утверждён");

    private final String displayName;

    public boolean canTransitionTo(FieldReportStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == REVIEWED || target == DRAFT;
            case REVIEWED -> target == APPROVED || target == SUBMITTED;
            case APPROVED -> false;
        };
    }
}
