package com.privod.platform.modules.kep.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MchDStatus {

    ACTIVE("Действует"),
    EXPIRED("Истёк срок"),
    REVOKED("Отозвана"),
    SUSPENDED("Приостановлена");

    private final String displayName;
}
