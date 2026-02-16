package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentType {

    INCOMING("Входящий"),
    OUTGOING("Исходящий");

    private final String displayName;
}
