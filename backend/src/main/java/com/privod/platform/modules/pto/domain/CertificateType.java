package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CertificateType {

    GOST("ГОСТ"),
    TU("ТУ"),
    ISO("ISO");

    private final String displayName;
}
