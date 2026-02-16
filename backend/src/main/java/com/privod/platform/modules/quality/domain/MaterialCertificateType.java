package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaterialCertificateType {

    QUALITY("Качество"),
    CONFORMITY("Соответствие"),
    ORIGIN("Происхождение"),
    TEST("Испытания"),
    SAFETY("Безопасность"),
    GOST("ГОСТ"),
    ISO("ISO");

    private final String displayName;
}
