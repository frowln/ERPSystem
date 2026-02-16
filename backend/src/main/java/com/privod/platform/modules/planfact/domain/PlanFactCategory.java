package com.privod.platform.modules.planfact.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PlanFactCategory {

    REVENUE("Выручка"),
    COST("Затраты"),
    MARGIN("Маржа"),
    MATERIALS("Материалы"),
    LABOR("Трудозатраты"),
    EQUIPMENT("Оборудование"),
    OVERHEAD("Накладные расходы");

    private final String displayName;
}
