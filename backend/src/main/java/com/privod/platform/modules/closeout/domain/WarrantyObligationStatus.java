package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WarrantyObligationStatus {

    ACTIVE("Активна"),
    EXPIRING_SOON("Истекает"),
    EXPIRED("Истекла"),
    VOIDED("Аннулирована");

    private final String displayName;
}
