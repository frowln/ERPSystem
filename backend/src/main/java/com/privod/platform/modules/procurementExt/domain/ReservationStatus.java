package com.privod.platform.modules.procurementExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReservationStatus {

    ACTIVE("Активна"),
    RELEASED("Снята"),
    EXPIRED("Истекла");

    private final String displayName;
}
