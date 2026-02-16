package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermitStatus {

    ACTIVE("Действует"),
    EXPIRED("Истёк"),
    SUSPENDED("Приостановлен"),
    REVOKED("Отозван");

    private final String displayName;
}
