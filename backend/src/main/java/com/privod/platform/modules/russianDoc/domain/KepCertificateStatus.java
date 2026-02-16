package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KepCertificateStatus {

    ACTIVE("Активен"),
    EXPIRED("Истёк"),
    REVOKED("Отозван");

    private final String displayName;
}
