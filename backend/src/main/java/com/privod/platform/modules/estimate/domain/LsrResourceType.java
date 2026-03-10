package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Cost element (resource) type within an LSR position.
 * Per Minstroy 421/pr methodology (RIM).
 */
@Getter
@RequiredArgsConstructor
public enum LsrResourceType {

    OT("Оплата труда рабочих"),
    EM("Эксплуатация машин"),
    ZT("Затраты труда машинистов"),
    M("Материалы"),
    NR("Накладные расходы"),
    SP("Сметная прибыль");

    private final String displayName;
}
