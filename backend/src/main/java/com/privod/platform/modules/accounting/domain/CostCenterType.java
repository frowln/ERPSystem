package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * P1-FIN-5: Classification of cost centers for tenant-aware budget allocation.
 */
@Getter
@RequiredArgsConstructor
public enum CostCenterType {

    PROJECT("Проект"),
    DEPARTMENT("Подразделение"),
    FUNCTIONAL("Функциональный центр затрат");

    private final String displayName;
}
