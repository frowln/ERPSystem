package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubstitutionType {

    FULL("Полная замена"),
    PARTIAL("Частичная замена"),
    CONDITIONAL("Условная замена");

    private final String displayName;
}
