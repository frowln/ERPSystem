package com.privod.platform.modules.organization.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EnrichmentSource {

    EGRUL("ЕГРЮЛ"),
    FNS("ФНС"),
    SPARK("СПАРК"),
    MANUAL("Вручную");

    private final String displayName;
}
