package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GuaranteeType {

    BANK("Банковская гарантия"),
    INSURANCE("Страховая гарантия"),
    DEPOSIT("Задаток"),
    WARRANTY("Гарантия качества");

    private final String displayName;
}
