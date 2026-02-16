package com.privod.platform.modules.organization.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PartnerLegalStatus {

    ACTIVE("Действующее"),
    LIQUIDATING("В процессе ликвидации"),
    LIQUIDATED("Ликвидировано"),
    BANKRUPT("Банкрот");

    private final String displayName;
}
