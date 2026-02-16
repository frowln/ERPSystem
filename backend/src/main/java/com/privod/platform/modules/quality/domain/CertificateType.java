package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CertificateType {

    GOST("ГОСТ"),
    TU("Технические условия"),
    ISO("ISO"),
    CONFORMITY("Сертификат соответствия"),
    FIRE_SAFETY("Пожарная безопасность"),
    SANITARY("Санитарный сертификат");

    private final String displayName;
}
