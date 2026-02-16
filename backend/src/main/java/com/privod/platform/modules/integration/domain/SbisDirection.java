package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SbisDirection {

    INCOMING("Входящий"),
    OUTGOING("Исходящий");

    private final String displayName;
}
