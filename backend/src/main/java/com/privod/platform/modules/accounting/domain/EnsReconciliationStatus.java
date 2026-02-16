package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnsReconciliationStatus {

    DRAFT("Черновик"),
    IN_PROGRESS("В процессе"),
    MATCHED("Совпадает"),
    DISCREPANCY("Расхождение"),
    RESOLVED("Урегулировано");

    private final String displayName;

    public boolean canTransitionTo(EnsReconciliationStatus target) {
        return switch (this) {
            case DRAFT -> target == IN_PROGRESS;
            case IN_PROGRESS -> target == MATCHED || target == DISCREPANCY;
            case DISCREPANCY -> target == RESOLVED;
            case MATCHED, RESOLVED -> false;
        };
    }
}
