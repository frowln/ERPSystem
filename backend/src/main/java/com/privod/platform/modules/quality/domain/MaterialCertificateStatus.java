package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaterialCertificateStatus {

    VALID("Действителен"),
    EXPIRED("Просрочен"),
    REVOKED("Отозван"),
    PENDING_VERIFICATION("Ожидает проверки");

    private final String displayName;
}
