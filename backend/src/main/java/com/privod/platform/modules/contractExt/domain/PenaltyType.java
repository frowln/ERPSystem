package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PenaltyType {

    FIXED("Фиксированная"),
    PERCENTAGE("Процент"),
    DAILY("Ежедневная");

    private final String displayName;
}
