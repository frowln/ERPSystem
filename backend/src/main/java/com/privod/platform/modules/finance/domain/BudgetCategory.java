package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BudgetCategory {

    MATERIALS("Материалы"),
    LABOR("Работа"),
    EQUIPMENT("Оборудование"),
    SUBCONTRACT("Субподряд"),
    OVERHEAD("Накладные расходы"),
    OTHER("Прочее");

    private final String displayName;
}
