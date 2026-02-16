package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClaimType {

    DELAY("Задержка"),
    DEFECT("Дефект"),
    OVERPAYMENT("Переплата"),
    WARRANTY("Гарантийный случай"),
    PENALTY("Штрафные санкции");

    private final String displayName;
}
