package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ResetPeriod {

    NEVER("Никогда"),
    YEARLY("Ежегодно"),
    MONTHLY("Ежемесячно");

    private final String displayName;
}
