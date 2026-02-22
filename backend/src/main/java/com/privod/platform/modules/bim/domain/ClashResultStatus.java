package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClashResultStatus {

    NEW("Новая"),
    ACTIVE("Активная"),
    RESOLVED("Решена"),
    IGNORED("Игнорируется");

    private final String displayName;
}
