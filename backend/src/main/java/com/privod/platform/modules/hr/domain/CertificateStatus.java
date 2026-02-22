package com.privod.platform.modules.hr.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CertificateStatus {

    VALID("Действителен"),
    EXPIRING("Истекает"),
    EXPIRED("Просрочен");

    private final String displayName;
}
