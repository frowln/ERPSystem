package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CashFlowCategory {

    CONTRACT_PAYMENT("Оплата по договору"),
    MATERIAL_PURCHASE("Закупка материалов"),
    SALARY("Зарплата"),
    SUBCONTRACT("Субподряд"),
    TAX("Налоги"),
    EQUIPMENT("Оборудование"),
    OTHER("Прочее");

    private final String displayName;
}
