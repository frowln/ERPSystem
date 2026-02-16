package com.privod.platform.modules.legal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DecisionType {

    COURT_ORDER("Судебный приказ"),
    SETTLEMENT("Мировое соглашение"),
    MEDIATION("Медиация"),
    RULING("Решение суда");

    private final String displayName;
}
