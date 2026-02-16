package com.privod.platform.modules.costManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CommitmentType {

    PURCHASE_ORDER("Заказ на закупку"),
    SUBCONTRACT("Субподряд"),
    PROFESSIONAL_SERVICE("Профессиональные услуги");

    private final String displayName;
}
