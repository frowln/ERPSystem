package com.privod.platform.modules.kep.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KepCertificateStatus {

    ACTIVE("Действующий"),
    EXPIRED("Истёк"),
    REVOKED("Отозван"),
    SUSPENDED("Приостановлен");

    private final String displayName;
}
