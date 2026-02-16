package com.privod.platform.modules.kep.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KepPriority {

    NORMAL("Обычный"),
    HIGH("Высокий"),
    URGENT("Срочный");

    private final String displayName;
}
