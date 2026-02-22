package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccessBlockStatus {

    ACTIVE("Активна"),
    RESOLVED("Снята");

    private final String displayName;
}
